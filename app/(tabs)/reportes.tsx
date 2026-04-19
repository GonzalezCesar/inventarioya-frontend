import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO (Pixel Perfect) ---
const COLORES = {
  fondoOscuro: "#121212",
  fondoTarjeta: "#1E1E1E",
  fondoInput: "#1A1A1A",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  exito: "#34C759", // Verde para ingresos/diferencias positivas
  error: "#FF3B30", // Rojo para egresos/diferencias negativas
};

type VistaType = "resumen" | "ventas" | "creditos" | "caja";

export default function PantallaReportes() {
  const { user } = useAuth();
  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  // --- ESTADOS DE UI ---
  const [vistaActual, setVistaActual] = useState<VistaType>("caja"); // Iniciamos en Caja por defecto para trabajarla
  const [periodoResumen, setPeriodoResumen] = useState<
    "hoy" | "semana" | "mes"
  >("hoy");
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE DATOS ---
  const [ventas, setVentas] = useState<any[]>([]);
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);
  const [historialCaja, setHistorialCaja] = useState<any[]>([]);

  // --- ESTADOS DE CAJA MODALES ---
  const [montoInicialCaja, setMontoInicialCaja] = useState("");

  const [modalCierreVisible, setModalCierreVisible] = useState(false);
  const [montoCierre, setMontoCierre] = useState("");
  const [fondoSiguiente, setFondoSiguiente] = useState("");
  const [notasCierre, setNotasCierre] = useState("");

  const [modalMovimientoVisible, setModalMovimientoVisible] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<"ingreso" | "egreso">(
    "ingreso",
  );
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [descMovimiento, setDescMovimiento] = useState("");

  // --- CARGA DE DATOS ---
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resVentas, resCajaWrapper, resHist]: any = await Promise.all([
        api.get("/ventas").catch(() => []),
        api.get("/caja").catch(() => null),
        api.get("/caja?action=historial").catch(() => []),
      ]);

      setVentas(resVentas || []);
      setCajaActual(resCajaWrapper?.sesion || null);
      setMovimientosCaja(resCajaWrapper?.movimientos || []);
      setHistorialCaja(resHist || []);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  // --- UTILIDADES ---
  const formatearMoneda = (monto: number) => `$ ${(monto || 0).toFixed(2)}`;
  const formatearFechaHora = (fechaString: string) => {
    if (!fechaString) return "";
    const date = new Date(fechaString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- LÓGICA DE CAJA (Cálculos en vivo) ---
  const calculosCaja = useMemo(() => {
    if (!cajaActual) return null;

    let ventasEfectivo = 0;
    let ventasTarjetaTransfer = 0;
    let ventasPagoMovil = 0;
    let ventasCredito = 0;

    let totalIVA = 0;
    let totalIGTF = 0;

    // Filtramos las ventas de la sesión actual
    const fechaApertura = new Date(cajaActual.fecha_apertura);
    const ventasSesion = ventas.filter(
      (v) => new Date(v.fecha) >= fechaApertura,
    );

    ventasSesion.forEach((v) => {
      if (v.metodoPago === "efectivo") ventasEfectivo += v.total;
      if (v.metodoPago === "tarjeta" || v.metodoPago === "transferencia")
        ventasTarjetaTransfer += v.total;
      if (v.metodoPago === "pago_movil") ventasPagoMovil += v.total;
      if (
        v.metodoPago === "credito" ||
        v.estadoPago === "pendiente" ||
        v.estadoPago === "parcial"
      ) {
        // Si es credito, sumamos lo que quedo por cobrar a Credito
        ventasCredito += v.montoRestante || v.total;
        // Si pago un abono inicial, lo sumamos al metodo correspondiente
        if (v.metodoPago2 === "efectivo") ventasEfectivo += v.montoPagado || 0;
        if (v.metodoPago2 === "tarjeta" || v.metodoPago2 === "transferencia")
          ventasTarjetaTransfer += v.montoPagado || 0;
        if (v.metodoPago2 === "pago_movil")
          ventasPagoMovil += v.montoPagado || 0;
      }

      totalIVA += v.montoIVA || 0;
      totalIGTF += v.montoIGTF || 0;
    });

    let ingresosExtra = 0;
    let gastos = 0;

    movimientosCaja.forEach((m) => {
      if (m.tipo === "ingreso") ingresosExtra += parseFloat(m.monto);
      if (m.tipo === "egreso") gastos += parseFloat(m.monto);
    });

    const baseInicial = parseFloat(cajaActual.monto_inicial);
    const efectivoEsperado =
      baseInicial + ventasEfectivo + ingresosExtra - gastos;

    return {
      baseInicial,
      ventasEfectivo,
      ventasTarjetaTransfer,
      ventasPagoMovil,
      ventasCredito,
      totalIVA,
      totalIGTF,
      ingresosExtra,
      gastos,
      efectivoEsperado,
    };
  }, [cajaActual, ventas, movimientosCaja]);

  // --- ACCIONES CAJA API ---
  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicialCaja);
    if (isNaN(monto))
      return Alert.alert("Error", "Monto inválido. Ingrese un número.");

    try {
      setCargando(true);
      await api.post("/caja", { action: "abrir", monto_inicial: monto });
      setMontoInicialCaja("");
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo abrir la caja");
      setCargando(false);
    }
  };

  const handleCerrarCaja = async () => {
    const montoDeclarado = parseFloat(montoCierre);
    if (isNaN(montoDeclarado)) return Alert.alert("Error", "Monto inválido");

    try {
      setCargando(true);
      const efectivoEsperado = calculosCaja?.efectivoEsperado || 0;
      const diferencia = montoDeclarado - efectivoEsperado;
      const fondo = parseFloat(fondoSiguiente) || 0;

      await api.post("/caja", {
        action: "cerrar",
        id: cajaActual.id,
        monto_final_declarado: montoDeclarado,
        diferencia: diferencia,
        notas: notasCierre,
        fondo_siguiente: fondo,
      });

      setModalCierreVisible(false);
      setMontoCierre("");
      setNotasCierre("");
      setFondoSiguiente("");
      Alert.alert(
        "Caja Cerrada",
        `Se cerró la caja con una diferencia de ${formatearMoneda(diferencia)}`,
      );
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo cerrar la caja");
      setCargando(false);
    }
  };

  const handleMovimiento = async () => {
    const monto = parseFloat(montoMovimiento);
    if (isNaN(monto) || !descMovimiento)
      return Alert.alert("Error", "Datos inválidos");

    try {
      setCargando(true);
      await api.post("/caja", {
        action: "movimiento",
        caja_sesion_id: cajaActual.id,
        tipo: tipoMovimiento,
        monto: monto,
        descripcion: descMovimiento,
      });

      setModalMovimientoVisible(false);
      setMontoMovimiento("");
      setDescMovimiento("");
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Falló registro de movimiento");
      setCargando(false);
    }
  };

  // --- VISTAS ---
  // (Omito Resumen y Ventas para concentrarnos en la UI de Caja que pediste, pero siguen existiendo si las necesitas)

  const renderVistaCaja = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      {/* 1. CAJA CERRADA */}
      {!cajaActual ? (
        <View style={estilos.contenedorCajaCerrada}>
          <FontAwesome5
            name="lock"
            size={60}
            color={COLORES.textoGris}
            style={{ marginBottom: 20 }}
          />
          <Text style={estilos.tituloCajaCerrada}>Caja Cerrada</Text>
          <Text style={estilos.subtituloCajaCerrada}>
            Inicia turno ingresando el monto inicial en caja.
          </Text>

          <View style={estilos.inputContainerCaja}>
            <Text style={estilos.labelInput}>Monto Inicial (Efectivo)</Text>
            <TextInput
              style={estilos.inputGrande}
              value={montoInicialCaja}
              onChangeText={setMontoInicialCaja}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />
          </View>

          <TouchableOpacity
            style={estilos.botonAbrirCaja}
            onPress={handleAbrirCaja}
          >
            <Text style={estilos.textoBotonAccion}>ABRIR CAJA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 2. CAJA ABIERTA (SESIÓN EN CURSO) */
        <View>
          {/* HEADER SESION */}
          <View style={estilos.headerCajaAbierta}>
            <View>
              <Text
                style={{
                  color: COLORES.textoGris,
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                SESIÓN ACTUAL
              </Text>
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontSize: 14,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {formatearFechaHora(cajaActual.fecha_apertura)}
              </Text>
            </View>
            <View style={estilos.badgeAbierto}>
              <FontAwesome5
                name="check-circle"
                size={12}
                color={COLORES.textoOscuro}
              />
              <Text
                style={{
                  color: COLORES.textoOscuro,
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                EN CURSO
              </Text>
            </View>
          </View>

          {/* GRID 4 CUADROS */}
          <View style={estilos.gridCuentas}>
            <View style={estilos.filaCuentas}>
              <View
                style={[
                  estilos.cardCuenta,
                  { backgroundColor: COLORES.primario },
                ]}
              >
                <Text
                  style={[estilos.labelCuenta, { color: COLORES.textoOscuro }]}
                >
                  EFECTIVO
                </Text>
                <Text
                  style={[estilos.montoCuenta, { color: COLORES.textoOscuro }]}
                >
                  {formatearMoneda(calculosCaja?.efectivoEsperado || 0)}
                </Text>
                <Text
                  style={[estilos.sublabelCuenta, { color: "rgba(0,0,0,0.6)" }]}
                >
                  Base: {formatearMoneda(calculosCaja?.baseInicial || 0)}
                </Text>
              </View>
              <View style={estilos.cardCuenta}>
                <Text style={estilos.labelCuenta}>BANCO (TRANS/TARJ)</Text>
                <Text style={estilos.montoCuenta}>
                  {formatearMoneda(calculosCaja?.ventasTarjetaTransfer || 0)}
                </Text>
              </View>
            </View>
            <View style={estilos.filaCuentas}>
              <View style={estilos.cardCuenta}>
                <Text style={estilos.labelCuenta}>PAGO MÓVIL</Text>
                <Text style={estilos.montoCuenta}>
                  {formatearMoneda(calculosCaja?.ventasPagoMovil || 0)}
                </Text>
              </View>
              <View
                style={[
                  estilos.cardCuenta,
                  {
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    borderWidth: 1,
                    borderColor: COLORES.error,
                  },
                ]}
              >
                <Text style={[estilos.labelCuenta, { color: COLORES.error }]}>
                  POR COBRAR
                </Text>
                <Text style={[estilos.montoCuenta, { color: COLORES.error }]}>
                  {formatearMoneda(calculosCaja?.ventasCredito || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* BOTONES INGRESOS/EGRESOS */}
          <View style={estilos.contenedorAcciones}>
            <TouchableOpacity
              style={[estilos.botonMinimal, { borderColor: COLORES.exito }]}
              onPress={() => {
                setTipoMovimiento("ingreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text
                style={{ color: COLORES.exito, fontSize: 18, marginRight: 5 }}
              >
                +
              </Text>
              <Text
                style={[estilos.textoBotonMinimal, { color: COLORES.exito }]}
              >
                INGRESO EXTRA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonMinimal, { borderColor: COLORES.error }]}
              onPress={() => {
                setTipoMovimiento("egreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text
                style={{ color: COLORES.error, fontSize: 18, marginRight: 5 }}
              >
                -
              </Text>
              <Text
                style={[estilos.textoBotonMinimal, { color: COLORES.error }]}
              >
                EGRESO / GASTO
              </Text>
            </TouchableOpacity>
          </View>

          {/* TOTALES DE MOVIMIENTOS */}
          <View style={estilos.resumenMovimientos}>
            <View style={estilos.itemResumenMov}>
              <Text style={estilos.labelResumenMov}>TOTAL INGRESOS (+)</Text>
              <Text style={[estilos.valorResumenMov, { color: COLORES.exito }]}>
                {formatearMoneda(calculosCaja?.ingresosExtra || 0)}
              </Text>
            </View>
            <View style={estilos.itemResumenMov}>
              <Text style={estilos.labelResumenMov}>TOTAL GASTOS (-)</Text>
              <Text style={[estilos.valorResumenMov, { color: COLORES.error }]}>
                {formatearMoneda(calculosCaja?.gastos || 0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={estilos.botonCierreMaestro}
            onPress={() => setModalCierreVisible(true)}
          >
            <FontAwesome5 name="cube" size={18} color="#FFFFFF" />
            <Text style={estilos.textoBotonCierreMaestro}>
              REALIZAR CORTE DE CAJA
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. HISTORIAL DE CAJAS */}
      <View style={{ marginTop: 40, width: "100%" }}>
        <Text style={estilos.tituloSeccion}>Historial de Cajas</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity style={estilos.botonSelectorFecha}>
            <FontAwesome5
              name="calendar-alt"
              size={16}
              color={COLORES.textoOscuro}
            />
            <Text style={{ color: COLORES.textoOscuro, fontWeight: "bold" }}>
              Seleccionar Fecha
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botonFiltroUsuarioActivo}>
            <Text
              style={{
                color: COLORES.textoOscuro,
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              TODOS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botonFiltroUsuario}>
            <Text style={{ color: COLORES.textoGris, fontSize: 12 }}>
              CESAR
            </Text>
          </TouchableOpacity>
        </View>

        {historialCaja.length === 0 ? (
          <Text style={{ color: COLORES.textoGris, textAlign: "center" }}>
            No se encontraron registros.
          </Text>
        ) : (
          historialCaja.map((c: any) => (
            <View key={c.id} style={estilos.itemHistorial}>
              <View>
                <Text
                  style={{
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >
                  {formatearFechaHora(c.fecha_apertura)}
                </Text>
                <Text
                  style={{
                    color:
                      c.estado === "cerrada"
                        ? COLORES.textoGris
                        : COLORES.exito,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {c.estado === "cerrada"
                    ? `Cerrada: ${formatearFechaHora(c.fecha_cierre)}`
                    : "Apertura en Curso"}
                </Text>
                <Text
                  style={{ color: COLORES.exito, fontSize: 12, marginTop: 2 }}
                >
                  Apertura: {c.usuario_nombre || "Admin"}
                </Text>
              </View>
              <View
                style={{ alignItems: "flex-end", justifyContent: "center" }}
              >
                <Text
                  style={{
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {formatearMoneda(parseFloat(c.monto_final_declarado || 0))}
                </Text>
                {c.estado === "cerrada" && (
                  <Text
                    style={{
                      color:
                        (c.diferencia || 0) >= 0
                          ? COLORES.exito
                          : COLORES.error,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Dif: {(c.diferencia || 0) >= 0 ? "+" : ""}
                    {formatearMoneda(parseFloat(c.diferencia || 0))}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      {cargando && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(18,18,18,0.8)",
              zIndex: 10,
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      )}

      {/* HEADER TABS */}
      <View style={estilos.header}>
        <View style={estilos.selectorVista}>
          {(esAdmin()
            ? ["resumen", "ventas", "creditos", "caja"]
            : ["ventas", "caja"]
          ).map((vista) => (
            <TouchableOpacity
              key={vista}
              style={[
                estilos.botonVista,
                vistaActual === vista && estilos.botonVistaActivo,
              ]}
              onPress={() => setVistaActual(vista as VistaType)}
            >
              <Text
                style={[
                  estilos.textoBotonVista,
                  vistaActual === vista && estilos.textoBotonVistaActivo,
                ]}
              >
                {vista.charAt(0).toUpperCase() + vista.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BODY */}
      {vistaActual === "caja" && renderVistaCaja()}
      {/* (Aquí renderVistaResumen y Ventas, omitidas para enfocar en Caja) */}

      {/* --- MODAL: CIERRE DE CAJA --- */}
      <Modal visible={modalCierreVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalOverlay}
        >
          <View style={estilos.modalContenido}>
            <Text style={estilos.tituloModal}>Cierre de Caja</Text>
            <Text style={estilos.subtituloModal}>
              Cuenta el dinero físico en la caja e ingrésalo.
            </Text>

            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={estilos.labelInput}>Efectivo Esperado (Sist.)</Text>
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontSize: 32,
                  fontWeight: "bold",
                }}
              >
                {formatearMoneda(calculosCaja?.efectivoEsperado || 0)}
              </Text>
              <View style={{ flexDirection: "row", gap: 30, marginTop: 5 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: COLORES.textoGris, fontSize: 10 }}>
                    Total IVA
                  </Text>
                  <Text
                    style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                  >
                    {formatearMoneda(calculosCaja?.totalIVA || 0)}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: COLORES.textoGris, fontSize: 10 }}>
                    Total IGTF
                  </Text>
                  <Text
                    style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                  >
                    {formatearMoneda(calculosCaja?.totalIGTF || 0)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={estilos.labelInput}>Efectivo Real (Contado)</Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoCierre}
              onChangeText={setMontoCierre}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />

            <Text style={estilos.labelInput}>
              Fondo para Siguiente Turno (Opcional)
            </Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={fondoSiguiente}
              onChangeText={setFondoSiguiente}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />

            <Text style={estilos.labelInput}>Notas del Cierre</Text>
            <TextInput
              style={[
                estilos.inputModal,
                { height: 80, textAlignVertical: "top" },
              ]}
              multiline
              value={notasCierre}
              onChangeText={setNotasCierre}
              placeholder="Notas adicionales..."
              placeholderTextColor={COLORES.textoGris}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[
                  estilos.botonModal,
                  { backgroundColor: COLORES.fondoInput },
                ]}
                onPress={() => setModalCierreVisible(false)}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.botonModal,
                  { backgroundColor: COLORES.primario },
                ]}
                onPress={handleCerrarCaja}
              >
                <Text
                  style={{ color: COLORES.textoOscuro, fontWeight: "bold" }}
                >
                  Confirmar Cierre
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL: REGISTRAR INGRESO / EGRESO --- */}
      <Modal visible={modalMovimientoVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalOverlay}
        >
          <View style={estilos.modalContenido}>
            <Text style={estilos.tituloModal}>
              {tipoMovimiento === "ingreso"
                ? "Registrar Ingreso"
                : "Registrar Egreso"}
            </Text>
            <Text style={estilos.subtituloModal}>
              {tipoMovimiento === "ingreso"
                ? "Dinero extra entrando a caja."
                : "Dinero saliendo de caja."}
            </Text>

            <Text style={estilos.labelInput}>Monto</Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoMovimiento}
              onChangeText={setMontoMovimiento}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />

            <Text style={estilos.labelInput}>Descripción / Motivo</Text>
            <TextInput
              style={estilos.inputModal}
              value={descMovimiento}
              onChangeText={setDescMovimiento}
              placeholder={
                tipoMovimiento === "ingreso"
                  ? "Ej. Cambio inicial, Aporte extra"
                  : "Ej. Pago proveedor, Retiro parcial"
              }
              placeholderTextColor={COLORES.textoGris}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[
                  estilos.botonModal,
                  { backgroundColor: COLORES.fondoInput },
                ]}
                onPress={() => setModalMovimientoVisible(false)}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.botonModal,
                  {
                    backgroundColor:
                      tipoMovimiento === "ingreso"
                        ? COLORES.exito
                        : COLORES.error,
                  },
                ]}
                onPress={handleMovimiento}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Registrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORES.fondoOscuro,
  },
  selectorVista: {
    flexDirection: "row",
    backgroundColor: COLORES.fondoInput,
    borderRadius: 25,
    padding: 5,
  },
  botonVista: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  botonVistaActivo: { backgroundColor: COLORES.primario },
  textoBotonVista: {
    color: COLORES.textoGris,
    fontSize: 13,
    fontWeight: "bold",
  },
  textoBotonVistaActivo: { color: COLORES.textoOscuro },
  contenidoScroll: { padding: 20, paddingBottom: 100 },

  // Caja Cerrada
  contenedorCajaCerrada: { alignItems: "center", paddingTop: 40 },
  tituloCajaCerrada: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },
  subtituloCajaCerrada: {
    fontSize: 14,
    color: COLORES.textoGris,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  inputContainerCaja: { width: "100%", marginBottom: 20 },
  labelInput: { color: COLORES.textoGris, marginBottom: 8, fontSize: 12 },
  inputGrande: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    fontSize: 32,
    padding: 20,
    borderRadius: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  botonAbrirCaja: {
    backgroundColor: COLORES.primario,
    padding: 18,
    borderRadius: 12,
    width: 200,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotonAccion: {
    color: COLORES.textoOscuro,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Caja Abierta (Grid y Botones)
  headerCajaAbierta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: COLORES.fondoInput,
    padding: 15,
    borderRadius: 15,
  },
  badgeAbierto: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.primario,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  gridCuentas: { gap: 10 },
  filaCuentas: { flexDirection: "row", gap: 10 },
  cardCuenta: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    backgroundColor: COLORES.fondoTarjeta,
  },
  labelCuenta: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 8,
    color: COLORES.textoBlanco,
  },
  montoCuenta: { fontSize: 24, fontWeight: "bold", color: COLORES.textoBlanco },
  sublabelCuenta: { fontSize: 10, marginTop: 4 },

  contenedorAcciones: { flexDirection: "row", gap: 10, marginTop: 20 },
  botonMinimal: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  textoBotonMinimal: { fontSize: 12, fontWeight: "bold" },

  resumenMovimientos: {
    flexDirection: "row",
    marginTop: 15,
    padding: 15,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: COLORES.borde,
  },
  itemResumenMov: { flex: 1, alignItems: "center" },
  labelResumenMov: {
    color: COLORES.textoGris,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  valorResumenMov: { fontSize: 16, fontWeight: "bold" },

  botonCierreMaestro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORES.error,
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 18,
    gap: 10,
  },
  textoBotonCierreMaestro: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Historial
  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  botonSelectorFecha: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.primario,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    marginRight: 10,
  },
  botonFiltroUsuarioActivo: {
    backgroundColor: COLORES.primario,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: "center",
  },
  botonFiltroUsuario: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
  },
  itemHistorial: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContenido: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 25,
    borderRadius: 20,
  },
  tituloModal: {
    color: COLORES.textoBlanco,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtituloModal: {
    color: COLORES.textoGris,
    textAlign: "center",
    marginBottom: 25,
    fontSize: 14,
  },
  inputModal: {
    backgroundColor: COLORES.fondoOscuro,
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  botonModal: { flex: 1, padding: 15, borderRadius: 10, alignItems: "center" },
});
