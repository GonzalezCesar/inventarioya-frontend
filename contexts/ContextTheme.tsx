// contexts/ContextTheme.tsx
import * as NavigationBar from "expo-navigation-bar";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, View, useColorScheme } from "react-native";
import { ColoresType, obtenerColores } from "../constants/theme";

export type ModoTema = "claro" | "oscuro" | "sistema";

interface ContextoTemaType {
  modo: ModoTema;
  isDark: boolean;
  colores: ColoresType;
  setModo: (nuevoModo: ModoTema) => void;
}

const ContextoTema = createContext<ContextoTemaType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorSchemeSistema = useColorScheme();
  const [modoStorage, setModoStorage] = useState<ModoTema>("sistema");
  const [listo, setListo] = useState(false);

  // 1. Cargar preferencia guardada al inicio
  useEffect(() => {
    const cargarTema = async () => {
      try {
        let valor = null;

        if (Platform.OS === "web") {
          valor = localStorage.getItem("tema_app");
        } else {
          valor = await SecureStore.getItemAsync("tema_app");
        }

        if (valor === "claro" || valor === "oscuro" || valor === "sistema") {
          setModoStorage(valor as ModoTema);
        }
      } catch (error) {
        console.error("Error cargando el tema:", error);
      } finally {
        // 🔥 MUY IMPORTANTE: Avisar que ya terminó de cargar
        setListo(true);
      }
    };

    cargarTema();
  }, []);

  // 2. Determinar el tema real activo
  const isDark =
    modoStorage === "sistema"
      ? colorSchemeSistema === "dark"
      : modoStorage === "oscuro";
  const colores = obtenerColores(isDark ? "oscuro" : "claro");

  // 3. Cambiar el color de la barra de navegación en Android
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colores.fondoOscuro);
      NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    }
  }, [isDark, colores]);

  // 4. Función para actualizar y guardar el modo
  const setModo = async (nuevoModo: ModoTema) => {
    setModoStorage(nuevoModo);

    // 🔥 Corregido: Usamos "nuevoModo" en vez de "nuevoTema"
    if (Platform.OS === "web") {
      localStorage.setItem("tema_app", nuevoModo);
    } else {
      await SecureStore.setItemAsync("tema_app", nuevoModo);
    }
  };

  // Evita parpadeos mientras carga la preferencia
  if (!listo) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: obtenerColores("oscuro").fondoOscuro,
        }}
      />
    );
  }

  return (
    <ContextoTema.Provider
      value={{ modo: modoStorage, isDark, colores, setModo }}
    >
      {children}
    </ContextoTema.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ContextoTema);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
};
