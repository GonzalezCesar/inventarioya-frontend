import { Stack } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#1a1a1a",
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: "Panel de Control",
          headerTitle: "InventarioYa",
        }}
      />

      <Stack.Screen
        name="usuarios"
        options={{
          title: "Gestión de Clientes",
          headerTitle: "Clientes",
        }}
      />

      <Stack.Screen
        name="database"
        options={{
          title: "Base de Datos",
          headerTitle: "Base de Datos",
        }}
      />
    </Stack>
  );
}
