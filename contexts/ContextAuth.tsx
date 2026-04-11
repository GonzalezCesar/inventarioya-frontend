import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Usuario, LoginResponse } from '../types';
import * as SecureStore from 'expo-secure-store';

interface ContextoAutenticacionType {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isSignout: boolean;
  signIn: (email: string, contrasena: string) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

export const ContextoAutenticacion = createContext<ContextoAutenticacionType>({
  usuario: null,
  token: null,
  isLoading: true,
  isSignout: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  restoreToken: async () => {},
  validateToken: async () => false,
  refreshToken: async () => false,
});

interface ContextoAutenticacionProviderProps {
  children: React.ReactNode;
}

export const ContextoAutenticacionProvider: React.FC<ContextoAutenticacionProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  // Restaurar token al montar la app
  const restoreToken = useCallback(async () => {
    try {
      setIsLoading(true);

      // Intenta obtener el token de SecureStore primero (más seguro)
      let savedToken: string | null = null;
      try {
        savedToken = await SecureStore.getItemAsync('token');
      } catch (error) {
        console.log('[Auth] SecureStore no disponible, usando AsyncStorage');
        savedToken = await AsyncStorage.getItem('token');
      }

      if (savedToken) {
        // Valida que el token siga siendo válido
        api.setToken(savedToken);
        try {
          const response = await api.validateToken();
          setToken(savedToken);
          setIsSignout(false);

          // Obtén los datos del usuario
          const meResponse = await api.getMe();
          if (meResponse && meResponse.usuario) {
            setUsuario(meResponse.usuario);
          }
        } catch (error) {
          console.log('[Auth] Token no válido, eliminando...');
          // Token no válido, limpia el almacenamiento
          await AsyncStorage.removeItem('token');
          try {
            await SecureStore.deleteItemAsync('token');
          } catch (e) {}
          setToken(null);
          setUsuario(null);
          setIsSignout(true);
        }
      } else {
        setIsSignout(true);
      }
    } catch (error) {
      console.log('[Auth] Error restaurando token:', error);
      setIsSignout(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Al montar, restaurar token (solo una vez)
  useEffect(() => {
    restoreToken();
  }, []); // Array vacío: ejecutar solo al montar

  // Función para iniciar sesión
  const signIn = useCallback(async (email: string, contrasena: string) => {
    try {
      setIsLoading(true);

      // MODO DESARROLLO: Login Mock sin backend
      if (email === 'demo@test.com' && contrasena === '123456') {
        console.log('[Auth] Usando login mock para desarrollo');
        const mockToken = 'mock_token_' + Math.random().toString(36).substr(2, 9);
        const mockUsuario: Usuario = {
          id: 1,
          nombre: 'Usuario Demo',
          correo: 'demo@test.com',
          rol: 'admin',
        };

        // Guardar token en almacenamiento seguro
        try {
          await SecureStore.setItemAsync('token', mockToken);
        } catch (error) {
          console.log('[Auth] SecureStore no disponible, usando AsyncStorage');
          await AsyncStorage.setItem('token', mockToken);
        }

        // Guardar usuario
        await AsyncStorage.setItem('usuario', JSON.stringify(mockUsuario));

        api.setToken(mockToken);
        setToken(mockToken);
        setUsuario(mockUsuario);
        setIsSignout(false);
        return;
      }

      // Intento real al backend
      const response = await api.login(email, contrasena);

      if (response && response.token && response.usuario) {
        // Guardar token en almacenamiento seguro
        try {
          await SecureStore.setItemAsync('token', response.token);
        } catch (error) {
          console.log('[Auth] SecureStore no disponible, usando AsyncStorage');
          await AsyncStorage.setItem('token', response.token);
        }

        // Guardar usuario
        await AsyncStorage.setItem('usuario', JSON.stringify(response.usuario));

        api.setToken(response.token);
        setToken(response.token);
        setUsuario(response.usuario);
        setIsSignout(false);
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error: any) {
      console.log('[Auth] Error en signIn:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para registrarse
  const signUp = useCallback(async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await api.register(userData);

      if (response && response.token && response.usuario) {
        try {
          await SecureStore.setItemAsync('token', response.token);
        } catch (error) {
          await AsyncStorage.setItem('token', response.token);
        }

        await AsyncStorage.setItem('usuario', JSON.stringify(response.usuario));

        api.setToken(response.token);
        setToken(response.token);
        setUsuario(response.usuario);
        setIsSignout(false);
      } else {
        throw new Error('Respuesta de registro inválida');
      }
    } catch (error: any) {
      console.log('[Auth] Error en signUp:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      // Limpia el almacenamiento
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('usuario');

      try {
        await SecureStore.deleteItemAsync('token');
      } catch (e) {}

      api.clearToken();
      setToken(null);
      setUsuario(null);
      setIsSignout(true);
    } catch (error) {
      console.log('[Auth] Error en signOut:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para validar token
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;

      api.setToken(token);
      const response = await api.validateToken();
      return response && response.success !== false;
    } catch (error) {
      console.log('[Auth] Token validation failed:', error);
      return false;
    }
  }, [token]);

  // Función para refrescar token (heartbeat)
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;

      api.setToken(token);
      const response = await api.heartbeat();
      return response && response.success !== false;
    } catch (error) {
      console.log('[Auth] Token refresh failed:', error);
      // Si falla el heartbeat, intenta cerrar sesión
      await signOut();
      return false;
    }
  }, [token, signOut]);

  const value = {
    usuario,
    token,
    isLoading,
    isSignout,
    signIn,
    signUp,
    signOut,
    restoreToken,
    validateToken,
    refreshToken,
  };

  return (
    <ContextoAutenticacion.Provider value={value}>
      {children}
    </ContextoAutenticacion.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = React.useContext(ContextoAutenticacion);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de ContextoAutenticacionProvider');
  }
  return context;
};
