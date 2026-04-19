import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import {
  ContextoAutenticacionProvider,
  useAuth,
} from "../contexts/ContextAuth";

// Bloqueamos que el splash screen desaparezca por defecto
SplashScreen.preventAutoHideAsync().catch(() => []);

function RootLayoutContent() {
  const { isLoading, token } = useAuth(); // Ahora escuchamos también el token
  const segments = useSegments(); // Nos dice en qué carpeta estamos (ej. '(auth)' o '(tabs)')
  const router = useRouter();

  useEffect(() => {
    // Si todavía está cargando la sesión del SecureStore, no hacemos nada
    if (isLoading) return;

    // Verificamos si el usuario está dentro de la carpeta (auth)
    const inAuthGroup = segments[0] === "(auth)";

    if (token && inAuthGroup) {
      // 🟢 Si tiene token (logueado) y está en la pantalla de Login, lo mandamos al Dashboard
      router.replace("/(tabs)");
    } else if (!token && !inAuthGroup) {
      // 🔴 Si NO tiene token (deslogueado) y está intentando ver el Dashboard, lo devolvemos al Login
      router.replace("/(auth)/login");
    }

    try {
      SplashScreen.hideAsync();
    } catch (error) {}
  }, [isLoading, token, segments, router]);

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
