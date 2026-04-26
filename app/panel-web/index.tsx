import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
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
  recientes: ActividadReciente[];
}

export default function DashboardWeb() {
  const { user } = useAuth();
  
  const [cargando, setCargando] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  
  // Estado para el switch de Fase Beta
  const [faseBeta, setFaseBeta] = useState(false);
  const [cambiandoBeta, setCambiandoBeta] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDashboard();
      cargarConfiguracion();
    }, [])
  );

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const res: any = await api.get("/dashboard");
      setData(res);
    } catch (error) {
      console.error("Error cargando dashboard SaaS:", error);
      Alert.alert("Error", "No se pudo cargar la información del panel.");
    } finally {
      setCargando(false);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const res: any = await api.get("/configuracion");
      if (res && res.beta_activa !== undefined) {
        setFaseBeta(res.beta_activa === "1" || res.beta_activa === true);
      }
    } catch (error) {
      console.error("Error cargando configuración beta:", error);
    }
  };

  const toggleFaseBeta = async (valor: boolean) => {
    try {
      setCambiandoBeta(true);
      await api.post("/configuracion", {
        clave: "beta_activa",
        valor: valor ? "1" : "0",
      });
      setFaseBeta(valor);
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado de la Fase Beta.");
      setFaseBeta(!valor);
    } finally {
      setCambiandoBeta(false);
    }
  };

  const formatearFechaHora = (fechaString: string) => {
    if (!fechaString) return "---";
    const date = new Date(fechaString);
    return date.toLocaleString("en-US");
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

  return (
    <ScrollView 
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER TIPO SAAS */}
      <View style={estilos.header}>
        <View>
          <Text style={estilos.tituloDashboard}>Panel de Control SaaS</Text>
          <Text style={estilos.subtitulo}>
            Hola {user?.nombre || "Admin"}, aquí puedes ver el rendimiento de tu plataforma.
          </Text>
        </View>
        <View style={estilos.userInfo}>
          <View style={estilos.avatarCircle}>
            <Text style={estilos.avatarTexto}>{user?.nombre?.charAt(0).toUpperCase() || "A"}</Text>
          </View>
          <Text style={estilos.nombreAdmin}>{user?.nombre || "Developer"}</Text>
        </View>
      </View>

      {/* STATS GRID */}
      <View style={estilos.statsGrid}>
        
        {/* TARJETA FASE BETA (GRADIENTE) */}
        <View style={[estilos.card, estilos.cardFeatured]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: '100%' }}>
            <View>
              <Text style={estilos.cardTitleFeatured}>Fase Beta Global</Text>
              <Text style={estilos.cardValueFeatured}>
                {cambiandoBeta ? "Actualizando..." : (faseBeta ? "ACTIVA" : "INACTIVA")}
              </Text>
            </View>
            <Switch
              value={faseBeta}
              onValueChange={toggleFaseBeta}
              disabled={cambiandoBeta}
              trackColor={{ false: "rgba(255,255,255,0.3)", true: "rgba(255,255,255,0.6)" }}
              thumbColor={"#FFFFFF"}
            />
          </View>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>Clientes Totales Hoy</Text>
          <Text style={estilos.cardValue}>{data?.total_clientes || 0}</Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>Conexión Hoy</Text>
          <Text style={[estilos.cardValue, { color: "#c6ff00" }]}>{data?.activos_hoy || 0}</Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>Actividad Global (Mes)</Text>
          <Text style={estilos.cardValue}>{formatearMoneda(data?.ventas_plataforma || "0")}</Text>
        </View>
      </View>

      {/* TABLA DE ACTIVIDAD */}
      <View style={estilos.tableContainer}>
        <View style={estilos.tableHeader}>
          <Text style={estilos.tableTitle}>Última Actividad de Clientes</Text>
          <TouchableOpacity>
            <Text style={estilos.linkVerTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: '100%', overflow: 'hidden' }}>
          <View style={estilos.tableHead}>
            <Text style={[estilos.th, { flex: 2 }]}>CLIENTE</Text>
            <Text style={[estilos.th, { flex: 2 }]}>EMAIL</Text>
            <Text style={[estilos.th, { flex: 1, textAlign: 'center' }]}>ACCIÓN</Text>
            <Text style={[estilos.th, { flex: 2, textAlign: 'right' }]}>FECHA Y HORA</Text>
          </View>

          {data?.recientes?.map((v, index) => {
            const accion = v.accion || 'Conexión';
            const esVenta = accion.toLowerCase() === 'venta';
            
            return (
              <View key={index} style={estilos.tableRow}>
                <Text style={[estilos.tdText, { flex: 2, fontWeight: 'bold', color: '#FFFFFF' }]} numberOfLines={1}>
                  {v.nombre || v.email || 'Sin Nombre'}
                </Text>
                
                <Text style={[estilos.tdText, { flex: 2 }]} numberOfLines={1}>
                  {v.email || '---'}
                </Text>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={[estilos.badge, esVenta ? estilos.badgeVenta : estilos.badgeConexion]}>
                    <Text style={[estilos.badgeText, esVenta ? estilos.badgeTextVenta : estilos.badgeTextConexion]}>
                      {accion}
                    </Text>
                  </View>
                </View>
                
                <Text style={[estilos.tdText, { flex: 2, textAlign: 'right' }]} numberOfLines={1}>
                  {formatearFechaHora(v.fecha)}
                </Text>
              </View>
            );
          })}

          {(!data?.recientes || data.recientes.length === 0) && (
            <Text style={estilos.emptyText}>No hay actividad reciente registrada.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#0d110d",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d110d",
  },
  contenido: {
    padding: 30,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  tituloDashboard: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitulo: {
    fontSize: 15,
    color: "#8a8a8a",
    marginTop: 5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  avatarCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#c6ff00",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
  nombreAdmin: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    padding: 24,
    borderRadius: 20,
    justifyContent: "center",
  },
  cardFeatured: {
    backgroundColor: "#8B5CF6", // Morado tipo app original
    borderColor: "#8B5CF6",
  },
  cardTitle: {
    color: "#c6ff00",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },
  cardTitleFeatured: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  cardValueFeatured: {
    color: "#FFFFFF",
    fontSize: 24, // Un poco más pequeño para acomodar texto
    fontWeight: "900",
  },
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 255, 0, 0.2)",
  },
  tableTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  linkVerTodos: {
    color: "#c6ff00",
    fontSize: 14,
    fontWeight: "600",
  },
  tableHead: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  th: {
    color: "#8a8a8a",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 255, 0, 0.2)",
  },
  tdText: {
    color: "#8a8a8a",
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeConexion: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  badgeTextConexion: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "bold",
  },
  badgeVenta: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  badgeTextVenta: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#8a8a8a",
    textAlign: "center",
    padding: 30,
    fontSize: 15,
  }
});