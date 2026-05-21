import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

interface ActividadReciente {
  nombre: string;
  email: string;
  fecha: string;
  accion: string;
}

interface DashboardData {
  total_clientes: number;
  activos_hoy: number;
  ventas_plataforma: string;
  suspendidos: number;
  ingresos_planes_mensual: string | number; // 🔥 Nuevo campo soportado
  recientes: ActividadReciente[];
}

export default function DashboardWeb() {
  const { user } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const [vistaTabla, setVistaTabla] = useState<"actividad" | "ingresos">(
    "actividad",
  );
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");

  useFocusEffect(
    useCallback(() => {
      cargarDashboard();
    }, []),
  );

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const [resDash, resUsers]: any = await Promise.all([
        api.get("/admin/dashboard").catch(() => null),
        api.get("/usuarios?superadmin=true").catch(() => []),
      ]);

      if (resDash) setData(resDash);

      if (resUsers && Array.isArray(resUsers)) {
        const dueños = resUsers.filter(
          (u) => u.rol !== "superadmin" && u.rol !== "vendedor",
        );
        dueños.sort(
          (a, b) =>
            parseFloat(b.total_ventas || "0") -
            parseFloat(a.total_ventas || "0"),
        );
        setEmpresas(dueños);
      }
    } catch (error) {
      console.error("Error cargando dashboard SaaS:", error);
      Alert.alert("Error", "No se pudo cargar la información del panel.");
    } finally {
      setCargando(false);
    }
  };

  const formatearFechaHora = (fechaString: string) => {
    if (!fechaString) return "---";
    const date = new Date(fechaString);
    return date.toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const formatearMoneda = (monto: string | number) => {
    return `$${parseFloat(monto?.toString() || "0").toFixed(2)}`;
  };

  if (cargando && !data) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color="#c6ff00" />
      </View>
    );
  }

  const actividadFiltrada =
    data?.recientes?.filter(
      (v) => v.email && v.email.trim() !== "" && v.email !== "---",
    ) || [];

  const empresasFiltradas = empresas.filter(
    (e) =>
      (e.nombre_negocio?.toLowerCase() || "").includes(
        busquedaEmpresa.toLowerCase(),
      ) ||
      (e.nombre?.toLowerCase() || "").includes(busquedaEmpresa.toLowerCase()),
  );

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
      showsVerticalScrollIndicator={false}
    >
      <View style={estilos.header}>
        <View>
          <Text style={estilos.tituloDashboard}>Panel de Control SaaS</Text>
          <Text style={estilos.subtitulo}>
            Hola {user?.nombre || "Admin"}, aquí puedes ver el rendimiento de tu
            plataforma.
          </Text>
        </View>
        <View style={estilos.userInfo}>
          <View style={estilos.avatarCircle}>
            <Text style={estilos.avatarTexto}>
              {user?.nombre?.charAt(0).toUpperCase() || "A"}
            </Text>
          </View>
          <Text style={estilos.nombreAdmin}>{user?.nombre || "Developer"}</Text>
        </View>
      </View>

      {/* 🔥 STATS GRID DE 4 COLUMNAS PARA INCLUIR LOS INGRESOS DEL PLAN */}
      <View style={estilos.statsGrid}>
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>CLIENTES TOTALES</Text>
          <Text style={estilos.cardValue}>{data?.total_clientes || 0}</Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>CONEXIÓN HOY</Text>
          <Text style={[estilos.cardValue, { color: "#c6ff00" }]}>
            {data?.activos_hoy || 0}
          </Text>
        </View>

        {/* Métrica de Ingresos de la Plataforma (SaaS) */}
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>INGRESOS (PLANES)</Text>
          <Text style={[estilos.cardValue, { color: "#c6ff00" }]}>
            {formatearMoneda(data?.ingresos_planes_mensual || "0")}
          </Text>
        </View>

        {/* Métrica de lo que venden los clientes (Volumen de la app) */}
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>VENTAS DE CLIENTES</Text>
          <Text style={estilos.cardValue}>
            {formatearMoneda(data?.ventas_plataforma || "0")}
          </Text>
        </View>
      </View>

      <View style={estilos.tableContainer}>
        <View style={estilos.tableHeader}>
          <Text style={estilos.tableTitle}>
            {vistaTabla === "actividad"
              ? "Última Actividad de Clientes"
              : "Ingresos por Empresa"}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            {vistaTabla === "ingresos" && (
              <TextInput
                style={estilos.inputBuscador}
                placeholder="Buscar empresa..."
                placeholderTextColor="#666"
                value={busquedaEmpresa}
                onChangeText={setBusquedaEmpresa}
              />
            )}
            <View style={estilos.toggleGroup}>
              <TouchableOpacity
                style={[
                  estilos.toggleBtn,
                  vistaTabla === "actividad" && estilos.toggleBtnActivo,
                ]}
                onPress={() => setVistaTabla("actividad")}
              >
                <Text
                  style={[
                    estilos.toggleText,
                    vistaTabla === "actividad" && estilos.toggleTextActivo,
                  ]}
                >
                  Actividad
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.toggleBtn,
                  vistaTabla === "ingresos" && estilos.toggleBtnActivo,
                ]}
                onPress={() => setVistaTabla("ingresos")}
              >
                <Text
                  style={[
                    estilos.toggleText,
                    vistaTabla === "ingresos" && estilos.toggleTextActivo,
                  ]}
                >
                  Ingresos
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ width: "100%", overflow: "hidden" }}>
          {vistaTabla === "actividad" && (
            <>
              <View style={estilos.tableHead}>
                <Text style={[estilos.th, { flex: 2 }]}>CLIENTE</Text>
                <Text style={[estilos.th, { flex: 2 }]}>EMAIL</Text>
                <Text style={[estilos.th, { flex: 1, textAlign: "center" }]}>
                  ACCIÓN
                </Text>
                <Text style={[estilos.th, { flex: 2, textAlign: "right" }]}>
                  FECHA Y HORA
                </Text>
              </View>

              {actividadFiltrada.map((v, index) => {
                const accion = v.accion || "Conexión";
                const esVenta = accion.toLowerCase() === "venta";
                return (
                  <View key={index} style={estilos.tableRow}>
                    <Text
                      style={[
                        estilos.tdText,
                        { flex: 2, fontWeight: "bold", color: "#FFFFFF" },
                      ]}
                      numberOfLines={1}
                    >
                      {v.nombre || "Usuario"}
                    </Text>
                    <Text
                      style={[estilos.tdText, { flex: 2 }]}
                      numberOfLines={1}
                    >
                      {v.email}
                    </Text>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <View
                        style={[
                          estilos.badge,
                          esVenta ? estilos.badgeVenta : estilos.badgeConexion,
                        ]}
                      >
                        <Text
                          style={[
                            estilos.badgeText,
                            esVenta
                              ? estilos.badgeTextVenta
                              : estilos.badgeTextConexion,
                          ]}
                        >
                          {accion}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[estilos.tdText, { flex: 2, textAlign: "right" }]}
                      numberOfLines={1}
                    >
                      {formatearFechaHora(v.fecha)}
                    </Text>
                  </View>
                );
              })}
              {actividadFiltrada.length === 0 && (
                <Text style={estilos.emptyText}>
                  No hay actividad reciente registrada.
                </Text>
              )}
            </>
          )}

          {vistaTabla === "ingresos" && (
            <>
              <View style={estilos.tableHead}>
                <Text style={[estilos.th, { flex: 2.5 }]}>
                  NEGOCIO / EMPRESA
                </Text>
                <Text style={[estilos.th, { flex: 2 }]}>DUEÑO / EMAIL</Text>
                <Text style={[estilos.th, { flex: 1.5, textAlign: "center" }]}>
                  ROL / PLAN
                </Text>
                <Text style={[estilos.th, { flex: 1.5, textAlign: "right" }]}>
                  DINERO GENERADO
                </Text>
              </View>

              {empresasFiltradas.map((emp, index) => (
                <View key={index} style={estilos.tableRow}>
                  <View style={{ flex: 2.5 }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: "#FFFFFF",
                        fontSize: 14,
                      }}
                      numberOfLines={1}
                    >
                      {emp.nombre_negocio || "N/A"}
                    </Text>
                    <Text
                      style={{ color: "#8a8a8a", fontSize: 12, marginTop: 4 }}
                    >
                      ID: {emp.id.substring(0, 15)}...
                    </Text>
                  </View>

                  <View style={{ flex: 2 }}>
                    <Text
                      style={[estilos.tdText, { color: "#FFFFFF" }]}
                      numberOfLines={1}
                    >
                      {emp.nombre || "Usuario"}
                    </Text>
                    <Text
                      style={{ color: "#8a8a8a", fontSize: 12, marginTop: 4 }}
                      numberOfLines={1}
                    >
                      {emp.email}
                    </Text>
                  </View>

                  <View style={{ flex: 1.5, alignItems: "center" }}>
                    <View
                      style={[
                        estilos.badge,
                        { backgroundColor: "rgba(198, 255, 0, 0.1)" },
                      ]}
                    >
                      <Text style={[estilos.badgeText, { color: "#c6ff00" }]}>
                        {String(emp.rol).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      estilos.tdText,
                      {
                        flex: 1.5,
                        textAlign: "right",
                        fontSize: 18,
                        fontWeight: "900",
                        color: "#c6ff00",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {formatearMoneda(emp.total_ventas || 0)}
                  </Text>
                </View>
              ))}
              {empresasFiltradas.length === 0 && (
                <Text style={estilos.emptyText}>
                  No se encontraron empresas.
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#0d110d" },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d110d",
  },
  contenido: { padding: 30, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  tituloDashboard: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF" },
  subtitulo: { fontSize: 15, color: "#8a8a8a", marginTop: 5 },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#c6ff00",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: { color: "#000", fontWeight: "bold", fontSize: 18 },
  nombreAdmin: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minWidth: 200, 
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    padding: 24,
    borderRadius: 20,
    justifyContent: "center",
  },
  cardTitle: {
    color: "#c6ff00",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  cardValue: { color: "#FFFFFF", fontSize: 36, fontWeight: "900" },

  tableContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 255, 0, 0.2)",
  },
  tableTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "#0d110d",
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  toggleBtnActivo: { backgroundColor: "rgba(198, 255, 0, 0.15)" },
  toggleText: { color: "#8a8a8a", fontWeight: "bold", fontSize: 13 },
  toggleTextActivo: { color: "#c6ff00" },
  inputBuscador: {
    backgroundColor: "#0d110d",
    color: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minWidth: 200,
    fontSize: 13,
  },

  tableHead: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  th: { color: "#8a8a8a", fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 255, 0, 0.2)",
  },
  tdText: { color: "#8a8a8a", fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeConexion: { backgroundColor: "rgba(59, 130, 246, 0.1)" },
  badgeTextConexion: { color: "#3b82f6", fontSize: 12, fontWeight: "bold" },
  badgeVenta: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  badgeTextVenta: { color: "#10b981", fontSize: 12, fontWeight: "bold" },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  emptyText: {
    color: "#8a8a8a",
    textAlign: "center",
    padding: 30,
    fontSize: 15,
  },
});