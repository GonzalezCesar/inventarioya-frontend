import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  exito: "#34C759", // Verde confirmación
  error: "#FF3B30", // Rojo créditos/egresos
  cyan: "#00D1FF", // Barra progreso pago móvil
};

type VistaType = "resumen" | "ventas" | "creditos" | "caja";
type FiltroType = "ninguno" | "fecha" | "pagos" | "vendedor" | "producto";

export default function PantallaReportes() {
  const { user } = useAuth();
  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  // --- ESTADOS GLOBALES ---
  const [vistaActual, setVistaActual] = useState<VistaType>("resumen");
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE DATOS ---
  const [ventas, setVentas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  // Caja
  const [cajaActual, setCajaActual] = useState<any>(null);
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);
  const [historialCaja, setHistorialCaja] = useState<any[]>([]);

  // --- ESTADOS DE FILTROS ---
  const [filtroActivo, setFiltroActivo] = useState<FiltroType>("ninguno");
  const [rangoFecha, setRangoFecha] = useState<
    "hoy" | "semana" | "mes" | "historico" | "personalizado"
  >("hoy");
  const [filtroPago, setFiltroPago] = useState<string>("todos");
  const [filtroVendedor, setFiltroVendedor] = useState<string>("todos");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Fechas personalizadas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  // --- ESTADOS DE MODALES CAJA ---
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
      const [resVentas, resProds, resCaja, resHist, resUsers]: any =
        await Promise.all([
          api.get("/ventas").catch(() => []),
          api.get("/productos").catch(() => []),
          api.get("/caja").catch(() => null),
          api.get("/caja?action=historial").catch(() => []),
          esAdmin()
            ? api.get("/usuarios").catch(() => [])
            : Promise.resolve([]),
        ]);

      setVentas(resVentas || []);
      setProductos(resProds || []);
      setCajaActual(resCaja?.sesion || null);
      setMovimientosCaja(resCaja?.movimientos || []);
      setHistorialCaja(resHist || []);
      setUsuarios(resUsers || []);
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
  const formatearMoneda = (monto: any) => `$ ${Number(monto || 0).toFixed(2)}`;
  const formatearFechaHora = (fecha: string) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    return `${d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const normalizarMetodo = (str: string) => {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD") // Quita acentos (ó -> o)
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_") // Cambia espacios por guiones bajos
      .trim();
  };

  // --- LOGICA: FILTRADO GLOBAL DE VENTAS ---
  const ventasFiltradas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return ventas
      .filter((v) => {
        // Vendedor
        const vId = v.vendedorId || v.vendedor_id;
        if (!esAdmin()) {
          if (vId !== user?.id) return false;
        } else {
          if (filtroVendedor !== "todos" && vId !== filtroVendedor)
            return false;
        }

        // Pagos (USANDO EL NORMALIZADOR)
        const metodoVenta = normalizarMetodo(
          v.metodoPago || v.metodo_pago || "N/A",
        );
        const metodoFiltro = normalizarMetodo(filtroPago);
        if (filtroPago !== "todos" && metodoVenta !== metodoFiltro)
          return false;

        // Fecha
        if (!busquedaProducto) {
          const f = new Date(v.fecha);
          if (rangoFecha === "hoy" && f < hoy) return false;
          if (
            rangoFecha === "semana" &&
            f < new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
          )
            return false;
          if (
            rangoFecha === "mes" &&
            f < new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
          )
            return false;
          if (rangoFecha === "personalizado") {
            const inicio = new Date(fechaInicio);
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            if (f < inicio || f > fin) return false;
          }
        }

        // Producto
        if (busquedaProducto) {
          const search = busquedaProducto.toLowerCase();
          const tiene = v.items?.some((i: any) => {
            const pId = i.productoId || i.producto_id;
            const nombre =
              i.producto?.nombre ||
              i.producto_nombre ||
              i.nombre ||
              productos.find((p) => p.id === pId)?.nombre ||
              "";
            return nombre.toLowerCase().includes(search);
          });
          if (!tiene) return false;
        }
        return true;
      })
      .sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
  }, [
    ventas,
    rangoFecha,
    fechaInicio,
    fechaFin,
    filtroPago,
    filtroVendedor,
    busquedaProducto,
    esAdmin,
    user,
    productos,
  ]);

  // --- LOGICA: RESUMEN (KPIs) ---
  const kpis = useMemo(() => {
    let brutas = 0,
      costoTotal = 0;
    const porMetodo: any = {
      efectivo: 0,
      tarjeta: 0,
      pago_movil: 0,
      transferencia: 0,
    };
    const conteoProd: any = {};

    ventasFiltradas.forEach((v) => {
      const totalVenta = Number(v.total || 0);
      brutas += totalVenta;

      const metodo = v.metodoPago || v.metodo_pago || "otros";
      if (porMetodo[metodo] !== undefined) {
        porMetodo[metodo] += totalVenta;
      } else {
        porMetodo[metodo] = totalVenta;
      }

      (v.items || []).forEach((i: any) => {
        const pId = i.productoId || i.producto_id;
        const costo = Number(
          i.producto?.costo || productos.find((p) => p.id === pId)?.costo || 0,
        );
        costoTotal += costo * Number(i.cantidad || 0);

        const nombreProd =
          i.producto?.nombre ||
          i.producto_nombre ||
          i.nombre ||
          productos.find((p) => p.id === pId)?.nombre ||
          "Producto Desconocido";
        if (!conteoProd[pId])
          conteoProd[pId] = { nombre: nombreProd, total: 0 };
        conteoProd[pId].total += Number(i.subtotal || 0);
      });
    });

    const utilidad = brutas - costoTotal;
    const margen = brutas > 0 ? (utilidad / brutas) * 100 : 0;
    const top = Object.values(conteoProd)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5);

    return { brutas, utilidad, margen, porMetodo, top };
  }, [ventasFiltradas, productos]);

  // --- LOGICA: CAJA ---
  const calculosCaja = useMemo(() => {
    if (!cajaActual) return null;
    let ventasEf = 0,
      ventasBanco = 0,
      ventasPm = 0,
      ventasCr = 0,
      ing = 0,
      gas = 0;
    let totalIVA = 0,
      totalIGTF = 0;
    const fApertura = new Date(cajaActual.fecha_apertura);

    ventas
      .filter((v) => new Date(v.fecha) >= fApertura)
      .forEach((v) => {
        const m = v.metodoPago || v.metodo_pago;
        if (m === "efectivo") ventasEf += Number(v.total);
        if (m === "tarjeta" || m === "transferencia")
          ventasBanco += Number(v.total);
        if (m === "pago_movil") ventasPm += Number(v.total);
        if (m === "credito" || v.estadoPago === "pendiente")
          ventasCr += Number(v.montoRestante || v.total);

        totalIVA += Number(v.montoIVA || 0);
        totalIGTF += Number(v.montoIGTF || 0);
      });

    movimientosCaja.forEach((m) => {
      if (m.tipo === "ingreso") ing += parseFloat(m.monto);
      if (m.tipo === "egreso") gas += parseFloat(m.monto);
    });

    const base = parseFloat(cajaActual.monto_inicial);
    return {
      base,
      ventasEf,
      ventasBanco,
      ventasPm,
      ventasCr,
      ing,
      gas,
      totalIVA,
      totalIGTF,
      esperado: base + ventasEf + ing - gas,
    };
  }, [cajaActual, ventas, movimientosCaja]);

  // --- ACCIONES CAJA (API) ---
  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicialCaja);
    if (isNaN(monto)) return Alert.alert("Error", "Monto inválido");
    try {
      setCargando(true);
      await api.post("/caja", { action: "abrir", monto_inicial: monto });
      setMontoInicialCaja("");
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setCargando(false);
    }
  };

  const handleCerrarCaja = async () => {
    const montoDeclarado = parseFloat(montoCierre);
    if (isNaN(montoDeclarado)) return Alert.alert("Error", "Monto inválido");
    try {
      setCargando(true);
      await api.post("/caja", {
        action: "cerrar",
        id: cajaActual.id,
        monto_final_declarado: montoDeclarado,
        diferencia: montoDeclarado - (calculosCaja?.esperado || 0),
        notas: notasCierre,
        fondo_siguiente: parseFloat(fondoSiguiente) || 0,
      });
      setModalCierreVisible(false);
      setMontoCierre("");
      setNotasCierre("");
      setFondoSiguiente("");
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
        monto,
        descripcion: descMovimiento,
      });
      setModalMovimientoVisible(false);
      setMontoMovimiento("");
      setDescMovimiento("");
      cargarDatos();
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setCargando(false);
    }
  };

  // =======================================================================
  // RENDER: PESTAÑA RESUMEN
  // =======================================================================
  const renderVistaResumen = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      <View style={estilos.filaChipsFiltro}>
        {(["hoy", "semana", "mes"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              estilos.chipFiltroResumen,
              rangoFecha === r && estilos.chipFiltroActivo,
            ]}
            onPress={() => {
              setRangoFecha(r);
              setFiltroActivo("ninguno");
            }}
          >
            <Text
              style={[
                estilos.textoChip,
                rangoFecha === r && estilos.textoChipActivo,
              ]}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 15, marginBottom: 25 }}>
        <View
          style={[estilos.tarjetaKPI, { backgroundColor: COLORES.primario }]}
        >
          <Text style={[estilos.tituloKPI, { color: COLORES.textoOscuro }]}>
            VENTAS BRUTAS
          </Text>
          <Text style={[estilos.valorKPI, { color: COLORES.textoOscuro }]}>
            {formatearMoneda(kpis.brutas)}
          </Text>
        </View>
        <View
          style={[
            estilos.tarjetaKPI,
            {
              backgroundColor: COLORES.fondoTarjeta,
              borderWidth: 1,
              borderColor: COLORES.primario,
            },
          ]}
        >
          <Text style={[estilos.tituloKPI, { color: COLORES.primario }]}>
            UTILIDAD NETA
          </Text>
          <Text style={[estilos.valorKPI, { color: COLORES.primario }]}>
            {formatearMoneda(kpis.utilidad)}
          </Text>
          <Text style={{ color: COLORES.primario, fontSize: 12, marginTop: 5 }}>
            Margen: {kpis.margen.toFixed(1)}%
          </Text>
        </View>
      </View>

      <Text style={estilos.seccionTitulo}>Métodos de Pago</Text>
      <View
        style={{
          backgroundColor: COLORES.fondoTarjeta,
          padding: 20,
          borderRadius: 16,
          marginBottom: 25,
        }}
      >
        {Object.entries(kpis.porMetodo).map(([metodo, total]: any) => {
          if (total === 0) return null;
          const pct = kpis.brutas > 0 ? (total / kpis.brutas) * 100 : 0;
          let colorBarra = COLORES.primario;
          if (metodo === "pago_movil") colorBarra = COLORES.cyan;
          if (metodo === "tarjeta" || metodo === "transferencia")
            colorBarra = "#BF5AF2";

          return (
            <View key={metodo} style={{ marginBottom: 15 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ color: COLORES.textoBlanco, fontSize: 14 }}>
                  {(metodo || "N/A").replace("_", " ").toUpperCase()}
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
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: colorBarra,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
        {kpis.brutas === 0 && (
          <Text style={estilos.textoVacio}>No hay pagos registrados</Text>
        )}
      </View>

      <Text style={estilos.seccionTitulo}>Top Productos</Text>
      <View style={{ marginBottom: 40 }}>
        {kpis.top.length === 0 ? (
          <Text style={estilos.textoVacio}>No hay productos vendidos</Text>
        ) : (
          kpis.top.map((p: any, i: number) => (
            <View key={i} style={estilos.itemTopProducto}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: COLORES.primario,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  #{i + 1}
                </Text>
                <Text
                  style={{ color: COLORES.textoBlanco, fontSize: 16, flex: 1 }}
                  numberOfLines={1}
                >
                  {p.nombre}
                </Text>
              </View>
              <Text
                style={{
                  color: COLORES.primario,
                  fontWeight: "bold",
                  fontSize: 16,
                  marginLeft: 10,
                }}
              >
                {formatearMoneda(p.total)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  // =======================================================================
  // RENDER: PESTAÑA VENTAS (Con Filtros y Calendario)
  // =======================================================================
  const renderVistaVentas = () => (
    <View style={estilos.flex1}>
      <View style={estilos.contenedorFiltros}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 10,
            paddingHorizontal: 20,
            paddingBottom: 15,
          }}
        >
          <TouchableOpacity
            style={[
              estilos.botonFiltroPrincipal,
              filtroActivo === "fecha" && estilos.botonFiltroPrincipalActivo,
            ]}
            onPress={() =>
              setFiltroActivo(filtroActivo === "fecha" ? "ninguno" : "fecha")
            }
          >
            <FontAwesome5
              name="calendar-alt"
              size={16}
              color={
                filtroActivo === "fecha"
                  ? COLORES.textoOscuro
                  : COLORES.textoGris
              }
            />
            <Text
              style={[
                estilos.textoFiltroPrincipal,
                filtroActivo === "fecha" && { color: COLORES.textoOscuro },
              ]}
            >
              Fechas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              estilos.botonFiltroPrincipal,
              filtroActivo === "pagos" && estilos.botonFiltroPrincipalActivo,
            ]}
            onPress={() =>
              setFiltroActivo(filtroActivo === "pagos" ? "ninguno" : "pagos")
            }
          >
            <FontAwesome5
              name="credit-card"
              size={16}
              color={
                filtroActivo === "pagos"
                  ? COLORES.textoOscuro
                  : COLORES.textoGris
              }
            />
            <Text
              style={[
                estilos.textoFiltroPrincipal,
                filtroActivo === "pagos" && { color: COLORES.textoOscuro },
              ]}
            >
              Pagos
            </Text>
          </TouchableOpacity>
          {esAdmin() && (
            <TouchableOpacity
              style={[
                estilos.botonFiltroPrincipal,
                filtroActivo === "vendedor" &&
                  estilos.botonFiltroPrincipalActivo,
              ]}
              onPress={() =>
                setFiltroActivo(
                  filtroActivo === "vendedor" ? "ninguno" : "vendedor",
                )
              }
            >
              <FontAwesome5
                name="user-alt"
                size={16}
                color={
                  filtroActivo === "vendedor"
                    ? COLORES.textoOscuro
                    : COLORES.textoGris
                }
              />
              <Text
                style={[
                  estilos.textoFiltroPrincipal,
                  filtroActivo === "vendedor" && { color: COLORES.textoOscuro },
                ]}
              >
                Vendedor
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              estilos.botonFiltroPrincipal,
              filtroActivo === "producto" && estilos.botonFiltroPrincipalActivo,
            ]}
            onPress={() =>
              setFiltroActivo(
                filtroActivo === "producto" ? "ninguno" : "producto",
              )
            }
          >
            <FontAwesome5
              name="box"
              size={16}
              color={
                filtroActivo === "producto"
                  ? COLORES.textoOscuro
                  : COLORES.textoGris
              }
            />
          </TouchableOpacity>
        </ScrollView>

        {/* SUB-FILTROS DESPLEGABLES */}
        {filtroActivo === "fecha" && (
          <View style={estilos.panelSubFiltro}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, marginBottom: 15 }}
            >
              {(["hoy", "semana", "mes", "historico"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    estilos.chipFiltro,
                    rangoFecha === r && estilos.chipFiltroActivo,
                  ]}
                  onPress={() => setRangoFecha(r)}
                >
                  <Text
                    style={[
                      estilos.textoChip,
                      rangoFecha === r && estilos.textoChipActivo,
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* CALENDARIO SOLO SE MUESTRA EN 'HOY' O 'PERSONALIZADO' */}
            {(rangoFecha === "hoy" || rangoFecha === "personalizado") && (
              <>
                <Text
                  style={{
                    color: COLORES.textoGris,
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 10,
                    letterSpacing: 1,
                  }}
                >
                  Rango Personalizado
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      estilos.inputFecha,
                      showPickerInicio && estilos.inputFechaActivo,
                    ]}
                    onPress={() => setShowPickerInicio(true)}
                  >
                    <Text style={estilos.labelFecha}>DESDE</Text>
                    <Text style={estilos.valorFecha}>
                      {fechaInicio.toLocaleDateString("es-ES")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      estilos.inputFecha,
                      showPickerFin && estilos.inputFechaActivo,
                    ]}
                    onPress={() => setShowPickerFin(true)}
                  >
                    <Text style={estilos.labelFecha}>HASTA</Text>
                    <Text style={estilos.valorFecha}>
                      {fechaFin.toLocaleDateString("es-ES")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {(showPickerInicio || showPickerFin) && (
              <DateTimePicker
                value={showPickerInicio ? fechaInicio : fechaFin}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowPickerInicio(
                    Platform.OS === "ios" ? showPickerInicio : false,
                  );
                  setShowPickerFin(
                    Platform.OS === "ios" ? showPickerFin : false,
                  );
                  if (date) {
                    if (showPickerInicio) setFechaInicio(date);
                    else setFechaFin(date);
                    setRangoFecha("personalizado");
                  }
                }}
              />
            )}
          </View>
        )}
        {filtroActivo === "pagos" && (
          <View style={estilos.panelSubFiltro}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {[
                { id: "todos", label: "todos" },
                { id: "efectivo", label: "Efectivo" },
                { id: "tarjeta", label: "Tarjeta" },
                { id: "pago_movil", label: "Pago Móvil" },
                { id: "transferencia", label: "Transferencia" },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    estilos.chipFiltro,
                    filtroPago === p.id && estilos.chipFiltroActivo,
                  ]}
                  onPress={() => setFiltroPago(p.id)}
                >
                  <Text
                    style={[
                      estilos.textoChip,
                      filtroPago === p.id && estilos.textoChipActivo,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {filtroActivo === "vendedor" && esAdmin() && (
          <View style={estilos.panelSubFiltro}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              <TouchableOpacity
                style={[
                  estilos.chipFiltro,
                  filtroVendedor === "todos" && estilos.chipFiltroActivo,
                ]}
                onPress={() => setFiltroVendedor("todos")}
              >
                <Text
                  style={[
                    estilos.textoChip,
                    filtroVendedor === "todos" && estilos.textoChipActivo,
                  ]}
                >
                  TODOS
                </Text>
              </TouchableOpacity>
              {usuarios.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    estilos.chipFiltro,
                    filtroVendedor === u.id && estilos.chipFiltroActivo,
                  ]}
                  onPress={() => setFiltroVendedor(u.id)}
                >
                  <Text
                    style={[
                      estilos.textoChip,
                      filtroVendedor === u.id && estilos.textoChipActivo,
                    ]}
                  >
                    {u.nombre.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {filtroActivo === "producto" && (
          <View style={estilos.panelSubFiltro}>
            <TextInput
              style={estilos.inputBusquedaFiltro}
              placeholder="Buscar producto por nombre..."
              placeholderTextColor={COLORES.textoGris}
              value={busquedaProducto}
              onChangeText={setBusquedaProducto}
            />
          </View>
        )}
      </View>

      <FlatList
        data={ventasFiltradas}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={estilos.textoVacio}>
            No se encontraron ventas con estos filtros.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={estilos.itemVentaLista}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  color: COLORES.primario,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Venta #{item.id.toString().slice(-6)}
              </Text>
              <Text
                style={{
                  color: COLORES.textoGris,
                  fontSize: 12,
                  marginVertical: 4,
                }}
              >
                {formatearFechaHora(item.fecha)}
              </Text>
              <Text
                style={{ color: COLORES.textoBlanco, fontSize: 14 }}
                numberOfLines={1}
              >
                {item.items
                  ?.map((i: any) => {
                    const pId = i.productoId || i.producto_id;
                    const nombre =
                      i.producto?.nombre ||
                      i.producto_nombre ||
                      i.nombre ||
                      productos.find((p) => p.id === pId)?.nombre ||
                      "Prod";
                    return `${i.cantidad}x ${nombre}`;
                  })
                  .join(", ")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 5,
                }}
              >
                {formatearMoneda(item.total)}
              </Text>
              <View
                style={{
                  backgroundColor: COLORES.primario,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginBottom: 5,
                }}
              >
                <Text
                  style={{
                    color: COLORES.textoOscuro,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {(item.metodoPago || item.metodo_pago || "N/A").replace(
                    "_",
                    " ",
                  )}
                </Text>
              </View>
              {item.fotoComprobante && (
                <TouchableOpacity>
                  <Text
                    style={{
                      color: "rgb(100, 156, 60)",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    Ver Capture
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );

  // =======================================================================
  // RENDER: PESTAÑA CRÉDITOS
  // =======================================================================
  const renderVistaCreditos = () => {
    const creditos = ventas.filter(
      (v) =>
        (v.estadoPago === "pendiente" || v.estadoPago === "parcial") &&
        (esAdmin() || v.vendedorId === user?.id),
    );
    const totalCobrar = creditos.reduce(
      (acc, v) => acc + Number(v.montoRestante || 0),
      0,
    );

    return (
      <View style={estilos.flex1}>
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text
            style={{ color: COLORES.textoGris, fontSize: 16, marginBottom: 5 }}
          >
            Total por Cobrar
          </Text>
          <Text
            style={{ color: COLORES.error, fontSize: 40, fontWeight: "bold" }}
          >
            {formatearMoneda(totalCobrar)}
          </Text>
        </View>

        <FlatList
          data={creditos}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={estilos.textoVacio}>No hay créditos pendientes.</Text>
          }
          renderItem={({ item }) => (
            <View style={estilos.itemVentaLista}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {item.cliente?.nombre || "Cliente"}
                </Text>
                <Text
                  style={{
                    color: COLORES.textoGris,
                    fontSize: 12,
                    marginVertical: 4,
                  }}
                >
                  {formatearFechaHora(item.fecha)}
                </Text>
                <Text style={{ color: COLORES.textoGris, fontSize: 14 }}>
                  Total Venta: {formatearMoneda(item.total)}
                </Text>
              </View>
              <View
                style={{ alignItems: "flex-end", justifyContent: "center" }}
              >
                <Text
                  style={{
                    color: COLORES.error,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  DEBE
                </Text>
                <Text
                  style={{
                    color: COLORES.error,
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {formatearMoneda(item.montoRestante)}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORES.primario,
                    paddingHorizontal: 15,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginTop: 8,
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
      </View>
    );
  };

  // =======================================================================
  // RENDER: PESTAÑA CAJA
  // =======================================================================
  const renderVistaCaja = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      {!cajaActual ? (
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <FontAwesome5
            name="lock"
            size={60}
            color={COLORES.textoGris}
            style={{ marginBottom: 20 }}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: COLORES.textoBlanco,
            }}
          >
            Caja Cerrada
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORES.textoGris,
              textAlign: "center",
              marginTop: 10,
              marginBottom: 30,
            }}
          >
            Inicia turno ingresando el monto inicial en caja.
          </Text>
          <View style={{ width: "100%", marginBottom: 20 }}>
            <Text
              style={{
                color: COLORES.textoGris,
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              Monto Inicial (Efectivo)
            </Text>
            <TextInput
              style={estilos.inputGiganteCaja}
              value={montoInicialCaja}
              onChangeText={setMontoInicialCaja}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: COLORES.primario,
              padding: 18,
              borderRadius: 12,
              width: 200,
              alignItems: "center",
            }}
            onPress={handleAbrirCaja}
          >
            <Text
              style={{
                color: COLORES.textoOscuro,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              ABRIR CAJA
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: COLORES.fondoInput,
              padding: 15,
              borderRadius: 15,
            }}
          >
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORES.primario,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                gap: 6,
              }}
            >
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
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={[
                  estilos.cardCaja,
                  { backgroundColor: COLORES.primario },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                    color: COLORES.textoOscuro,
                  }}
                >
                  EFECTIVO
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: COLORES.textoOscuro,
                  }}
                >
                  {formatearMoneda(calculosCaja?.efectivoEsperado || 0)}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  Base: {formatearMoneda(calculosCaja?.baseInicial || 0)}
                </Text>
              </View>
              <View style={estilos.cardCaja}>
                <Text style={estilos.labelCaja}>BANCO (TRANS/TARJ)</Text>
                <Text style={estilos.montoCaja}>
                  {formatearMoneda(calculosCaja?.ventasTarjetaTransfer || 0)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={estilos.cardCaja}>
                <Text style={estilos.labelCaja}>PAGO MÓVIL</Text>
                <Text style={estilos.montoCaja}>
                  {formatearMoneda(calculosCaja?.ventasPagoMovil || 0)}
                </Text>
              </View>
              <View
                style={[
                  estilos.cardCaja,
                  {
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    borderWidth: 1,
                    borderColor: COLORES.error,
                  },
                ]}
              >
                <Text style={[estilos.labelCaja, { color: COLORES.error }]}>
                  POR COBRAR
                </Text>
                <Text style={[estilos.montoCaja, { color: COLORES.error }]}>
                  {formatearMoneda(calculosCaja?.ventasCredito || 0)}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              style={[estilos.botonCajaMin, { borderColor: COLORES.exito }]}
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
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: COLORES.exito,
                }}
              >
                INGRESO EXTRA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonCajaMin, { borderColor: COLORES.error }]}
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
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: COLORES.error,
                }}
              >
                EGRESO / GASTO
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginTop: 15,
              padding: 15,
              borderBottomWidth: 1,
              borderTopWidth: 1,
              borderColor: COLORES.borde,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: COLORES.textoGris,
                  fontSize: 10,
                  fontWeight: "bold",
                  marginBottom: 5,
                }}
              >
                TOTAL INGRESOS (+)
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: COLORES.exito,
                }}
              >
                {formatearMoneda(calculosCaja?.ingresosExtra || 0)}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: COLORES.textoGris,
                  fontSize: 10,
                  fontWeight: "bold",
                  marginBottom: 5,
                }}
              >
                TOTAL GASTOS (-)
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: COLORES.error,
                }}
              >
                {formatearMoneda(calculosCaja?.gastos || 0)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORES.error,
              marginTop: 30,
              borderRadius: 12,
              paddingVertical: 18,
              gap: 10,
            }}
            onPress={() => setModalCierreVisible(true)}
          >
            <FontAwesome5 name="cube" size={18} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "bold",
                letterSpacing: 0.5,
              }}
            >
              REALIZAR CORTE DE CAJA
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Historial Corto */}
      <View style={{ marginTop: 40, width: "100%" }}>
        <Text style={estilos.seccionTitulo}>Historial de Cajas</Text>

        {historialCaja.length === 0 ? (
          <Text style={estilos.textoVacio}>No se encontraron registros.</Text>
        ) : (
          historialCaja.map((c: any) => (
            <View
              key={c.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: COLORES.borde,
              }}
            >
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

  // =======================================================================
  // RENDER PRINCIPAL DEL ARCHIVO
  // =======================================================================
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
              zIndex: 100,
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      )}

      {/* HEADER TABS SUPERIOR */}
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
                vistaActual === vista && { backgroundColor: COLORES.primario },
              ]}
              onPress={() => setVistaActual(vista as VistaType)}
            >
              <Text
                style={[
                  {
                    color: COLORES.textoGris,
                    fontSize: 14,
                    fontWeight: "bold",
                  },
                  vistaActual === vista && { color: COLORES.textoOscuro },
                ]}
              >
                {vista.charAt(0).toUpperCase() + vista.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* VISTAS */}
      {vistaActual === "resumen" && renderVistaResumen()}
      {vistaActual === "ventas" && renderVistaVentas()}
      {vistaActual === "creditos" && renderVistaCreditos()}
      {vistaActual === "caja" && renderVistaCaja()}

      {/* MODALES DE CAJA (Ocultos si no se usan) */}
      <Modal visible={modalCierreVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalOverlay}
        >
          <View style={estilos.modalContenido}>
            <Text style={estilos.tituloModal}>Cierre de Caja</Text>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text
                style={{
                  color: COLORES.textoGris,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Efectivo Esperado (Sist.)
              </Text>
              <Text
                style={{
                  color: COLORES.textoBlanco,
                  fontSize: 32,
                  fontWeight: "bold",
                }}
              >
                {formatearMoneda(calculosCaja?.esperado || 0)}
              </Text>
            </View>
            <Text
              style={{
                color: COLORES.textoGris,
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              Efectivo Real (Contado)
            </Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoCierre}
              onChangeText={setMontoCierre}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />
            <Text
              style={{
                color: COLORES.textoGris,
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              Fondo Siguiente Turno
            </Text>
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={fondoSiguiente}
              onChangeText={setFondoSiguiente}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
            />
            <Text
              style={{
                color: COLORES.textoGris,
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              Notas Adicionales
            </Text>
            <TextInput
              style={[estilos.inputModal, { height: 60 }]}
              multiline
              value={notasCierre}
              onChangeText={setNotasCierre}
              placeholder="..."
              placeholderTextColor={COLORES.textoGris}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: COLORES.fondoInput,
                }}
                onPress={() => setModalCierreVisible(false)}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: COLORES.primario,
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
        </KeyboardAvoidingView>
      </Modal>

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
            <TextInput
              style={estilos.inputModal}
              keyboardType="decimal-pad"
              value={montoMovimiento}
              onChangeText={setMontoMovimiento}
              placeholder="Monto (0.00)"
              placeholderTextColor={COLORES.textoGris}
            />
            <TextInput
              style={estilos.inputModal}
              value={descMovimiento}
              onChangeText={setDescMovimiento}
              placeholder="Motivo / Descripción"
              placeholderTextColor={COLORES.textoGris}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: COLORES.fondoInput,
                }}
                onPress={() => setModalMovimientoVisible(false)}
              >
                <Text
                  style={{ color: COLORES.textoBlanco, fontWeight: "bold" }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    tipoMovimiento === "ingreso"
                      ? COLORES.exito
                      : COLORES.error,
                }}
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
  flex1: { flex: 1 },
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
  contenidoScroll: { padding: 20, paddingBottom: 100 },

  // Utilidades Compartidas
  seccionTitulo: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  textoVacio: { color: COLORES.textoGris, textAlign: "center", marginTop: 20 },
  filaChipsFiltro: { flexDirection: "row", gap: 10, marginBottom: 20 },

  // Chips Resumen (Bordes redondeados)
  chipFiltroResumen: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORES.fondoInput,
  },

  // Chips Filtros Ventas (Cuadrados y oscuros como en tu foto)
  chipFiltro: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipFiltroActivo: { backgroundColor: COLORES.primario },
  textoChip: { color: COLORES.textoGris, fontWeight: "bold", fontSize: 14 },
  textoChipActivo: { color: COLORES.textoOscuro },

  // Tarjetas Resumen
  tarjetaKPI: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 120,
  },
  tituloKPI: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  valorKPI: { fontSize: 32, fontWeight: "900" },
  itemTopProducto: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },

  // Filtros Ventas
  contenedorFiltros: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  botonFiltroPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  botonFiltroPrincipalActivo: { backgroundColor: COLORES.primario },
  textoFiltroPrincipal: {
    color: COLORES.textoGris,
    fontWeight: "bold",
    fontSize: 14,
  },
  panelSubFiltro: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORES.fondoOscuro,
  },
  inputBusquedaFiltro: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  inputFecha: {
    flex: 1,
    backgroundColor: COLORES.fondoOscuro,
    padding: 15,
    borderRadius: 8,
  },
  inputFechaActivo: { borderWidth: 1, borderColor: COLORES.primario },
  labelFecha: {
    fontSize: 10,
    color: COLORES.textoGris,
    marginBottom: 5,
    fontWeight: "bold",
  },
  valorFecha: { color: COLORES.textoBlanco, fontWeight: "bold", fontSize: 14 },

  // Lista Ventas/Creditos
  itemVentaLista: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Caja
  inputGiganteCaja: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    fontSize: 32,
    padding: 20,
    borderRadius: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  cardCaja: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    backgroundColor: COLORES.fondoTarjeta,
  },
  labelCaja: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 8,
    color: COLORES.textoBlanco,
  },
  montoCaja: { fontSize: 24, fontWeight: "bold", color: COLORES.textoBlanco },
  botonCajaMin: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
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
    marginBottom: 20,
    textAlign: "center",
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
});
