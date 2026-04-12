import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import {
  ContextoAutenticacionProvider,
  useAuth,
} from "../contexts/ContextAuth";

// Bloqueamos que el splash screen desaparezca por defecto
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Solo ocultamos el splash screen cuando el contexto termina de cargar la sesión
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Oculta la cabecera por defecto en toda la app
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ContextoAutenticacionProvider>
      <RootLayoutContent />
    </ContextoAutenticacionProvider>
  );
}