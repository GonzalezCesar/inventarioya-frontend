import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
  acentoVerde: "#34C759",
};

type VistaType = "resumen" | "ventas" | "creditos" | "caja";

export default function PantallaReportes() {
  const [vistaActual, setVistaActual] = useState<VistaType>("resumen");
  const [periodoResumen, setPeriodoResumen] = useState<
    "hoy" | "semana" | "mes"
  >("hoy");
  const [montoInicialCaja, setMontoInicialCaja] = useState("");

  // --- 1. VISTA RESUMEN ---
  const renderVistaResumen = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.contenidoScroll}
    >
      {/* Selector de Periodo */}
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

      {/* KPIs Principales */}
      <View style={estilos.filaTarjetas}>
        <View style={estilos.tarjetaNeon}>
          <Text style={estilos.tituloTarjetaNeon}>VENTAS BRUTAS</Text>
          <Text style={estilos.valorTarjetaNeon}>$ 0</Text>
          <FontAwesome5
            name="dollar-sign"
            size={80}
            color="rgba(0,0,0,0.05)"
            style={estilos.marcaAgua}
          />
        </View>

        <View style={estilos.tarjetaOscura}>
          <Text style={estilos.tituloTarjetaOscura}>UTILIDAD NETA</Text>
          <Text style={estilos.valorTarjetaOscura}>$ 0</Text>
          <Text style={estilos.subtituloTarjetaOscura}>Margen: 0.0%</Text>
        </View>
      </View>

      {/* Secciones de Datos */}
      <View style={estilos.seccionTop}>
        <Text style={estilos.tituloSeccion}>Métodos de Pago</Text>
        {/* Aquí irán las barras de progreso en el futuro */}
      </View>

      <View style={[estilos.seccionTop, { marginTop: 15 }]}>
        <Text style={estilos.tituloSeccion}>Top Productos</Text>
        {/* Aquí irá la lista de productos */}
      </View>
    </ScrollView>
  );

  // --- 2. VISTA VENTAS ---
  const renderVistaVentas = () => (
    <View style={estilos.flex1}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.headerFiltros}
      >
        <TouchableOpacity style={estilos.botonFiltro}>
          <FontAwesome5
            name="calendar-alt"
            size={14}
            color={COLORES.textoGris}
          />
          <Text style={estilos.textoFiltro}>Fechas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botonFiltro}>
          <FontAwesome5
            name="credit-card"
            size={14}
            color={COLORES.textoGris}
          />
          <Text style={estilos.textoFiltro}>Pagos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botonFiltro}>
          <FontAwesome5 name="user" size={14} color={COLORES.textoGris} />
          <Text style={estilos.textoFiltro}>Vendedor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botonFiltro}>
          <FontAwesome5 name="box" size={14} color={COLORES.textoGris} />
          <Text style={estilos.textoFiltro}>Producto</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={estilos.estadoVacio}>
        <Text style={estilos.textoVacio}>No hay ventas registradas aún.</Text>
      </View>
    </View>
  );

  // --- 3. VISTA CRÉDITOS ---
  const renderVistaCreditos = () => (
    <View style={estilos.flex1}>
      <View style={estilos.resumenCreditos}>
        <Text style={estilos.tituloResumenCreditos}>Total por Cobrar</Text>
        <Text style={estilos.montoResumenCreditos}>$ 0</Text>
      </View>
      <View style={estilos.estadoVacio}>
        <Text style={estilos.textoVacio}>No hay créditos pendientes.</Text>
      </View>
    </View>
  );

  // --- 4. VISTA CAJA ---
  const renderVistaCaja = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
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
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={COLORES.textoGris}
          />
        </View>

        <TouchableOpacity style={estilos.botonAccionPrincipal}>
          <Text style={estilos.textoBotonAccion}>ABRIR CAJA</Text>
        </TouchableOpacity>

        {/* Historial */}
        <View style={{ marginTop: 40, width: "100%" }}>
          <Text style={estilos.tituloSeccion}>Historial de Cajas</Text>
          <TouchableOpacity style={estilos.botonSelectorFecha}>
            <FontAwesome5 name="calendar" size={16} color={COLORES.textoGris} />
            <Text style={estilos.textoSelectorFecha}>Seleccionar Fecha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              estilos.botonPeriodoActivo,
              {
                alignSelf: "flex-start",
                marginTop: 10,
                paddingHorizontal: 15,
                paddingVertical: 5,
                borderRadius: 8,
              },
            ]}
          >
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
          <Text style={[estilos.textoVacio, { marginTop: 20 }]}>
            No se encontraron registros.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // --- RENDER PRINCIPAL ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      {/* MENU SUPERIOR (TABS) */}
      <View style={estilos.header}>
        <View style={estilos.selectorVista}>
          {(["resumen", "ventas", "creditos", "caja"] as const).map((vista) => (
            <TouchableOpacity
              key={vista}
              style={[
                estilos.botonVista,
                vistaActual === vista && estilos.botonVistaActivo,
              ]}
              onPress={() => setVistaActual(vista)}
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

      {/* RENDERIZADO DINÁMICO */}
      {vistaActual === "resumen" && renderVistaResumen()}
      {vistaActual === "ventas" && renderVistaVentas()}
      {vistaActual === "creditos" && renderVistaCreditos()}
      {vistaActual === "caja" && renderVistaCaja()}
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  flex1: { flex: 1 },

  // Menu Superior
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

  contenidoScroll: { padding: 20, paddingBottom: 40 },

  // Vista Resumen
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
    fontSize: 32,
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
    fontSize: 32,
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

  // Vista Ventas
  headerFiltros: { flexDirection: "row", padding: 20, gap: 10, maxHeight: 80 },
  botonFiltro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoFiltro: { color: COLORES.textoGris, fontSize: 14 },

  // Vista Creditos
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

  // Vista Caja
  contenedorCajaCerrada: { padding: 20, alignItems: "center", paddingTop: 40 },
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
  botonSelectorFecha: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoSelectorFecha: { color: COLORES.textoGris, fontSize: 14 },

  // Generales
  estadoVacio: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoVacio: { color: COLORES.textoGris, fontSize: 14 },
});
