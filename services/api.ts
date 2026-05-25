import axios from "axios";
import { Platform } from "react-native"; // 🔥 Asegúrate de importar Platform
import AsyncStorage from "@react-native-async-storage/async-storage";

// Asegúrate de que esta sea tu IP correcta
import { API_URL } from '../config/env'; // 🔥 Importamos la URL maestra

const api = axios.create({
  baseURL: API_URL, // 🔥 La usamos aquí
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 ESTE ES EL INTERCEPTOR QUE DEBES ACTUALIZAR
api.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // Lógica Multiplataforma para leer el Token
      if (Platform.OS === "web") {
        token = localStorage.getItem("admin_token");
      } else {
        token = await AsyncStorage.getItem("admin_token");
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error obteniendo el token en el interceptor", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;