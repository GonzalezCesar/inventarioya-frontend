import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // <-- IMPORTACIÓN CLAVE

const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00",
  textoGris: "#8E8E93",
};

export default function TabLayout() {
  // Obtenemos las medidas de las barras del sistema (notificaciones arriba, botones de navegación abajo)
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: COLORES.fondoOscuro,
          borderTopWidth: 1,
          borderTopColor: COLORES.fondoTarjeta,
          // 🔥 EL TRUCO: Altura base (60) + el espacio que ocupan los botones de Android (insets.bottom)
          height: 60 + insets.bottom,
          // Añadimos el espacio extra al padding para que los íconos queden centrados
          paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORES.primario,
        tabBarInactiveTintColor: COLORES.textoGris,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventario",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-list" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vender"
        options={{
          title: "Vender",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="dollar-sign" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="chart-bar" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cuenta"
        options={{
          title: "Cuenta",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
