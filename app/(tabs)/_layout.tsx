import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "../../contexts/ContextTheme"; // Importamos el tema

export default function TabLayout() {
  const { colores } = useTheme(); // Obtenemos los colores vivos

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 🔥 Aquí aplicamos el color dinámico a la barra
        tabBarStyle: {
          backgroundColor: colores.fondoOscuro,
          borderTopColor: colores.borde,
          elevation: 0, // Quita la sombra en Android
          shadowOpacity: 0, // Quita la sombra en iOS
        },
        tabBarActiveTintColor: colores.subtitulos, // Tu verde neón cuando está seleccionado
        tabBarInactiveTintColor: colores.textoGris, // Gris cuando no está seleccionado
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventario",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-list" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vender"
        options={{
          title: "Vender",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="shopping-cart" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="chart-bar" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: "Cuenta",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
