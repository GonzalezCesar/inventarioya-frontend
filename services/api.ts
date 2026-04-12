import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Apuntando directo a tu PHP de la terminal.
// (El '/api' al final asegura que tu enrutador PHP lo procese correctamente)
const API_URL = "http://192.168.1.111:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Peticiones
api.interceptors.request.use(
  async (config) => {
    // 1. Buscamos el token EXCLUSIVAMENTE en la bóveda segura de Expo
    const token = await SecureStore.getItemAsync("admin_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Lógica estricta de "no-cache" para peticiones GET (Herencia de tu app vieja)
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de Respuestas
api.interceptors.response.use(
  (response) => {
    // Retornamos directamente la data limpia
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Extraemos el error que manda tu PHP o damos uno genérico
    const errorMessage =
      error.response?.data?.error || "Error en la petición de red";

    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
