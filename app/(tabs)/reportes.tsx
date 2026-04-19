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
  View
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
  acentoVerde: "#34C759",
};

const API_URL = "http://192.168.1.111:8000";

type VistaType = "resumen" | "ventas" | "creditos" | "caja";

export default function PantallaReportes() {
  const { user } = useAuth();
  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  // --- ESTADOS DE UI ---
  const [vistaActual, setVistaActual] = useState<VistaType>("resumen");
  const [periodoResumen, setPeriodoResumen] = useState<
    "hoy" | "semana" | "mes"
  >("hoy");
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE DATOS ---
  const [ventas, setVentas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);
  const [historialCaja, setHistorialCaja] = useState<any[]>([]);

  // --- ESTADOS DE CAJA MODALES ---
  const [montoInicialCaja, setMontoInicialCaja] = useState("");
  const [modalCierreVisible, setModalCierreVisible] = useState(false);
  const [montoCierre, setMontoCierre] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<"ingreso" | "egreso">(
    "ingreso",
  );
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [descMovimiento, setDescMovimiento] = useState("");

  // --- ESTADOS DE ABONO ---
  const [modalAbonoVisible, setModalAbonoVisible] = useState(false);
  const [ventaAbono, setVentaAbono] = useState<any>(null);

  // --- CARGA DE DATOS CENTRALIZADA ---
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resVentas, resProds, resCajaWrapper, resHist]: any =
        await Promise.all([
          api.get("/ventas").catch(() => []),
          api.get("/productos").catch(() => []),
          // CORRECCIÓN 1: La ruta de caja y la estructura de respuesta
          api.get("/caja").catch(() => null),
          // CORRECCIÓN 2: Historial por query param
          api.get("/caja?action=historial").catch(() => []),
        ]);

      setVentas(resVentas || []);
      setProductos(resProds || []);

      // El backend devuelve { sesion: {...}, movimientos: [...] }
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
  const formatearFechaHora = (fecha: string) =>
    new Date(fecha).toLocaleString();

  // --- LÓGICA VISTA RESUMEN ---
  const ventasResumen = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return ventas.filter((v) => {
      if (!esAdmin() && v.vendedorId !== user?.id) return false;
      const fecha = new Date(v.fecha);
      if (periodoResumen === "hoy") return fecha >= hoy;
      if (periodoResumen === "semana")
        return fecha >= new Date(hoy.setDate(hoy.getDate() - 7));
      if (periodoResumen === "mes")
        return fecha >= new Date(hoy.setDate(hoy.getDate() - 30));
      return true;
    });
  }, [ventas, periodoResumen, user, esAdmin]);

  const kpis = useMemo(() => {
    let brutas = 0,
      costoTotal = 0,
      porMetodo: any = {
        efectivo: 0,
        tarjeta: 0,
        pago_movil: 0,
        transferencia: 0,
      };
    ventasResumen.forEach((v) => {
      brutas += v.total || 0;
      if (porMetodo[v.metodoPago] !== undefined)
        porMetodo[v.metodoPago] += v.total;
      (v.items || []).forEach((item: any) => {
        const costo =
          productos.find((p) => p.id === item.productoId)?.costo || 0;
        costoTotal += costo * item.cantidad;
      });
    });
    const utilidad = brutas - costoTotal;
    const margen = brutas > 0 ? (utilidad / brutas) * 100 : 0;
    return { brutas, utilidad, margen, porMetodo };
  }, [ventasResumen, productos]);

  const topProductos = useMemo(() => {
    const conteo: any = {};
    ventasResumen.forEach((v) => {
      (v.items || []).forEach((item: any) => {
        const id = item.productoId;
        if (!conteo[id])
          conteo[id] = {
            nombre: item.producto?.nombre || "Desconocido",
            total: 0,
          };
        conteo[id].total += item.subtotal;
      });
    });
    return Object.values(conteo)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5);
  }, [ventasResumen]);

  // --- LÓGICA VISTA CRÉDITOS ---
  const creditos = useMemo(() => {
    return ventas.filter(
      (v) =>
        (v.estadoPago === "pendiente" || v.estadoPago === "parcial") &&
        (esAdmin() || v.vendedorId === user?.id),
    );
  }, [ventas, esAdmin, user]);

  const totalCobrar = creditos.reduce(
    (acc, v) => acc + (v.montoRestante || 0),
    0,
  );

  // --- ACCIONES CAJA CONECTADAS AL BACKEND ---
  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicialCaja);
    if (isNaN(monto))
      return Alert.alert("Error", "Monto inválido. Ingrese un número.");

    try {
      setCargando(true);
      // CORRECCIÓN 3: POST a /caja con action: 'abrir'
      await api.post("/caja", { action: "abrir", monto_inicial: monto });
      setMontoInicialCaja("");
      cargarDatos();
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir la caja");
      setCargando(false);
    }
  };

  const handleCerrarCaja = async () => {
    const montoDeclarado = parseFloat(montoCierre);
    if (isNaN(montoDeclarado)) return Alert.alert("Error", "Monto inválido");

    try {
      setCargando(true);
      // Calculamos un estimado rápido de diferencia
      let ingresosEfectivo = 0;
      let egresosEfectivo = 0;
      movimientosCaja.forEach((m) => {
        if (m.tipo === "ingreso") ingresosEfectivo += parseFloat(m.monto);
        if (m.tipo === "egreso") egresosEfectivo += parseFloat(m.monto);
      });
      const ventasEfectivo = kpis.porMetodo.efectivo || 0; // Aproximado del día
      const efectivoEsperado =
        parseFloat(cajaActual.monto_inicial) +
        ventasEfectivo +
        ingresosEfectivo -
        egresosEfectivo;
      const diferencia = montoDeclarado - efectivoEsperado;

      // CORRECCIÓN 4: POST a /caja con action: 'cerrar'
      await api.post("/caja", {
        action: "cerrar",
        id: cajaActual.id,
        monto_final_declarado: montoDeclarado,
        diferencia: diferencia,
        notas: notasCierre,
      });

      setModalCierreVisible(false);
      setMontoCierre("");
      setNotasCierre("");
      cargarDatos();
    } catch (e) {
      Alert.alert("Error", "No se pudo cerrar la caja");
      setCargando(false);
    }
  };

  const handleMovimiento = async () => {
    const monto = parseFloat(montoMovimiento);
    if (isNaN(monto) || !descMovimiento)
      return Alert.alert("Error", "Datos inválidos");

    try {
      setCargando(true);
      // CORRECCIÓN 5: POST a /caja con action: 'movimiento'
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
    } catch (e) {
      Alert.alert("Error", "Falló registro de movimiento");
      setCargando(false);
    }
  };

  // --- RENDERIZADOS ESPECÍFICOS ---
  const renderVistaResumen = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      <View style={estilos.selectorPeriodo}>
        {(["hoy", "semana", "mes"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              estilos.botonPeriodo,
              periodoResumen === p && estilos.botonPeriodoActivo,
            ]}
            onPress={() => setPeriodoResumen(p)}
          >
            <Text
              style={[
                estilos.textoPeriodo,
                periodoResumen === p && estilos.textoPeriodoActivo,
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={estilos.filaTarjetas}>
        <View style={estilos.tarjetaNeon}>
          <Text style={estilos.tituloTarjetaNeon}>VENTAS BRUTAS</Text>
          <Text style={estilos.valorTarjetaNeon}>
            {formatearMoneda(kpis.brutas)}
          </Text>
          <FontAwesome5
            name="dollar-sign"
            size={80}
            color="rgba(0,0,0,0.05)"
            style={estilos.marcaAgua}
          />
        </View>

        <View style={estilos.tarjetaOscura}>
          <Text style={estilos.tituloTarjetaOscura}>UTILIDAD NETA</Text>
          <Text style={estilos.valorTarjetaOscura}>
            {formatearMoneda(kpis.utilidad)}
          </Text>
          <Text style={estilos.subtituloTarjetaOscura}>
            Margen: {kpis.margen.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={estilos.seccionTop}>
        <Text style={estilos.tituloSeccion}>Métodos de Pago</Text>
        {Object.entries(kpis.porMetodo).map(([metodo, total]: any) => {
          if (total === 0) return null;
          const perc = kpis.brutas > 0 ? (total / kpis.brutas) * 100 : 0;
          return (
            <View key={metodo} style={{ marginBottom: 15 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ color: COLORES.textoGris, fontSize: 14 }}>
                  {metodo.toUpperCase().replace("_", " ")}
                </Text>
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  {formatearMoneda(total)}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 3,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${perc}%`,
                    backgroundColor: COLORES.primario,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={[estilos.seccionTop, { marginTop: 15 }]}>
        <Text style={estilos.tituloSeccion}>Top Productos</Text>
        {topProductos.length === 0 ? (
          <Text style={estilos.textoVacio}>No hay datos</Text>
        ) : (
          topProductos.map((p: any, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: COLORES.borde,
              }}
            >
              <Text style={{ color: COLORES.textoBlanco }}>
                #{i + 1} {p.nombre}
              </Text>
              <Text style={{ color: COLORES.primario, fontWeight: "bold" }}>
                {formatearMoneda(p.total)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderVistaVentas = () => (
    <View style={estilos.flex1}>
      {ventas.length === 0 ? (
        <View style={estilos.estadoVacio}>
          <Text style={estilos.textoVacio}>No hay ventas registradas aún.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          data={ventas}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORES.fondoTarjeta,
                padding: 15,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ color: COLORES.primario, fontWeight: "bold" }}>
                  Venta #{item.id.slice(-6)}
                </Text>
                <Text
                  style={{
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {formatearMoneda(item.total)}
                </Text>
              </View>
              <Text style={{ color: COLORES.textoGris, fontSize: 12 }}>
                {formatearFechaHora(item.fecha)}
              </Text>
              <Text
                style={{ color: COLORES.textoGris, fontSize: 12, marginTop: 5 }}
              >
                Método: {item.metodoPago.toUpperCase()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderVistaCreditos = () => (
    <View style={estilos.flex1}>
      <View style={estilos.resumenCreditos}>
        <Text style={estilos.tituloResumenCreditos}>Total por Cobrar</Text>
        <Text style={estilos.montoResumenCreditos}>
          {formatearMoneda(totalCobrar)}
        </Text>
      </View>
      {creditos.length === 0 ? (
        <View style={estilos.estadoVacio}>
          <Text style={estilos.textoVacio}>No hay créditos pendientes.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          data={creditos}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORES.fondoTarjeta,
                padding: 15,
                borderRadius: 12,
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  {item.cliente?.nombre || "Cliente"}
                </Text>
                <Text style={{ color: COLORES.textoGris, fontSize: 12 }}>
                  Total: {formatearMoneda(item.total)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: COLORES.error, fontSize: 10 }}>DEBE</Text>
                <Text
                  style={{
                    color: COLORES.error,
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  {formatearMoneda(item.montoRestante)}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORES.primario,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 5,
                    marginTop: 5,
                  }}
                  onPress={() => {
                    setVentaAbono(item);
                    setModalAbonoVisible(true);
                  }}
                >
                  <Text
                    style={{
                      color: COLORES.textoOscuro,
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    Abonar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderVistaCaja = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, padding: 20 }}
    >
      {!cajaActual ? (
        <View style={estilos.contenedorCajaCerrada}>
          <FontAwesome5 name="lock" size={50} color={COLORES.textoGris} />
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
            style={estilos.botonAccionPrincipal}
            onPress={handleAbrirCaja}
          >
            <Text style={estilos.textoBotonAccion}>ABRIR CAJA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View
            style={{
              backgroundColor: COLORES.fondoTarjeta,
              padding: 15,
              borderRadius: 15,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: COLORES.textoGris,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              SESIÓN EN CURSO
            </Text>
            <Text
              style={{
                color: COLORES.textoBlanco,
                fontSize: 16,
                fontWeight: "bold",
                marginTop: 5,
              }}
            >
              {formatearFechaHora(cajaActual.fecha_apertura)}
            </Text>
            <View
              style={{
                marginTop: 15,
                padding: 15,
                backgroundColor: COLORES.fondoOscuro,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: COLORES.textoGris, fontSize: 12 }}>
                Efectivo Base Inicial
              </Text>
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                {formatearMoneda(parseFloat(cajaActual.monto_inicial))}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: COLORES.acentoVerde,
                padding: 15,
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={() => {
                setTipoMovimiento("ingreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text style={{ color: COLORES.acentoVerde, fontWeight: "bold" }}>
                + Ingreso Extra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: COLORES.error,
                padding: 15,
                borderRadius: 10,
                alignItems: "center",
              }}
              onPress={() => {
                setTipoMovimiento("egreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text style={{ color: COLORES.error, fontWeight: "bold" }}>
                - Retiro / Gasto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Movimientos de la caja actual */}
          {movimientosCaja.length > 0 && (
            <View
              style={{
                marginBottom: 20,
                backgroundColor: COLORES.fondoTarjeta,
                padding: 15,
                borderRadius: 15,
              }}
            >
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                Movimientos de Hoy
              </Text>
              {movimientosCaja.map((mov) => (
                <View
                  key={mov.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORES.borde,
                  }}
                >
                  <Text style={{ color: COLORES.textoGris }}>
                    {mov.descripcion}
                  </Text>
                  <Text
                    style={{
                      color:
                        mov.tipo === "ingreso"
                          ? COLORES.acentoVerde
                          : COLORES.error,
                      fontWeight: "bold",
                    }}
                  >
                    {mov.tipo === "ingreso" ? "+" : "-"}
                    {formatearMoneda(parseFloat(mov.monto))}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: COLORES.error,
              padding: 15,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={() => setModalCierreVisible(true)}
          >
            <Text style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}>
              CERRAR CAJA
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Historial Corto */}
      <View style={{ marginTop: 40, width: "100%" }}>
        <Text style={estilos.tituloSeccion}>Historial de Cajas Pasadas</Text>
        {historialCaja.length === 0 ? (
          <Text style={estilos.textoVacio}>No hay registros.</Text>
        ) : (
          historialCaja.map((c: any) => (
            <View
              key={c.id}
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderColor: COLORES.borde,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  {formatearFechaHora(c.fecha_apertura)}
                </Text>
                <Text style={{ color: COLORES.textoGris, fontSize: 12 }}>
                  Por: {c.vendedor_nombre || "Admin"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color:
                      c.estado === "cerrada"
                        ? COLORES.acentoVerde
                        : COLORES.primario,
                  }}
                >
                  {c.estado === "cerrada" ? "CERRADA" : "ABIERTA"}
                </Text>
                {c.estado === "cerrada" && (
                  <Text
                    style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                  >
                    {formatearMoneda(parseFloat(c.monto_final_declarado))}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  // --- RENDER PRINCIPAL ---
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
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 10,
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      )}

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

      {vistaActual === "resumen" && renderVistaResumen()}
      {vistaActual === "ventas" && renderVistaVentas()}
      {vistaActual === "creditos" && renderVistaCreditos()}
      {vistaActual === "caja" && renderVistaCaja()}

      {/* --- MODALES --- */}
      <Modal visible={modalCierreVisible} transparent animationType="slide">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContenido}>
            <Text
              style={{
                color: COLORES.textoBlanco,
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Cierre de Caja
            </Text>
            <Text style={estilos.labelInput}>Efectivo Físico en Caja</Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoCierre}
              onChangeText={setMontoCierre}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />
            <Text style={estilos.labelInput}>Notas o Novedades</Text>
            <TextInput
              style={[estilos.inputModal, { height: 80 }]}
              multiline
              value={notasCierre}
              onChangeText={setNotasCierre}
              placeholder="Escriba aquí..."
              placeholderTextColor={COLORES.textoGris}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 15, alignItems: "center" }}
                onPress={() => setModalCierreVisible(false)}
              >
                <Text style={{ color: COLORES.textoGris }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  backgroundColor: COLORES.primario,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handleCerrarCaja}
              >
                <Text
                  style={{ color: COLORES.textoOscuro, fontWeight: "bold" }}
                >
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalMovimientoVisible} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContenido}>
            <Text
              style={{
                color: COLORES.textoBlanco,
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {tipoMovimiento === "ingreso"
                ? "Registrar Ingreso"
                : "Registrar Egreso"}
            </Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoMovimiento}
              onChangeText={setMontoMovimiento}
              placeholder="Monto"
              placeholderTextColor={COLORES.textoGris}
            />
            <TextInput
              style={estilos.inputModal}
              value={descMovimiento}
              onChangeText={setDescMovimiento}
              placeholder="Motivo/Descripción"
              placeholderTextColor={COLORES.textoGris}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 15, alignItems: "center" }}
                onPress={() => setModalMovimientoVisible(false)}
              >
                <Text style={{ color: COLORES.textoGris }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  backgroundColor:
                    tipoMovimiento === "ingreso"
                      ? COLORES.acentoVerde
                      : COLORES.error,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handleMovimiento}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  flex1: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORES.fondoOscuro,
  },
  selectorVista: {
    flexDirection: "row",
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 25,
    padding: 5,
  },
  botonVista: {
    flex: 1,
    paddingVertical: 10,
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
  selectorPeriodo: { flexDirection: "row", gap: 10, marginBottom: 20 },
  botonPeriodo: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORES.fondoTarjeta,
  },
  botonPeriodoActivo: { backgroundColor: COLORES.primario },
  textoPeriodo: { color: COLORES.textoGris, fontWeight: "bold", fontSize: 12 },
  textoPeriodoActivo: { color: COLORES.textoOscuro },
  filaTarjetas: { flexDirection: "row", gap: 15, marginBottom: 20 },
  tarjetaNeon: {
    flex: 1,
    backgroundColor: COLORES.primario,
    padding: 15,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 110,
    justifyContent: "center",
  },
  tituloTarjetaNeon: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
    letterSpacing: 1,
    marginBottom: 10,
  },
  valorTarjetaNeon: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
  },
  marcaAgua: { position: "absolute", right: -10, bottom: -10 },
  tarjetaOscura: {
    flex: 1,
    backgroundColor: COLORES.fondoOscuro,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.primario,
    justifyContent: "center",
  },
  tituloTarjetaOscura: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORES.primario,
    letterSpacing: 1,
    marginBottom: 10,
  },
  valorTarjetaOscura: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.primario,
  },
  subtituloTarjetaOscura: {
    fontSize: 12,
    color: COLORES.primario,
    marginTop: 5,
  },
  seccionTop: {
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 16,
    padding: 15,
  },
  tituloSeccion: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  resumenCreditos: { alignItems: "center", paddingVertical: 30 },
  tituloResumenCreditos: {
    color: COLORES.textoGris,
    fontSize: 14,
    marginBottom: 5,
  },
  montoResumenCreditos: {
    color: COLORES.error,
    fontSize: 36,
    fontWeight: "bold",
  },
  contenedorCajaCerrada: { alignItems: "center", paddingTop: 40 },
  tituloCajaCerrada: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginTop: 20,
  },
  subtituloCajaCerrada: {
    fontSize: 14,
    color: COLORES.textoGris,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  inputContainerCaja: { width: "100%", marginBottom: 20 },
  labelInput: { color: COLORES.textoGris, marginBottom: 10, fontSize: 12 },
  inputGrande: {
    backgroundColor: COLORES.fondoTarjeta,
    color: COLORES.textoBlanco,
    fontSize: 24,
    padding: 15,
    borderRadius: 12,
    textAlign: "center",
  },
  botonAccionPrincipal: {
    backgroundColor: COLORES.primario,
    padding: 18,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  textoBotonAccion: {
    color: COLORES.textoOscuro,
    fontWeight: "bold",
    fontSize: 16,
  },
  estadoVacio: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoVacio: { color: COLORES.textoGris, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContenido: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 15,
  },
  inputModal: {
    backgroundColor: COLORES.fondoOscuro,
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
});
