import { TasaProvider } from "@/contexts/ContextTasa"; 
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
  const { isLoading, token, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentScreen = segments[segments.length - 1];
    
    const isActivacion = currentScreen === "activacion";
    const isLoginOrRegistro = currentScreen === "login" || currentScreen === "registro";

    if (token) {
      // 🛡️ Lógica de seguridad estricta
      const esSuperAdmin = user?.rol?.toLowerCase() === "superadmin";
      const estadoPago = user?.estado_pago;
      const yaSubioPago = !!(user?.pago_adjunto || user?.pago_referencia);
      
      const necesitaPago = !esSuperAdmin && (estadoPago === "pendiente" || !estadoPago) && !yaSubioPago;
      const necesitaValidacion = !esSuperAdmin && (estadoPago === "en_validacion" || (estadoPago === "pendiente" && yaSubioPago));
      const isPendiente = currentScreen === "pendiente";

      if (necesitaPago) {
        if (!isActivacion) {
          router.replace("/(auth)/activacion");
        }
      } else if (necesitaValidacion) {
        if (!isPendiente) {
          router.replace("/(auth)/pendiente");
        }
      } else {
        if (inAuthGroup) {
          router.replace("/(tabs)");
        }
      }
    } else {
      // 🔥 AQUÍ CORREGIMOS EL BUG DE CERRAR SESIÓN
      // Si no hay token (cerró sesión), el usuario SOLO tiene permiso de estar en Login o Registro.
      // Si está en Activación, lo expulsamos al Login instantáneamente.
      if (!isLoginOrRegistro) {
        router.replace("/(auth)/login");
      }
    }

    try {
      SplashScreen.hideAsync();
    } catch (error) {}
  }, [isLoading, token, user, segments, router]);

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
        <TasaProvider>
          <RootLayoutContent />
        </TasaProvider>
      </ThemeProvider>
    </ContextoAutenticacionProvider>
  );
}