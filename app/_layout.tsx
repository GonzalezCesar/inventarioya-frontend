import { TasaProvider } from "@/contexts/ContextTasa"; // 🔥 Importamos el proveedor de la Tasa
import { ThemeProvider } from "@/contexts/ContextTheme";
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
  const { isLoading, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (token && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    try {
      SplashScreen.hideAsync();
    } catch (error) {}
  }, [isLoading, token, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="panel-web" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ContextoAutenticacionProvider>
      <ThemeProvider>
        {/* 🔥 Envolvemos todo con el TasaProvider */}
        <TasaProvider>
          <RootLayoutContent />
        </TasaProvider>
      </ThemeProvider>
    </ContextoAutenticacionProvider>
  );
}
