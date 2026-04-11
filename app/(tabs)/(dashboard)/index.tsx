import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../../contexts/ContextAuth";
import api from "../../../services/api";

interface DashboardData {
  total_clientes?: number;
  activos_hoy?: number;
  ventas_plataforma?: number;
  recientes?: {
    nombre?: string;
    email?: string;
    accion?: string;
    fecha?: string;
  }[];
}

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isBetaActive, setIsBetaActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);

      // Cargar dashboard
      const dashData = await api.get("/dashboard");
      setDashboardData(dashData || {});

      // Cargar configuración (estado de beta)
      try {
        const config = await api.getConfiguracion();
        setIsBetaActive(
          config?.beta_activa === "1" || config?.beta_activa === true,
        );
      } catch (error) {
        console.log("[Dashboard] Error loading configuration:", error);
      }
    } catch (error) {
      console.log("[Dashboard] Error loading dashboard:", error);
      Alert.alert(
        "Error",
        "No se pudo cargar el dashboard. Intenta nuevamente.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const handleToggleBeta = async (value: boolean) => {
    try {
      setIsBetaActive(value);
      await api.post("/configuracion", {
        beta_activa: value ? 1 : 0,
      });
    } catch (error) {
      console.log("[Dashboard] Error toggling beta:", error);
      setIsBetaActive(!value);
      Alert.alert("Error", "No se pudo actualizar el estado de beta.", [
        { text: "OK" },
      ]);
    }
  };

  const userInitial = usuario?.nombre?.charAt(0).toUpperCase() || "U";
  const totalClientes = dashboardData.total_clientes || 0;
  const activosHoy = dashboardData.activos_hoy || 0;
  const ventasPlataforma = dashboardData.ventas_plataforma || 0;
  const recientes = dashboardData.recientes || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Panel de Control</Text>
              <Text style={styles.subtitle}>
                Hola {usuario?.nombre?.split(" ")[0] || "Usuario"}, aquí puedes
                ver el rendimiento de tu plataforma.
              </Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Beta Status Card */}
            <View style={[styles.card, styles.betaCard]}>
              <View style={styles.betaCardContent}>
                <View>
                  <Text style={styles.cardTitle}>Fase Beta Global</Text>
                  <Text
                    style={[
                      styles.cardValue,
                      {
                        color: isBetaActive ? "#fff" : "rgba(255,255,255,0.7)",
                      },
                    ]}
                  >
                    {isBetaActive ? "ACTIVA" : "INACTIVA"}
                  </Text>
                </View>
                <Switch
                  value={isBetaActive}
                  onValueChange={handleToggleBeta}
                  trackColor={{
                    false: "rgba(255,255,255,0.3)",
                    true: "rgba(255,255,255,0.5)",
                  }}
                  thumbColor={isBetaActive ? "#fff" : "#ccc"}
                />
              </View>
            </View>

            {/* Total Clientes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Clientes Totales Hoy</Text>
              <Text style={styles.cardValue}>{totalClientes}</Text>
            </View>

            {/* Conexión Hoy */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Conexión Hoy</Text>
              <Text style={[styles.cardValue, { color: "#007AFF" }]}>
                {activosHoy}
              </Text>
            </View>

            {/* Actividad Global */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actividad Global (Mes)</Text>
              <Text style={styles.cardValue}>
                $
                {typeof ventasPlataforma === "number"
                  ? ventasPlataforma.toFixed(2)
                  : "0.00"}
              </Text>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>
                Última Actividad de Clientes
              </Text>
            </View>

            {recientes.length > 0 ? (
              <View style={styles.activityList}>
                {recientes.map((item, index) => {
                  const nombre = item.nombre || item.email || "Sin Nombre";
                  const fecha = item.fecha
                    ? new Date(item.fecha).toLocaleString("es-ES")
                    : "---";
                  const accion = item.accion || "Conexión";
                  const isVenta = accion === "Venta";
                  const badgeColor = isVenta ? "#10b981" : "#3b82f6";
                  const badgeBg = isVenta
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(59, 130, 246, 0.1)";

                  return (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{nombre}</Text>
                        <Text style={styles.activityEmail}>
                          {item.email || "---"}
                        </Text>
                      </View>
                      <View
                        style={[styles.badge, { backgroundColor: badgeBg }]}
                      >
                        <Text style={[styles.badgeText, { color: badgeColor }]}>
                          {accion}
                        </Text>
                      </View>
                      <Text style={styles.activityDate}>{fecha}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No hay actividad reciente
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  betaCard: {
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    backgroundColor: "#7c3aed",
  },
  betaCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  activitySection: {
    marginVertical: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  activityHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  activityEmail: {
    fontSize: 12,
    color: "#999",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activityDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    minWidth: 100,
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
  },
});
