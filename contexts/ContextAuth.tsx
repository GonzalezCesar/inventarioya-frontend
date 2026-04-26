import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { Platform } from "react-native"; // 🔥 Faltaba importar Platform
import api from "../services/api";
import { Usuario } from "../types";

interface ContextoAutenticacionType {
  user: Usuario | null; 
  token: string | null;
  isLoading: boolean;
  isSignout: boolean;
  signIn: (email: string, contrasena: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const ContextoAutenticacion = createContext<ContextoAutenticacionType>({
  user: null,
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
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  // Restaurar token al montar la app
  const restoreToken = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let savedToken = null;
      let savedUsuario = null;

      // 🔥 LÓGICA MULTIPLATAFORMA
      if (Platform.OS === 'web') {
        savedToken = localStorage.getItem("admin_token");
        savedUsuario = localStorage.getItem("admin_usuario");
      } else {
        savedToken = await SecureStore.getItemAsync("admin_token");
        savedUsuario = await SecureStore.getItemAsync("admin_usuario");
      }

      if (savedToken && savedUsuario) {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        setToken(savedToken);
        setUser(JSON.parse(savedUsuario));
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

      const response: any = await api.post("/auth/login", {
        email,
        contrasena,
      });

      const userData = response.usuario;
      const userToken = response.token;

      if (!userData || !userToken) {
        throw new Error("El servidor no devolvió las credenciales correctamente.");
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

      // 🔥 LÓGICA MULTIPLATAFORMA
      if (Platform.OS === 'web') {
        localStorage.setItem("admin_token", userToken);
        localStorage.setItem("admin_usuario", JSON.stringify(userData));
      } else {
        await SecureStore.setItemAsync("admin_token", userToken);
        await SecureStore.setItemAsync("admin_usuario", JSON.stringify(userData));
      }

      setToken(userToken);
      setUser(userData);
      setIsSignout(false);
    } catch (error: any) {
      console.error("[Auth] Error en signIn:", error.message);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      // 🔥 LÓGICA MULTIPLATAFORMA
      if (Platform.OS === 'web') {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_usuario");
      } else {
        await SecureStore.deleteItemAsync("admin_token");
        await SecureStore.deleteItemAsync("admin_usuario");
      }
      
      delete api.defaults.headers.common['Authorization'];

      setToken(null);
      setUser(null);
      setIsSignout(true);
    } catch (error) {
      console.log("[Auth] Error en signOut:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ContextoAutenticacion.Provider value={{ user, token, isLoading, isSignout, signIn, signOut, restoreToken }}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de ContextoAutenticacionProvider");
  }
  return context;
};