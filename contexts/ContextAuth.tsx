import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { Usuario } from "../types";

interface ContextoAutenticacionType {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isSignout: boolean;
  signIn: (email: string, contrasena: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const ContextoAutenticacion = createContext<ContextoAutenticacionType>({
  usuario: null,
  token: null,
  isLoading: true,
  isSignout: false,
  signIn: async () => {},
  signOut: async () => {},
  restoreToken: async () => {},
});

interface ContextoAutenticacionProviderProps {
  children: React.ReactNode;
}

export const ContextoAutenticacionProvider: React.FC<
  ContextoAutenticacionProviderProps
> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  // Restaurar token al montar la app
  const restoreToken = useCallback(async () => {
    try {
      setIsLoading(true);

      // Usamos EXCLUSIVAMENTE SecureStore
      const savedToken = await SecureStore.getItemAsync("admin_token");
      const savedUsuario = await SecureStore.getItemAsync("admin_usuario");

      if (savedToken && savedUsuario) {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUsuario));
        setIsSignout(false);
      } else {
        setIsSignout(true);
      }
    } catch (error) {
      console.log("[Auth] Error restaurando sesión:", error);
      setIsSignout(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  // Función para iniciar sesión
  const signIn = useCallback(async (email: string, contrasena: string) => {
    try {
      setIsLoading(true);

      // 1. Petición real al backend PHP usando Axios
      const response: any = await api.post("/auth/login", {
        email,
        contrasena,
      });

      // 2. Extraemos la data (Axios ya parsea el JSON)
      const userData = response.usuario;
      const userToken = response.token;

      if (!userData || !userToken) {
        throw new Error(
          "El servidor no devolvió las credenciales correctamente.",
        );
      }

      // 3. Lógica de seguridad original de tu app (Migrada de api.js)
      const isOwner =
        userData.email &&
        userData.email.toLowerCase() === "litoramirez2005@gmail.com";
      const isAdminID =
        userData.id === "admin_001" || userData.id === "admin_init_001";

      // Si usabas roles en tu DB, podemos validarlo también. Por ahora validamos emails/IDs como tenías.
      if (!isOwner && !isAdminID) {
        throw new Error(
          "Acceso denegado. Solo el dueño de la plataforma puede ingresar.",
        );
      }

      // 4. Guardamos en almacenamiento seguro nativo
      await SecureStore.setItemAsync("admin_token", userToken);
      await SecureStore.setItemAsync("admin_usuario", JSON.stringify(userData));

      // 5. Actualizamos el estado global
      setToken(userToken);
      setUsuario(userData);
      setIsSignout(false);
    } catch (error: any) {
      console.error("[Auth] Error en signIn:", error.message);
      throw error; // Lanzamos el error para que el login.tsx lo muestre en rojo
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      // Limpia la bóveda segura
      await SecureStore.deleteItemAsync("admin_token");
      await SecureStore.deleteItemAsync("admin_usuario");

      setToken(null);
      setUsuario(null);
      setIsSignout(true);
    } catch (error) {
      console.log("[Auth] Error en signOut:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    usuario,
    token,
    isLoading,
    isSignout,
    signIn,
    signOut,
    restoreToken,
  };

  return (
    <ContextoAutenticacion.Provider value={value}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error(
      "useAuth debe ser usado dentro de ContextoAutenticacionProvider",
    );
  }
  return context;
};
