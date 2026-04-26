import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api"; // 🔥 Importamos tu API para conectarnos al backend

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

  const actualizarTasa = useCallback(async () => {
    try {
      setCargando(true);
      const res = await axios.get("https://ve.dolarapi.com/v1/dolares/oficial");

      if (res.data && res.data.promedio) {
        setTasaBCV(res.data.promedio);

        const fechaObj = new Date(res.data.fechaActualizacion);
        setFecha(
          fechaObj.toLocaleString("es-VE", {
            dateStyle: "short",
            timeStyle: "short",
          }),
        );

        // 🔥 AQUÍ ESTÁ LA MAGIA: Guardamos la tasa en tu backend con la ruta exacta del README
        try {
          await api.put("/configuracion/tasa-cambio", {
            tasa: res.data.promedio,
          });
          console.log(
            "Tasa guardada en la base de datos correctamente al precio de:",
            res.data.promedio,
          );
        } catch (dbError) {
          console.log(
            "No se pudo guardar la tasa en BD, pero seguimos funcionando en el cel.",
          );
        }
      }
    } catch (error) {
      console.error("Error obteniendo tasa de DolarAPI:", error);
    } finally {
      setCargando(false);
    }
  }, []);

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
