import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
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
import { API_URL } from "../../config/env";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";
import { TouchableWithoutFeedback } from "react-native";
import { Keyboard } from "react-native";

type VistaType = "resumen" | "ventas" | "creditos" | "caja";
type FiltroType = "ninguno" | "fecha" | "pagos" | "vendedor" | "producto";

export default function PantallaReportes() {
  const { user } = useAuth();
  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  const { colores, isDark } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [vistaActual, setVistaActual] = useState<VistaType>("resumen");
  const [cargando, setCargando] = useState(true);

  const [ventas, setVentas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [cajaActual, setCajaActual] = useState<any>(null);
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);
  const [historialCaja, setHistorialCaja] = useState<any[]>([]);

  const [filtroActivo, setFiltroActivo] = useState<FiltroType>("ninguno");
  const [rangoFecha, setRangoFecha] = useState<
    "hoy" | "semana" | "mes" | "historico" | "personalizado"
  >("hoy");
  const [filtroPago, setFiltroPago] = useState<string>("todos");
  const [filtroVendedor, setFiltroVendedor] = useState<string>("todos");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

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

  const [comprobanteVisible, setComprobanteVisible] = useState<string | null>(
    null,
  );
  const [verComprobante, setVerComprobante] = useState<string | null>(null);
  const [verComprobanteAbono, setVerComprobanteAbono] = useState<string | null>(null);

  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState<any>(null);

  const [modalAbonoVisible, setModalAbonoVisible] = useState(false);
  const [ventaAbonando, setVentaAbonando] = useState<any>(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [metodoAbono, setMetodoAbono] = useState<string>("efectivo");
  const [referenciaAbono, setReferenciaAbono] = useState("");
  const [imagenAbono, setImagenAbono] = useState<string | null>(null);

  const [modalHistorialVisible, setModalHistorialVisible] = useState(false);
  const [ventaHistorial, setVentaHistorial] = useState<any>(null);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [clientesBD, setClientesBD] = useState<any[]>([]);

  const [modalReporteVisible, setModalReporteVisible] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [reportePorFecha, setReportePorFecha] = useState(false);

  const [fechaInicioReporte, setFechaInicioReporte] = useState(new Date());
  const [fechaFinReporte, setFechaFinReporte] = useState(new Date());
  const [showPickerInicioReporte, setShowPickerInicioReporte] = useState(false);
  const [showPickerFinReporte, setShowPickerFinReporte] = useState(false);

  const cargarReporte = async (sessionId: string) => {
    setCargandoReporte(true);
    setReportePorFecha(false);
    setModalReporteVisible(true);
    try {
      const res: any = await api.get(`/caja/reporte?id=${sessionId}`);
      setReporteData(res);
    } catch (e) {
      console.error("Error cargando reporte:", e);
      Alert.alert("Error", "No se pudo cargar el reporte de caja.");
      setModalReporteVisible(false);
    } finally {
      setCargandoReporte(false);
    }
  };

  const cargarReportePorFecha = async () => {
    setCargandoReporte(true);
    setReportePorFecha(true);
    setModalReporteVisible(true);
    try {
      const inicio = fechaInicioReporte.toISOString().split("T")[0];
      const fin = fechaFinReporte.toISOString().split("T")[0];
      const sesiones: any = await api.get(`/caja/reporte?fecha_inicio=${inicio}&fecha_fin=${fin}`);

      const totalEfectivo = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_efectivo || 0), 0);
      const totalTransferencia = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_transferencia || 0), 0);
      const totalPunto = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_punto || 0), 0);
      const totalPm = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_pago_movil || 0), 0);
      const totalCredito = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_credito || 0), 0);
      const totalOtros = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_otros || 0), 0);
      const totalVentas = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_ventas_sistema || 0), 0);
      const totalDeclarado = sesiones.reduce((s: number, c: any) => s + parseFloat(c.monto_final_declarado || 0), 0);
      const totalDiferencia = sesiones.reduce((s: number, c: any) => s + parseFloat(c.diferencia || 0), 0);
      const totalGastos = sesiones.reduce((s: number, c: any) => s + parseFloat(c.total_gastos || 0), 0);

      const todasVentas: any[] = [];
      sesiones.forEach((ses: any) => {
        if (ses.ventas) ses.ventas.forEach((v: any) => todasVentas.push(v));
      });

      setReporteData({
        sesiones,
        cantidad_sesiones: sesiones.length,
        total_efectivo: totalEfectivo,
        total_transferencia: totalTransferencia,
        total_punto: totalPunto,
        total_pago_movil: totalPm,
        total_credito: totalCredito,
        total_otros: totalOtros,
        total_ventas_sistema: totalVentas,
        monto_final_declarado: totalDeclarado,
        diferencia: totalDiferencia,
        total_gastos: totalGastos,
        ventas: todasVentas,
        total_ventas: todasVentas.length,
        fecha_apertura: fechaInicioReporte.toISOString(),
        fecha_cierre: fechaFinReporte.toISOString(),
        vendedor_nombre: `${sesiones.length} sesión(es)`,
        monto_inicial: 0,
      });
    } catch (e) {
      console.error("Error cargando reporte por fecha:", e);
      Alert.alert("Error", "No se pudo cargar el reporte.");
      setModalReporteVisible(false);
    } finally {
      setCargandoReporte(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resVentas, resProds, resCaja, resHist, resUsers, resClientes]: any =
        await Promise.all([
          api.get("/ventas").catch(() => []),
          api.get("/productos").catch(() => []),
          api.get("/caja").catch(() => null),
          api.get("/caja?action=historial").catch(() => []),
          esAdmin()
            ? api.get(`/usuarios?admin_id=${user?.id}`).catch(() => [])
            : Promise.resolve([]),
          api.get("/clientes").catch(() => []),
        ]);

      setVentas(resVentas || []);
      setProductos(resProds || []);
      setCajaActual(resCaja?.sesion || null);
      setMovimientosCaja(resCaja?.movimientos || []);
      setHistorialCaja(resHist || []);
      setUsuarios(resUsers || []);
      setClientesBD(resClientes || []);
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

  const formatearMoneda = (monto: any) => `$ ${Number(monto || 0).toFixed(2)}`;
  const formatearFechaHora = (fecha: string) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    return `${d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const normalizarMetodo = (str: string) => {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  // 🔥 LÓGICA DE FILTROS ACTUALIZADA (AHORA SOPORTA CRÉDITO/MIXTO)
  const ventasFiltradas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return ventas
      .filter((v) => {
        // 1. Filtro Vendedor
        const vId = v.vendedorId || v.vendedor_id;
        if (!esAdmin() && vId !== user?.id) return false;
        if (esAdmin() && filtroVendedor !== "todos" && vId !== filtroVendedor)
          return false;

        // 2. Filtro Método de Pago (AQUÍ ESTÁ LA MAGIA PARA EL CRÉDITO)
        const metodoVenta = normalizarMetodo(
          v.metodoPago || v.metodo_pago || "N/A",
        );
        const metodoFiltro = normalizarMetodo(filtroPago);
        
        if (filtroPago !== "todos") {
          if (filtroPago === "credito") {
            const esCredito = 
              metodoVenta === "credito" || 
              v.estadoPago === "pendiente" || 
              v.estado_pago === "pendiente" || 
              v.estadoPago === "parcial" || 
              v.estado_pago === "parcial";
            if (!esCredito) return false;
          } else {
            if (metodoVenta !== metodoFiltro) return false;
          }
        }

        // 3. Filtro Producto (Búsqueda)
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

        // 4. Filtro Fechas (Siempre activo en conjunto con los demás)
        if (rangoFecha !== "historico") {
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

  const kpis = useMemo(() => {
    let brutas = 0,
      costoTotal = 0;
    const porMetodo: any = {
      efectivo: 0,
      tarjeta: 0,
      pago_movil: 0,
      transferencia: 0,
      credito: 0, // Añadimos credito al KPI por si acaso
    };
    const conteoProd: any = {};

    ventasFiltradas.forEach((v) => {
      const totalVenta = Number(v.total || 0);
      brutas += totalVenta;

      const metodo = v.metodoPago || v.metodo_pago || "otros";
      if (porMetodo[metodo] !== undefined) porMetodo[metodo] += totalVenta;
      else porMetodo[metodo] = totalVenta;

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

  const calculosCaja = useMemo(() => {
    if (!cajaActual) return null;
    let ventasEf = 0,
      ventasTransferencia = 0,
      ventasPunto = 0,
      ventasPm = 0,
      ventasCr = 0,
      ventasOtros = 0,
      ing = 0,
      gas = 0;
    let countEf = 0,
      countBanco = 0,
      countPm = 0,
      countCr = 0;
    const fApertura = new Date(cajaActual.fecha_apertura);

    ventas
      .filter((v) => new Date(v.fecha) >= fApertura)
      .forEach((v) => {
        const m = v.metodoPago || v.metodo_pago;
        const totalVenta = Number(v.total || 0);
        if (m === "efectivo") {
          ventasEf += totalVenta;
          countEf++;
        } else if (m === "transferencia") {
          ventasTransferencia += totalVenta;
          countBanco++;
        } else if (m === "tarjeta") {
          ventasPunto += totalVenta;
          countBanco++;
        } else if (m === "pago_movil") {
          ventasPm += totalVenta;
          countPm++;
        } else if (
          m === "credito" ||
          v.estadoPago === "pendiente" ||
          v.estado_pago === "pendiente"
        ) {
          ventasCr += Number(v.montoRestante || v.monto_restante || v.total);
          countCr++;
        } else {
          ventasOtros += totalVenta;
        }
      });

    movimientosCaja.forEach((m) => {
      if (m.tipo === "ingreso") ing += parseFloat(m.monto);
      if (m.tipo === "egreso") gas += parseFloat(m.monto);
    });

    const base = parseFloat(cajaActual.monto_inicial || 0);
    const total_ventas_sistema =
      ventasEf + ventasTransferencia + ventasPunto + ventasPm + ventasOtros;
    const esperado = base + ventasEf + ing - gas;

    return {
      base,
      ventasEf,
      countEf,
      ventasTransferencia,
      ventasPunto,
      ventasBanco: ventasTransferencia + ventasPunto,
      countBanco,
      ventasPm,
      countPm,
      ventasCr,
      countCr,
      ventasOtros,
      ingresosExtra: ing,
      gastos: gas,
      esperado,
      total_ventas_sistema,
    };
  }, [cajaActual, ventas, movimientosCaja]);

  const handleAbrirCaja = async () => {
    if (user?.rol !== "superadmin" && user?.plan?.usa_caja !== 1) {
      return Alert.alert("Módulo no disponible", "Su plan no tiene la opción para usar la caja.");
    }
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
    if (user?.rol !== "superadmin" && user?.plan?.usa_caja !== 1) {
      return Alert.alert("Módulo no disponible", "Su plan no tiene la opción para usar la caja.");
    }
    const montoDeclarado = parseFloat(montoCierre);
    if (isNaN(montoDeclarado))
      return Alert.alert("Error", "Debes ingresar el dinero físico contado.");
    try {
      setCargando(true);
      const diferencia = montoDeclarado - (calculosCaja?.esperado || 0);
      await api.post("/caja", {
        action: "cerrar",
        id: cajaActual.id,
        monto_final_declarado: montoDeclarado,
        diferencia: diferencia,
        notas: notasCierre,
        total_ventas_sistema: calculosCaja?.total_ventas_sistema || 0,
        total_efectivo: calculosCaja?.esperado || 0,
        total_transferencia: calculosCaja?.ventasTransferencia || 0,
        total_punto: calculosCaja?.ventasPunto || 0,
        total_otros: calculosCaja?.ventasOtros || 0,
        total_pago_movil: calculosCaja?.ventasPm || 0,
        total_credito: calculosCaja?.ventasCr || 0,
      });
      setModalCierreVisible(false);
      setMontoCierre("");
      setNotasCierre("");
      cargarDatos();
      Alert.alert(
        "Caja Cerrada",
        "El cierre de caja se ha registrado exitosamente.",
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo cerrar la caja");
      setCargando(false);
    }
  };

  const handleMovimiento = async () => {
    if (user?.rol !== "superadmin" && user?.plan?.usa_caja !== 1) {
      return Alert.alert("Módulo no disponible", "Su plan no tiene la opción para usar la caja.");
    }
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

  const abrirModalAbono = (venta: any) => {
    setVentaAbonando(venta);
    setMontoAbono("");
    setMetodoAbono("efectivo");
    setReferenciaAbono("");
    setImagenAbono(null);
    setModalAbonoVisible(true);
  };

  const seleccionarImagenAbono = async (origen: "camara" | "galeria") => {
    const permisos = await (origen === "camara"
      ? ImagePicker.requestCameraPermissionsAsync()
      : ImagePicker.requestMediaLibraryPermissionsAsync());
    if (permisos.status !== "granted")
      return Alert.alert(
        "Permiso denegado",
        "Se requiere acceso a la cámara/galería",
      );
    const resultado = await (origen === "camara"
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 1,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 1,
        }));
    if (!resultado.canceled && resultado.assets[0].uri) {
      const manipulado = await ImageManipulator.manipulateAsync(
        resultado.assets[0].uri,
        [{ resize: { width: 1000 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      setImagenAbono(`data:image/jpeg;base64,${manipulado.base64}`);
    }
  };

  const confirmarAbono = async () => {
    const abonoFloat = parseFloat(montoAbono);
    const deudaTotal = parseFloat(
      ventaAbonando.montoRestante || ventaAbonando.monto_restante || 0,
    );
    if (isNaN(abonoFloat) || abonoFloat <= 0)
      return Alert.alert("Error", "Monto de abono inválido");
    if (abonoFloat > deudaTotal)
      return Alert.alert("Error", "El abono no puede superar la deuda actual.");
    if (
      (metodoAbono === "transferencia" || metodoAbono === "pago_movil") &&
      !referenciaAbono
    )
      return Alert.alert("Error", "Debes ingresar el número de referencia.");
    try {
      setCargando(true);
      await api.post("/ventas/registrar-pago", {
        id: ventaAbonando.id,
        monto: abonoFloat,
        metodo: metodoAbono,
        referencia: referenciaAbono,
        fotoComprobante: imagenAbono,
      });
      setModalAbonoVisible(false);
      cargarDatos();
      Alert.alert("Éxito", "Abono registrado correctamente");
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo registrar el abono");
    } finally {
      setCargando(false);
    }
  };

  const resolverCliente = (item: any) => {
    return (
      item.cliente?.nombre ||
      (item.clienteId && clientesBD.find((c: any) => c.id === item.clienteId)?.nombre) ||
      (item.cliente_id && clientesBD.find((c: any) => c.id === item.cliente_id)?.nombre) ||
      "Cliente"
    );
  };

  const abrirHistorialPagos = async (venta: any) => {
    setVentaHistorial(venta);
    setHistorialPagos([]);
    setModalHistorialVisible(true);
    setCargandoHistorial(true);
    try {
      const res: any = await api.get(`/ventas/${venta.id}`);
      setHistorialPagos(res?.pagos || res?.historial_pagos || []);
    } catch (e: any) {
      console.error("Error cargando historial de pagos:", e);
    } finally {
      setCargandoHistorial(false);
    }
  };

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
          style={[estilos.tarjetaKPI, { backgroundColor: colores.primario }]}
        >
          <Text style={[estilos.tituloKPI, { color: colores.textoOscuro }]}>
            VENTAS BRUTAS
          </Text>
          <Text style={[estilos.valorKPI, { color: colores.textoOscuro }]}>
            {formatearMoneda(kpis.brutas)}
          </Text>
        </View>
        <View
          style={[
            estilos.tarjetaKPI,
            {
              backgroundColor: colores.fondoTarjeta,
              borderWidth: 1,
              borderColor: colores.primario,
            },
          ]}
        >
          <Text style={[estilos.tituloKPI, { color: colores.textoResaltado }]}>
            UTILIDAD NETA
          </Text>
          <Text style={[estilos.valorKPI, { color: colores.textoResaltado }]}>
            {formatearMoneda(kpis.utilidad)}
          </Text>
          <Text style={{ color: colores.textoResaltado, fontSize: 12, marginTop: 5 }}>
            Margen: {kpis.margen.toFixed(1)}%
          </Text>
        </View>
      </View>

      <Text style={estilos.seccionTitulo}>Métodos de Pago</Text>
      <View
        style={{
          backgroundColor: colores.fondoTarjeta,
          padding: 20,
          borderRadius: 16,
          marginBottom: 25,
        }}
      >
        {Object.entries(kpis.porMetodo).map(([metodo, total]: any) => {
          if (total === 0) return null;
          const pct = kpis.brutas > 0 ? (total / kpis.brutas) * 100 : 0;
          let colorBarra = colores.primario;
          if (metodo === "pago_movil") colorBarra = colores.cyan || "#00D1FF";
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
                <Text style={{ color: colores.textoBlanco, fontSize: 14 }}>
                  {(metodo || "N/A").replace("_", " ").toUpperCase()}
                </Text>
                <Text
                  style={{ color: colores.textoBlanco, fontWeight: "bold" }}
                >
                  {formatearMoneda(total)}
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
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
                    color: colores.textoResaltado,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  #{i + 1}
                </Text>
                <Text
                  style={{ color: colores.textoBlanco, fontSize: 16, flex: 1 }}
                  numberOfLines={1}
                >
                  {p.nombre}
                </Text>
              </View>
              <Text
                style={{
                  color: colores.textoResaltado,
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <FontAwesome5
                name="calendar-alt"
                size={16}
                color={
                  filtroActivo === "fecha"
                    ? colores.textoOscuro
                    : colores.textoGris
                }
              />
              <Text
                style={[
                  estilos.textoFiltroPrincipal,
                  filtroActivo === "fecha" && { color: colores.textoOscuro },
                ]}
              >
                Fechas
              </Text>
              {rangoFecha !== "hoy" && (
                <View style={estilos.marcadorFiltroActivo} />
              )}
            </View>
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <FontAwesome5
                name="credit-card"
                size={16}
                color={
                  filtroActivo === "pagos"
                    ? colores.textoOscuro
                    : colores.textoGris
                }
              />
              <Text
                style={[
                  estilos.textoFiltroPrincipal,
                  filtroActivo === "pagos" && { color: colores.textoOscuro },
                ]}
              >
                Pagos
              </Text>
              {filtroPago !== "todos" && (
                <View style={estilos.marcadorFiltroActivo} />
              )}
            </View>
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
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <FontAwesome5
                  name="user-alt"
                  size={16}
                  color={
                    filtroActivo === "vendedor"
                      ? colores.textoOscuro
                      : colores.textoGris
                  }
                />
                <Text
                  style={[
                    estilos.textoFiltroPrincipal,
                    filtroActivo === "vendedor" && {
                      color: colores.textoOscuro,
                    },
                  ]}
                >
                  Vendedor
                </Text>
                {filtroVendedor !== "todos" && (
                  <View style={estilos.marcadorFiltroActivo} />
                )}
              </View>
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <FontAwesome5
                name="box"
                size={16}
                color={
                  filtroActivo === "producto"
                    ? colores.textoOscuro
                    : colores.textoGris
                }
              />
              {busquedaProducto.length > 0 && (
                <View style={estilos.marcadorFiltroActivo} />
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* PANELES DESPLEGABLES DE LOS FILTROS */}
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
            {(rangoFecha === "hoy" || rangoFecha === "personalizado") && (
              <>
                <Text
                  style={{
                    color: colores.textoGris,
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

        {/* 🔥 AÑADIDO BOTÓN "CRÉDITO / MIXTO" EN EL MENÚ PAGOS */}
        {filtroActivo === "pagos" && (
          <View style={estilos.panelSubFiltro}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {[
                { id: "todos", label: "Todos" },
                { id: "efectivo", label: "Efectivo" },
                { id: "tarjeta", label: "Tarjeta" },
                { id: "pago_movil", label: "Pago Móvil" },
                { id: "transferencia", label: "Transferencia" },
                { id: "credito", label: "Crédito / Mixto" },
                { id: "otros", label: "Otros" },
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
              placeholderTextColor={colores.textoGris}
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
          <TouchableOpacity
            style={estilos.itemVentaLista}
            activeOpacity={0.7}
            onPress={() => {
              setVentaDetalle(item);
              setModalDetalleVisible(true);
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  color: colores.textoResaltado,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {(() => {
                  const primerItem = item.items?.[0];
                  if (!primerItem) return "Venta #" + item.id.toString().slice(-6);
                  const pId = primerItem.productoId || primerItem.producto_id;
                  const nombre = primerItem.producto?.nombre || primerItem.producto_nombre || primerItem.nombre || productos.find((p: any) => p.id === pId)?.nombre || "Producto";
                  const resto = item.items.length - 1;
                  return resto > 0 ? `${nombre} +${resto} más` : nombre;
                })()}
              </Text>
              {item.cliente_nombre && (
                <Text
                  style={{
                    color: colores.textoGris,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <FontAwesome5 name="user" size={11} />{" "}
                  {item.cliente_nombre}
                </Text>
              )}
              <Text
                style={{
                  color: colores.textoGris,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                {formatearFechaHora(item.fecha)}
              </Text>
              <View style={{ gap: 3 }}>
                {item.items?.slice(0, 4).map((i: any, idx: number) => {
                  const pId = i.productoId || i.producto_id;
                  const nombre =
                    i.producto?.nombre ||
                    i.producto_nombre ||
                    i.nombre ||
                    productos.find((p) => p.id === pId)?.nombre ||
                    "Producto";
                  return (
                    <Text
                      key={idx}
                      style={{
                        color: colores.textoBlanco,
                        fontSize: 13,
                      }}
                    >
                      {"\u2022"} {i.cantidad}x {nombre}
                    </Text>
                  );
                })}
                {(item.items?.length || 0) > 4 && (
                  <Text
                    style={{
                      color: colores.textoGris,
                      fontSize: 12,
                      fontStyle: "italic",
                    }}
                  >
                    +{item.items.length - 4} más
                  </Text>
                )}
              </View>
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
              <Text
                style={{
                  color: colores.textoBlanco,
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 5,
                }}
              >
                {formatearMoneda(item.total)}
              </Text>
              <View
                style={{
                  backgroundColor: colores.primario,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginBottom: 5,
                }}
              >
                <Text
                  style={{
                    color: colores.textoOscuro,
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
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderVistaCreditos = () => {
    const creditos = ventas.filter(
      (v) =>
        (v.estadoPago === "pendiente" ||
          v.estado_pago === "pendiente" ||
          v.estadoPago === "parcial" ||
          v.estado_pago === "parcial") &&
        (esAdmin() || v.vendedorId === user?.id || v.vendedor_id === user?.id),
    );
    const totalCobrar = creditos.reduce(
      (acc, v) => acc + Number(v.montoRestante || v.monto_restante || 0),
      0,
    );

    return (
      <View style={estilos.flex1}>
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text
            style={{ color: colores.textoGris, fontSize: 16, marginBottom: 5 }}
          >
            Total por Cobrar
          </Text>
          <Text
            style={{ color: colores.error, fontSize: 40, fontWeight: "bold" }}
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
                    color: colores.textoBlanco,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {resolverCliente(item)}
                </Text>
                <Text
                  style={{
                    color: colores.textoGris,
                    fontSize: 12,
                    marginVertical: 4,
                  }}
                >
                  {formatearFechaHora(item.fecha)}
                </Text>
                <Text style={{ color: colores.textoGris, fontSize: 14 }}>
                  Total Venta: {formatearMoneda(item.total)}
                </Text>
              </View>
              <View
                style={{ alignItems: "flex-end", justifyContent: "center" }}
              >
                <Text
                  style={{
                    color: colores.error,
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {formatearMoneda(
                    item.montoRestante || item.monto_restante || 0,
                  )}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colores.fondoInput,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colores.borde,
                    }}
                    onPress={() => abrirHistorialPagos(item)}
                  >
                    <Text
                      style={{
                        color: colores.textoBlanco,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      Ver Abonos
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colores.primario,
                      paddingHorizontal: 15,
                      paddingVertical: 6,
                      borderRadius: 6,
                    }}
                    onPress={() => abrirModalAbono(item)}
                  >
                    <Text
                      style={{
                        color: colores.textoOscuro,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Abonar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  const renderVistaCaja = () => {
    const planIncluyeCaja = user?.rol === "superadmin" || user?.plan?.usa_caja === 1;

    if (!planIncluyeCaja) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <FontAwesome5 name="lock" size={60} color={colores.textoGris} style={{ marginBottom: 20 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colores.textoBlanco, textAlign: "center", marginBottom: 10 }}>
            Módulo no Disponible
          </Text>
          <Text style={{ fontSize: 15, color: colores.textoGris, textAlign: "center", lineHeight: 22 }}>
            Su plan no tiene la opción para usar la caja.
          </Text>
        </View>
      );
    }

    return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      {!cajaActual ? (
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <FontAwesome5
            name="lock"
            size={60}
            color={colores.textoGris}
            style={{ marginBottom: 20 }}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colores.textoBlanco,
            }}
          >
            Caja Cerrada
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colores.textoGris,
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
                color: colores.textoGris,
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
              placeholderTextColor={colores.textoGris}
            />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: colores.primario,
              padding: 18,
              borderRadius: 12,
              width: 200,
              alignItems: "center",
            }}
            onPress={handleAbrirCaja}
          >
            <Text
              style={{
                color: colores.textoOscuro,
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
              backgroundColor: colores.fondoInput,
              padding: 15,
              borderRadius: 15,
            }}
          >
            <View>
              <Text
                style={{
                  color: colores.textoGris,
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                SESIÓN ACTUAL
              </Text>
              <Text
                style={{
                  color: colores.textoBlanco,
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
                backgroundColor: colores.primario,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                gap: 6,
              }}
            >
              <FontAwesome5
                name="check-circle"
                size={12}
                color={colores.textoOscuro}
              />
              <Text
                style={{
                  color: colores.textoOscuro,
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
                  { backgroundColor: colores.primario },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                    color: colores.textoOscuro,
                  }}
                >
                  EFECTIVO
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: colores.textoOscuro,
                  }}
                >
                  {formatearMoneda(calculosCaja?.ventasEf || 0)}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  Base: {formatearMoneda(calculosCaja?.base || 0)} •{" "}
                  {calculosCaja?.countEf || 0} trans.
                </Text>
              </View>
              <View style={estilos.cardCaja}>
                <Text style={estilos.labelCaja}>BANCO (TRANS/TARJ)</Text>
                <Text style={estilos.montoCaja}>
                  {formatearMoneda(calculosCaja?.ventasBanco || 0)}
                </Text>
                <Text
                  style={{
                    color: colores.textoGris,
                    fontSize: 10,
                    marginTop: 4,
                  }}
                >
                  {calculosCaja?.countBanco || 0} transacciones
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={estilos.cardCaja}>
                <Text style={estilos.labelCaja}>PAGO MÓVIL</Text>
                <Text style={estilos.montoCaja}>
                  {formatearMoneda(calculosCaja?.ventasPm || 0)}
                </Text>
                <Text
                  style={{
                    color: colores.textoGris,
                    fontSize: 10,
                    marginTop: 4,
                  }}
                >
                  {calculosCaja?.countPm || 0} transacciones
                </Text>
              </View>
              <View
                style={[
                  estilos.cardCaja,
                  {
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    borderWidth: 1,
                    borderColor: colores.error,
                  },
                ]}
              >
                <Text style={[estilos.labelCaja, { color: colores.error }]}>
                  POR COBRAR
                </Text>
                <Text style={[estilos.montoCaja, { color: colores.error }]}>
                  {formatearMoneda(calculosCaja?.ventasCr || 0)}
                </Text>
                <Text
                  style={{ color: colores.error, fontSize: 10, marginTop: 4 }}
                >
                  {calculosCaja?.countCr || 0} transacciones
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              style={[estilos.botonCajaMin, { borderColor: colores.exito }]}
              onPress={() => {
                setTipoMovimiento("ingreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text
                style={{ color: colores.exito, fontSize: 18, marginRight: 5 }}
              >
                +
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: colores.exito,
                }}
              >
                INGRESO EXTRA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonCajaMin, { borderColor: colores.error }]}
              onPress={() => {
                setTipoMovimiento("egreso");
                setModalMovimientoVisible(true);
              }}
            >
              <Text
                style={{ color: colores.error, fontSize: 18, marginRight: 5 }}
              >
                -
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: colores.error,
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
              borderColor: colores.borde,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: colores.textoGris,
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
                  color: colores.exito,
                }}
              >
                {formatearMoneda(calculosCaja?.ingresosExtra || 0)}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: colores.textoGris,
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
                  color: colores.error,
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
              backgroundColor: colores.error,
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

      {esAdmin() && (
        <View style={{ marginBottom: 20, marginTop: 25, width: "100%" }}>
          <Text style={{ color: colores.textoBlanco, fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
            <FontAwesome5 name="chart-line" size={13} /> Reporte Z por Fechas
          </Text>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <TouchableOpacity
              style={{
                flex: 1, minWidth: 100,
                backgroundColor: colores.fondoInput, paddingHorizontal: 12, paddingVertical: 10,
                borderRadius: 10, borderWidth: 1, borderColor: colores.borde,
              }}
              onPress={() => setShowPickerInicioReporte(true)}
            >
              <Text style={{ color: colores.textoGris, fontSize: 10, marginBottom: 2 }}>Desde</Text>
              <Text style={{ color: colores.textoBlanco, fontWeight: "bold", fontSize: 13 }}>
                {fechaInicioReporte.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1, minWidth: 100,
                backgroundColor: colores.fondoInput, paddingHorizontal: 12, paddingVertical: 10,
                borderRadius: 10, borderWidth: 1, borderColor: colores.borde,
              }}
              onPress={() => setShowPickerFinReporte(true)}
            >
              <Text style={{ color: colores.textoGris, fontSize: 10, marginBottom: 2 }}>Hasta</Text>
              <Text style={{ color: colores.textoBlanco, fontWeight: "bold", fontSize: 13 }}>
                {fechaFinReporte.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: colores.primario, paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 10, alignItems: "center", justifyContent: "center",
              }}
              onPress={cargarReportePorFecha}
            >
              <Text style={{ color: colores.textoOscuro, fontWeight: "bold", fontSize: 13 }}>
                <FontAwesome5 name="receipt" size={12} /> Generar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showPickerInicioReporte && (
        <DateTimePicker
          value={fechaInicioReporte}
          mode="date"
          display="default"
          onChange={(_: any, date?: Date) => {
            setShowPickerInicioReporte(false);
            if (date) setFechaInicioReporte(date);
          }}
        />
      )}
      {showPickerFinReporte && (
        <DateTimePicker
          value={fechaFinReporte}
          mode="date"
          display="default"
          onChange={(_: any, date?: Date) => {
            setShowPickerFinReporte(false);
            if (date) setFechaFinReporte(date);
          }}
        />
      )}

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
                borderBottomColor: colores.borde,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colores.textoBlanco,
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
                        ? colores.textoGris
                        : colores.exito,
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
                    color: colores.textoBlanco,
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
                          ? colores.exito
                          : colores.error,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Dif: {(c.diferencia || 0) >= 0 ? "+" : ""}
                    {formatearMoneda(parseFloat(c.diferencia || 0))}
                  </Text>
                )}
              </View>
              {c.estado === "cerrada" && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(198, 255, 0, 0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    justifyContent: "center",
                    marginLeft: 8,
                  }}
                  onPress={() => cargarReporte(c.id)}
                >
                  <FontAwesome5 name="receipt" size={14} color={colores.primario} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
  };

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
              backgroundColor: isDark
                ? "rgba(18,18,18,0.8)"
                : "rgba(255,255,255,0.8)",
              zIndex: 100,
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      )}

      <View style={estilos.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              color: colores.textoBlanco,
              fontSize: 28,
              fontWeight: "bold",
            }}
          >
            Reportes
          </Text>
        </View>
        <View style={estilos.selectorVista}>
          {["resumen", "ventas", "creditos", "caja"].map((vista) => (
            <TouchableOpacity
              key={vista}
              style={[
                estilos.botonVista,
                vistaActual === vista && { backgroundColor: colores.primario },
              ]}
              onPress={() => setVistaActual(vista as VistaType)}
            >
              <Text
                style={[
                  {
                    color: colores.textoGris,
                    fontSize: 14,
                    fontWeight: "bold",
                  },
                  vistaActual === vista && { color: colores.textoOscuro },
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

      <Modal visible={modalAbonoVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={estilos.modalOverlay}
          >
            <View style={estilos.modalContenido}>
              <Text style={estilos.tituloModal}>Registrar Abono</Text>
              <View
                style={{
                  backgroundColor: "rgba(255, 59, 48, 0.1)",
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: colores.error,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  DEUDA ACTUAL
                </Text>
                <Text
                  style={{
                    color: colores.error,
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {formatearMoneda(
                    ventaAbonando?.montoRestante ||
                      ventaAbonando?.monto_restante,
                  )}
                </Text>
              </View>
              <Text
                style={{
                  color: colores.textoGris,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                Monto a Abonar
              </Text>
              <TextInput
                style={[
                  estilos.inputModal,
                  { fontSize: 24, textAlign: "center", fontWeight: "bold" },
                ]}
                keyboardType="decimal-pad"
                value={montoAbono}
                onChangeText={setMontoAbono}
                placeholder="0.00"
                placeholderTextColor={colores.textoGris}
              />
              <Text
                style={{
                  color: colores.textoGris,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                Método de Pago
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                {["efectivo", "transferencia", "pago_movil"].map((metodo) => (
                  <TouchableOpacity
                    key={metodo}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        metodoAbono === metodo
                          ? colores.primario
                          : colores.borde,
                      backgroundColor:
                        metodoAbono === metodo
                          ? "rgba(198, 255, 0, 0.1)"
                          : "transparent",
                      alignItems: "center",
                    }}
                    onPress={() => {
                      setMetodoAbono(metodo);
                      setReferenciaAbono("");
                      setImagenAbono(null);
                    }}
                  >
                    <Text
                      style={{
                        color:
                          metodoAbono === metodo
                            ? colores.primario
                            : colores.textoGris,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {metodo === "pago_movil"
                        ? "Pago Móvil"
                        : metodo === "transferencia"
                          ? "Transfer"
                          : "Efectivo"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {(metodoAbono === "transferencia" ||
                metodoAbono === "pago_movil") && (
                <>
                  <Text
                    style={{
                      color: colores.textoGris,
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    Referencia
                  </Text>
                  <TextInput
                    style={estilos.inputModal}
                    keyboardType="numeric"
                    value={referenciaAbono}
                    onChangeText={setReferenciaAbono}
                    placeholder="0000"
                    placeholderTextColor={colores.textoGris}
                  />
                  <Text
                    style={{
                      color: colores.textoGris,
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    Comprobante (Opcional)
                  </Text>
                  {imagenAbono ? (
                    <View style={{ alignItems: "center", marginBottom: 15 }}>
                      <Image
                        source={{ uri: imagenAbono }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        onPress={() => setImagenAbono(null)}
                        style={{ marginTop: 5 }}
                      >
                        <Text style={{ color: colores.error, fontSize: 12 }}>
                          Eliminar foto
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginBottom: 15,
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          padding: 15,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colores.borde,
                          alignItems: "center",
                        }}
                        onPress={() => seleccionarImagenAbono("camara")}
                      >
                        <FontAwesome5
                          name="camera"
                          size={20}
                          color={colores.textoGris}
                          style={{ marginBottom: 5 }}
                        />
                        <Text
                          style={{ color: colores.textoGris, fontSize: 12 }}
                        >
                          Cámara
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          padding: 15,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colores.borde,
                          alignItems: "center",
                        }}
                        onPress={() => seleccionarImagenAbono("galeria")}
                      >
                        <FontAwesome5
                          name="images"
                          size={20}
                          color={colores.textoGris}
                          style={{ marginBottom: 5 }}
                        />
                        <Text
                          style={{ color: colores.textoGris, fontSize: 12 }}
                        >
                          Galería
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 15,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colores.fondoInput,
                  }}
                  onPress={() => setModalAbonoVisible(false)}
                >
                  <Text
                    style={{ color: colores.textoBlanco, fontWeight: "bold" }}
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
                    backgroundColor: colores.primario,
                  }}
                  onPress={confirmarAbono}
                >
                  <Text
                    style={{ color: colores.textoOscuro, fontWeight: "bold" }}
                  >
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={modalCierreVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={estilos.modalOverlay}
          >
            <View style={estilos.modalContenido}>
              <Text style={estilos.tituloModal}>Cierre de Caja</Text>
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: colores.textoBlanco,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  Resumen del Sistema
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: colores.textoGris, fontSize: 13 }}>
                    Base Inicial:
                  </Text>
                  <Text style={{ color: colores.textoBlanco, fontSize: 13 }}>
                    {formatearMoneda(calculosCaja?.base)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: colores.textoGris, fontSize: 13 }}>
                    Ventas en Efectivo:
                  </Text>
                  <Text style={{ color: colores.exito, fontSize: 13 }}>
                    + {formatearMoneda(calculosCaja?.ventasEf)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: colores.textoGris, fontSize: 13 }}>
                    Ingresos Extra:
                  </Text>
                  <Text style={{ color: colores.exito, fontSize: 13 }}>
                    + {formatearMoneda(calculosCaja?.ingresosExtra)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: colores.textoGris, fontSize: 13 }}>
                    Gastos / Egresos:
                  </Text>
                  <Text style={{ color: colores.error, fontSize: 13 }}>
                    - {formatearMoneda(calculosCaja?.gastos)}
                  </Text>
                </View>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colores.borde,
                    marginTop: 8,
                    paddingTop: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: colores.primario,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    EFECTIVO ESPERADO:
                  </Text>
                  <Text
                    style={{
                      color: colores.primario,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {formatearMoneda(calculosCaja?.esperado)}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: colores.textoGris,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Efectivo Real en Caja (Contado) *
              </Text>
              <TextInput
                style={estilos.inputModal}
                keyboardType="decimal-pad"
                value={montoCierre}
                onChangeText={setMontoCierre}
                placeholder="0.00"
                placeholderTextColor={colores.textoGris}
              />
              {montoCierre !== "" && !isNaN(parseFloat(montoCierre)) && (
                <View
                  style={{
                    alignItems: "center",
                    marginBottom: 15,
                    padding: 10,
                    backgroundColor: colores.fondoInput,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colores.textoGris,
                      fontSize: 12,
                      marginBottom: 5,
                    }}
                  >
                    Diferencia
                  </Text>
                  {(() => {
                    const dif =
                      parseFloat(montoCierre) - (calculosCaja?.esperado || 0);
                    const colorDif =
                      dif === 0
                        ? colores.exito
                        : dif < 0
                          ? colores.error
                          : colores.primario;
                    return (
                      <>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color: colorDif,
                          }}
                        >
                          {dif > 0 ? "+" : ""}
                          {formatearMoneda(dif)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colores.textoGris,
                            marginTop: 2,
                          }}
                        >
                          {dif === 0
                            ? "Caja Cuadrada Perfectamente"
                            : dif < 0
                              ? "Faltante de dinero"
                              : "Sobrante de dinero"}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )}
              <Text
                style={{
                  color: colores.textoGris,
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                Notas / Observaciones
              </Text>
              <TextInput
                style={[estilos.inputModal, { height: 60 }]}
                multiline
                value={notasCierre}
                onChangeText={setNotasCierre}
                placeholder="Ej: Faltan $2 por vuelto no dado..."
                placeholderTextColor={colores.textoGris}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 15,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colores.fondoInput,
                  }}
                  onPress={() => setModalCierreVisible(false)}
                >
                  <Text
                    style={{ color: colores.textoBlanco, fontWeight: "bold" }}
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
                    backgroundColor: colores.primario,
                  }}
                  onPress={handleCerrarCaja}
                >
                  <Text
                    style={{ color: colores.textoOscuro, fontWeight: "bold" }}
                  >
                    Cerrar Caja
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={modalHistorialVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={estilos.modalOverlay}
          >
            <View style={estilos.modalContenido}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={estilos.tituloModal}>Historial de Abonos</Text>
                <TouchableOpacity onPress={() => setModalHistorialVisible(false)}>
                  <FontAwesome5 name="times" size={20} color={colores.textoGris} />
                </TouchableOpacity>
              </View>

              {ventaHistorial && (
                <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 10, marginBottom: 20 }}>
                  <Text style={{ color: colores.textoBlanco, fontWeight: "bold", fontSize: 16 }}>
                    {resolverCliente(ventaHistorial)}
                  </Text>
                  <Text style={{ color: colores.textoGris, fontSize: 12, marginTop: 4 }}>
                    Venta #{ventaHistorial.id?.toString().slice(-6)} — {formatearFechaHora(ventaHistorial.fecha)}
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 13 }}>Total: {formatearMoneda(ventaHistorial.total)}</Text>
                    <Text style={{ color: colores.error, fontWeight: "bold", fontSize: 13 }}>
                      Deuda: {formatearMoneda(ventaHistorial.montoRestante || ventaHistorial.monto_restante || 0)}
                    </Text>
                  </View>
                </View>
              )}

              {cargandoHistorial ? (
                <ActivityIndicator size="large" color={colores.primario} style={{ marginVertical: 30 }} />
              ) : historialPagos.length === 0 ? (
                <Text style={{ color: colores.textoGris, textAlign: "center", marginVertical: 30 }}>
                  No hay abonos registrados para esta venta.
                </Text>
              ) : (
                <FlatList
                  data={historialPagos}
                  keyExtractor={(_, idx) => idx.toString()}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item: pago }: any) => (
                    <TouchableOpacity
                      style={{ backgroundColor: colores.fondoOscuro, padding: 15, borderRadius: 10, marginBottom: 10 }}
                      activeOpacity={0.7}
                      onPress={() => {
                        const compAbono = pago.fotoComprobante || pago.foto_comprobante || null;
                        if (compAbono) {
                          setVerComprobanteAbono(compAbono);
                        } else {
                          Alert.alert(
                            "Detalle del Abono",
                            `Monto: ${formatearMoneda(pago.monto)}\nFecha: ${pago.fecha ? formatearFechaHora(pago.fecha) : "N/A"}\nMétodo: ${(pago.metodo || pago.metodo_pago || "N/A").replace("_", " ")}${pago.referencia ? `\nReferencia: ${pago.referencia}` : ""}`,
                          );
                        }
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={{ color: colores.textoBlanco, fontWeight: "bold", fontSize: 15 }}>
                          {formatearMoneda(pago.monto)}
                        </Text>
                        <Text style={{ color: colores.textoGris, fontSize: 12 }}>
                          {pago.fecha ? formatearFechaHora(pago.fecha) : ""}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Text style={{ color: colores.textoGris, fontSize: 12 }}>
                          Método: {(pago.metodo || pago.metodo_pago || "N/A").replace("_", " ")}
                        </Text>
                        {pago.referencia && (
                          <Text style={{ color: colores.textoGris, fontSize: 12 }}>
                            Ref: {pago.referencia}
                          </Text>
                        )}
                      </View>
                      {pago.fotoComprobante && (
                        <View style={{ marginTop: 8 }}>
                          <Image
                            source={{ uri: pago.fotoComprobante.startsWith("data:") ? pago.fotoComprobante : `${API_URL}/pagos/ver?archivo=${pago.fotoComprobante}` }}
                            style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colores.primario }}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity
                style={{ backgroundColor: colores.primario, padding: 15, borderRadius: 10, alignItems: "center", marginTop: 15 }}
                onPress={() => {
                  setModalHistorialVisible(false);
                  if (ventaHistorial) abrirModalAbono(ventaHistorial);
                }}
              >
                <Text style={{ color: colores.textoOscuro, fontWeight: "bold" }}>
                  Nuevo Abono
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        {verComprobanteAbono && (
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center", zIndex: 999 }}
            activeOpacity={1}
            onPress={() => setVerComprobanteAbono(null)}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 }}
              onPress={() => setVerComprobanteAbono(null)}
            >
              <FontAwesome5 name="times" size={24} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={{
                uri: verComprobanteAbono.startsWith("data:")
                  ? verComprobanteAbono
                  : `${API_URL}/pagos/ver?archivo=${verComprobanteAbono}`,
              }}
              style={{ width: "95%", height: "80%", resizeMode: "contain" }}
            />
          </TouchableOpacity>
        )}
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
              placeholderTextColor={colores.textoGris}
            />
            <TextInput
              style={estilos.inputModal}
              value={descMovimiento}
              onChangeText={setDescMovimiento}
              placeholder="Motivo / Descripción"
              placeholderTextColor={colores.textoGris}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: colores.fondoInput,
                }}
                onPress={() => setModalMovimientoVisible(false)}
              >
                <Text
                  style={{ color: colores.textoBlanco, fontWeight: "bold" }}
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
                      ? colores.exito
                      : colores.error,
                }}
                onPress={handleMovimiento}
              >
                <Text
                  style={{ color: colores.textoBlanco, fontWeight: "bold" }}
                >
                  Registrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={modalDetalleVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colores.fondoInput, borderRadius: 16, padding: 24, maxHeight: "85%" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ color: colores.textoResaltado, fontSize: 22, fontWeight: "bold" }}>
                  Venta #{ventaDetalle?.id?.toString().slice(-6)}
                </Text>
                <TouchableOpacity onPress={() => setModalDetalleVisible(false)} style={{ padding: 5 }}>
                  <FontAwesome5 name="times" size={22} color={colores.textoBlanco} />
                </TouchableOpacity>
              </View>

              {ventaDetalle && (
                <>
                  <View style={{ marginBottom: 20, gap: 8 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 14 }}>
                      <FontAwesome5 name="calendar" size={12} /> {formatearFechaHora(ventaDetalle.fecha)}
                    </Text>
                    {resolverCliente(ventaDetalle) && (
                      <Text style={{ color: colores.textoBlanco, fontSize: 15, fontWeight: "600" }}>
                        <FontAwesome5 name="user" size={13} /> {resolverCliente(ventaDetalle)}
                      </Text>
                    )}
                    <View style={{ backgroundColor: colores.primario, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ color: colores.textoOscuro, fontSize: 13, fontWeight: "bold" }}>
                        {(ventaDetalle.metodoPago || ventaDetalle.metodo_pago || "N/A").replace("_", " ")}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: colores.textoGris, fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 }}>
                    PRODUCTOS
                  </Text>
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {(ventaDetalle.items || []).map((i: any, idx: number) => {
                      const pId = i.productoId || i.producto_id;
                      const nombre = i.producto?.nombre || i.producto_nombre || i.nombre || productos.find((p: any) => p.id === pId)?.nombre || "Producto";
                      const subtotal = (i.precio || i.precioUnitario || i.precio_unitario || 0) * (i.cantidad || 0);
                      return (
                        <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", paddingBottom: 6 }}>
                          <Text style={{ color: colores.textoBlanco, fontSize: 14, flex: 1 }}>
                            {i.cantidad}x {nombre}
                          </Text>
                          <Text style={{ color: colores.textoBlanco, fontSize: 14, fontWeight: "bold" }}>
                            {formatearMoneda(subtotal)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colores.primario, paddingTop: 12, marginBottom: 16 }}>
                    <Text style={{ color: colores.textoResaltado, fontSize: 18, fontWeight: "bold" }}>Total</Text>
                    <Text style={{ color: colores.textoResaltado, fontSize: 22, fontWeight: "900" }}>
                      {formatearMoneda(ventaDetalle.total)}
                    </Text>
                  </View>

                  {(() => {
                    const comprobantes: { uri: string; label: string }[] = [];
                    const pagos = ventaDetalle?.pagos || ventaDetalle?._pagos || [];
                    pagos.forEach((p: any) => {
                      const archivo = p?.foto_comprobante || p?.fotoComprobante || null;
                      if (archivo) {
                        comprobantes.push({ uri: archivo, label: `Ver Comprobante (${(p.metodo || p.metodo_pago || "").replace("_", " ")})` });
                      }
                    });
                    return comprobantes.map((c, idx) => (
                      <View key={idx} style={{ alignItems: "center", marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: "rgba(198,255,0,0.15)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
                          onPress={() => setVerComprobante(c.uri)}
                        >
                          <Text style={{ color: colores.primario, fontWeight: "bold", fontSize: 14 }}>
                            <FontAwesome5 name="image" size={13} /> {c.label}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ));
                  })()}
                </>
              )}
            </ScrollView>
          </View>
        </View>
        {verComprobante && (
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center", zIndex: 999 }}
            activeOpacity={1}
            onPress={() => setVerComprobante(null)}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 }}
              onPress={() => setVerComprobante(null)}
            >
              <FontAwesome5 name="times" size={24} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={{
                uri: verComprobante.startsWith("data:")
                  ? verComprobante
                  : `${API_URL}/pagos/ver?archivo=${verComprobante}`,
              }}
              style={{ width: "95%", height: "80%", resizeMode: "contain" }}
            />
          </TouchableOpacity>
        )}
      </Modal>

      <Modal visible={!!comprobanteVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 10,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
            }}
            onPress={() => setComprobanteVisible(null)}
          >
            <FontAwesome5 name="times" size={24} color="#FFF" />
          </TouchableOpacity>
          {comprobanteVisible && (
            <Image
              source={{
                uri: comprobanteVisible.startsWith("data:")
                  ? comprobanteVisible
                  : `${API_URL}/pagos/ver?archivo=${comprobanteVisible}`,
              }}
              style={{ width: "95%", height: "80%", resizeMode: "contain" }}
            />
          )}
        </View>
      </Modal>
      {/* MODAL REPORTE Z */}
      <Modal visible={modalReporteVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colores.fondoTarjeta, borderRadius: 20, padding: 24, maxHeight: "90%" }}>
            {cargandoReporte ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colores.primario} />
                <Text style={{ color: colores.textoGris, marginTop: 12 }}>Cargando reporte...</Text>
              </View>
            ) : reporteData ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* HEADER */}
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <FontAwesome5 name="receipt" size={28} color={colores.textoResaltado} />
                  <Text style={{ color: colores.textoBlanco, fontSize: 20, fontWeight: "bold", marginTop: 8 }}>
                    REPORTE Z
                  </Text>
                  {reportePorFecha && (
                    <Text style={{ color: colores.textoResaltado, fontSize: 12, fontWeight: "bold", marginTop: 2 }}>
                      Por Fechas — {reporteData.cantidad_sesiones || 0} sesión(es)
                    </Text>
                  )}
                  <Text style={{ color: colores.textoGris, fontSize: 12, marginTop: reportePorFecha ? 0 : 2 }}>
                    {formatearFechaHora(reporteData.fecha_apertura)} — {reporteData.fecha_cierre ? formatearFechaHora(reporteData.fecha_cierre) : "Abierta"}
                  </Text>
                </View>

                <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 12 }}>Vendedor</Text>
                    <Text style={{ color: colores.textoBlanco, fontSize: 13, fontWeight: "bold" }}>{reporteData.vendedor_nombre || "—"}</Text>
                  </View>
                  {!reportePorFecha && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: colores.textoGris, fontSize: 12 }}>Base inicial</Text>
                      <Text style={{ color: colores.textoBlanco, fontSize: 13 }}>{formatearMoneda(reporteData.monto_inicial || 0)}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 12 }}>Total ventas</Text>
                    <Text style={{ color: colores.textoBlanco, fontSize: 13, fontWeight: "bold" }}>{formatearMoneda(reporteData.total_ventas_sistema || 0)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colores.textoGris, fontSize: 12 }}>Total transacciones</Text>
                    <Text style={{ color: colores.textoBlanco, fontSize: 13 }}>{reporteData.total_ventas || 0}</Text>
                  </View>
                </View>

                {/* VENTAS POR MÉTODO */}
                <Text style={{ color: colores.textoBlanco, fontSize: 15, fontWeight: "bold", marginBottom: 10 }}>
                  <FontAwesome5 name="money-bill-wave" size={14} /> Ventas por Método
                </Text>
                <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  {[
                    { label: "Efectivo", value: reporteData.total_efectivo },
                    { label: "Transferencia", value: reporteData.total_transferencia },
                    { label: "Punto", value: reporteData.total_punto },
                    { label: "Pago Móvil", value: reporteData.total_pago_movil },
                    { label: "Crédito", value: reporteData.total_credito },
                    { label: "Otros", value: reporteData.total_otros },
                    { label: "Gastos", value: reporteData.total_gastos },
                  ].map((item) => (
                    <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                      <Text style={{ color: colores.textoGris, fontSize: 13 }}>{item.label}</Text>
                      <Text style={{ color: colores.textoBlanco, fontSize: 13, fontWeight: "600" }}>{formatearMoneda(parseFloat(item.value || 0))}</Text>
                    </View>
                  ))}
                </View>

                {/* TRANSACCIONES */}
                {reporteData.ventas?.length > 0 && (
                  <>
                    <Text style={{ color: colores.textoBlanco, fontSize: 15, fontWeight: "bold", marginBottom: 10 }}>
                      <FontAwesome5 name="clipboard-list" size={14} /> Transacciones ({reporteData.ventas.length})
                    </Text>
                    <View style={{ marginBottom: 16 }}>
                      {reporteData.ventas.slice(0, 50).map((v: any, i: number) => (
                        <View key={v.id} style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: colores.textoBlanco, fontSize: 12 }}>#{i + 1}</Text>
                            <Text style={{ color: colores.textoGris, fontSize: 11 }}>{v.fecha ? new Date(v.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</Text>
                          </View>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                            <Text style={{ color: colores.textoBlanco, fontSize: 13, flex: 1 }} numberOfLines={1}>{v.cliente_nombre || "Sin cliente"}</Text>
                            <Text style={{ color: colores.primario, fontSize: 14, fontWeight: "bold" }}>{formatearMoneda(v.total)}</Text>
                          </View>
                          <Text style={{ color: colores.textoGris, fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>
                            {v.metodo_pago?.replace(/_/g, " ") || "—"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* MOVIMIENTOS */}
                {reporteData.movimientos?.length > 0 && (
                  <>
                    <Text style={{ color: colores.textoBlanco, fontSize: 15, fontWeight: "bold", marginBottom: 10 }}>
                      <FontAwesome5 name="exchange-alt" size={14} /> Movimientos
                    </Text>
                    <View style={{ marginBottom: 16 }}>
                      {reporteData.movimientos.map((m: any) => (
                        <View key={m.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colores.textoBlanco, fontSize: 13 }}>{m.descripcion}</Text>
                            <Text style={{ color: colores.textoGris, fontSize: 11, marginTop: 2 }}>{m.vendedor_nombre || ""}</Text>
                          </View>
                          <Text style={{ color: m.tipo === "ingreso" ? colores.exito : colores.error, fontSize: 14, fontWeight: "bold" }}>
                            {m.tipo === "ingreso" ? "+" : "-"}{formatearMoneda(m.monto)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* RESUMEN EFECTIVO */}
                <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <Text style={{ color: colores.textoBlanco, fontSize: 15, fontWeight: "bold", marginBottom: 12 }}>
                    <FontAwesome5 name="cash-register" size={14} /> Resumen de Efectivo
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 13 }}>Efectivo esperado</Text>
                    <Text style={{ color: colores.textoBlanco, fontSize: 13 }}>{formatearMoneda(reporteData.total_efectivo || 0)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: colores.textoGris, fontSize: 13 }}>Declarado</Text>
                    <Text style={{ color: colores.textoBlanco, fontSize: 14, fontWeight: "bold" }}>{formatearMoneda(reporteData.monto_final_declarado || 0)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
                    <Text style={{ color: colores.textoGris, fontSize: 14, fontWeight: "bold" }}>Diferencia</Text>
                    <Text style={{ color: (reporteData.diferencia || 0) >= 0 ? colores.exito : colores.error, fontSize: 16, fontWeight: "bold" }}>
                      {(reporteData.diferencia || 0) >= 0 ? "+" : ""}{formatearMoneda(parseFloat(reporteData.diferencia || 0))}
                    </Text>
                  </View>
                </View>

                {/* CERRAR */}
                <TouchableOpacity
                  style={{ backgroundColor: colores.primario, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                  onPress={() => setModalReporteVisible(false)}
                >
                  <Text style={{ color: colores.textoOscuro, fontWeight: "bold", fontSize: 15 }}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    flex1: { flex: 1 },
    header: {
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 15,
      paddingHorizontal: 20,
      backgroundColor: c.fondoOscuro,
    },
    selectorVista: {
      flexDirection: "row",
      backgroundColor: c.fondoInput,
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
    seccionTitulo: {
      color: c.textoBlanco,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
    },
    textoVacio: { color: c.textoGris, textAlign: "center", marginTop: 20 },
    filaChipsFiltro: { flexDirection: "row", gap: 10, marginBottom: 20 },
    chipFiltroResumen: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.fondoInput,
    },
    chipFiltro: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: "rgba(128,128,128,0.1)",
    },
    chipFiltroActivo: { backgroundColor: c.primario },
    textoChip: { color: c.textoGris, fontWeight: "bold", fontSize: 14 },
    textoChipActivo: { color: c.textoOscuro },
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
      borderBottomColor: c.borde,
    },
    contenedorFiltros: {
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    botonFiltroPrincipal: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    botonFiltroPrincipalActivo: { backgroundColor: c.primario },
    textoFiltroPrincipal: {
      color: c.textoGris,
      fontWeight: "bold",
      fontSize: 14,
    },
    marcadorFiltroActivo: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primario,
      marginLeft: 4,
      elevation: 2,
      shadowColor: c.primario,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 3,
    },
    panelSubFiltro: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: c.fondoOscuro,
    },
    inputBusquedaFiltro: {
      backgroundColor: c.fondoInput,
      color: c.textoBlanco,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borde,
    },
    inputFecha: {
      flex: 1,
      backgroundColor: c.fondoOscuro,
      padding: 15,
      borderRadius: 8,
    },
    inputFechaActivo: { borderWidth: 1, borderColor: c.primario },
    labelFecha: {
      fontSize: 10,
      color: c.textoGris,
      marginBottom: 5,
      fontWeight: "bold",
    },
    valorFecha: { color: c.textoBlanco, fontWeight: "bold", fontSize: 14 },
    itemVentaLista: {
      backgroundColor: c.fondoTarjeta,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputGiganteCaja: {
      backgroundColor: c.fondoInput,
      color: c.textoBlanco,
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
      backgroundColor: c.fondoTarjeta,
    },
    labelCaja: {
      fontSize: 10,
      fontWeight: "bold",
      letterSpacing: 0.5,
      marginBottom: 8,
      color: c.textoBlanco,
    },
    montoCaja: { fontSize: 24, fontWeight: "bold", color: c.textoBlanco },
    botonCajaMin: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      borderRadius: 10,
      borderWidth: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      padding: 20,
    },
    modalContenido: {
      backgroundColor: c.fondoTarjeta,
      padding: 25,
      borderRadius: 20,
    },
    tituloModal: {
      color: c.textoBlanco,
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    inputModal: {
      backgroundColor: c.fondoOscuro,
      color: c.textoBlanco,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.borde,
    },
  });