import axios from "axios";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./ContextAuth"; // 🔥 Importamos el Auth para saber si hay sesión

interface ContextoTasaType {
  tasaBCV: number;
  fecha: string;
  cargando: boolean;
  actualizarTasa: () => Promise<void>;
}

const ContextoTasa = createContext<ContextoTasaType | undefined>(undefined);

export const TasaProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasaBCV, setTasaBCV] = useState<number>(0);
  const [fecha, setFecha] = useState<string>("");
  const [cargando, setCargando] = useState(false);

  // 🔥 Traemos el token de la sesión actual
  const { token } = useAuth(); 

  // 🛠️ Función separada y blindada para guardar en el backend
  const sincronizarConBackend = async (tasa: number) => {
    try {
      // Intento 1: La ruta exacta de tu README
      await api.put("/configuracion/tasa-cambio", { tasa: tasa });
      console.log("✅ Tasa BCV guardada en la base de datos:", tasa);
    } catch (dbError: any) {
      console.log("⚠️ Error con la ruta principal:", dbError.response?.data || dbError.message);
      
      // Intento 2: Plan B usando tu método genérico ConfiguracionController@store
      try {
        await api.post("/configuracion", { clave: "tasa_cambio", valor: tasa });
        console.log("✅ Tasa BCV guardada usando la ruta de respaldo.");
      } catch (e) {
        console.log("❌ No se pudo guardar la tasa en BD. Verifica las rutas en api.php.");
      }
    }
  };

  const actualizarTasa = useCallback(async () => {
    try {
      setCargando(true);
      const res = await axios.get("https://ve.dolarapi.com/v1/dolares/oficial");

      if (res.data && res.data.promedio) {
        const nuevaTasa = res.data.promedio;
        setTasaBCV(nuevaTasa);

        const fechaObj = new Date(res.data.fechaActualizacion);
        setFecha(fechaObj.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }));

        // Si ya hay una sesión activa cuando el usuario le da al botón de recargar, enviamos de una vez
        if (token) {
          sincronizarConBackend(nuevaTasa);
        }
      }
    } catch (error) {
      console.error("Error obteniendo tasa de DolarAPI:", error);
    } finally {
      setCargando(false);
    }
  }, [token]);

  // 🔥 MAGIA DE SINCRONIZACIÓN: 
  // Esto detecta el momento exacto en el que el usuario inicia sesión. 
  // Si ya habíamos descargado la tasa, la manda a PHP inmediatamente.
  useEffect(() => {
    if (token && tasaBCV > 0) {
      sincronizarConBackend(tasaBCV);
    }
  }, [token, tasaBCV]);

  // Carga inicial
  useEffect(() => {
    actualizarTasa();
  }, [actualizarTasa]);

  return (
    <ContextoTasa.Provider value={{ tasaBCV, fecha, cargando, actualizarTasa }}>
      {children}
    </ContextoTasa.Provider>
  );
};

export const useTasa = () => {
  const context = useContext(ContextoTasa);
  if (!context) throw new Error("useTasa debe usarse dentro de TasaProvider");
  return context;
};