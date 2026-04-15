import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";

// Reutilizamos tus colores para que todo combine a la perfección
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00", // Tu Verde Neón
  textoGris: "#8E8E93",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Ocultamos el header feo de arriba porque tu Dashboard ya tiene su propio encabezado hermoso
        headerShown: false,

        // Estilos de la barra inferior (Bottom Tab Bar)
        tabBarStyle: {
          backgroundColor: COLORES.fondoOscuro,
          borderTopWidth: 1,
          borderTopColor: COLORES.fondoTarjeta,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORES.primario, // Se pone verde neón cuando está seleccionado
        tabBarInactiveTintColor: COLORES.textoGris, // Se pone gris cuando no lo estás viendo
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {/* 1. Pestaña de Inicio (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={22} color={color} />
          ),
        }}
      />

      {/* 2. Pestaña de Inventario (inventario.tsx) */}
      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventario",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-list" size={22} color={color} />
          ),
        }}
      />

      {/* 3. Pestaña de Ventas (vender.tsx) */}
      <Tabs.Screen
        name="vender"
        options={{
          title: "Vender",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="dollar-sign" size={22} color={color} />
          ),
        }}
      />

      {/* 4. Pestaña de Reportes (reportes.tsx) */}
      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="chart-bar" size={22} color={color} />
          ),
        }}
      />

      {/* 5. Pestaña de Cuenta (cuenta.tsx) */}
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
