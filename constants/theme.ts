// constants/theme.ts
import { Platform } from "react-native";

export type ColoresType = {
  primario: string;
  primarioOscuro: string;
  primarioClaro: string;
  verdeAccion: string;
  secundario: string;
  secundarioClaro: string;
  secundarioOscuro: string;
  acento: string;
  acentoAzul: string;
  acentoCian: string;
  acentoMorado: string;
  acentoRosa: string;
  acentoVerde: string;
  fondoOscuro: string;
  fondoTarjeta: string;
  fondoTarjetaClaro: string;
  fondoInput: string; // Añadido para consistencia con tu UI nueva
  textoBlanco: string;
  textoGris: string;
  textoGrisClaro: string;
  textoOscuro: string;
  textoClaro: string;
  textoResaltado: string;
  exito: string;
  error: string;
  advertencia: string;
  info: string;
  gradientePrimario: string[];
  gradienteOscuro: string[];
  gradienteTarjeta: string[];
  overlay: string;
  overlayClaro: string;
  blancoTransparente: string;
  borde: string;
  bordeClaro: string;
  primarioLogin: string;
  gradienteLogin: string[];
  subtitulos: string;
};

// Paleta base
const VERDE_PRIMARIO = "#C4FF0E";

export const PALETA_OSCURA: ColoresType = {
  primario: VERDE_PRIMARIO,
  primarioOscuro: "#9FCC0B",
  primarioClaro: "#D4FF4E",
  verdeAccion: "#B7EF00",
  secundario: "#1A1A1A",
  secundarioClaro: "#2A2A2A",
  secundarioOscuro: "#0F0F0F",
  acento: "#FFC107",
  acentoAzul: "#4FC3F7",
  acentoCian: "#26C6DA",
  acentoMorado: "#AB47BC",
  acentoRosa: "#EC407A",
  acentoVerde: "#66BB6A",
  fondoOscuro: "#18211E", // Tu fondo oscuro original
  fondoTarjeta: "#1A1A1A",
  fondoTarjetaClaro: "#252525",
  fondoInput: "#1C1C1E", // Consistencia con los inputs de tu UI
  textoBlanco: "#FFFFFF",
  textoGris: "#B0B0B0",
  textoGrisClaro: "#E0E0E0",
  textoOscuro: "#000000",
  textoClaro: "#E0E0E0",
  textoResaltado: VERDE_PRIMARIO,
  exito: "#00FF88",
  error: "#FF3B30",
  advertencia: "#FFD60A",
  info: "#00D9FF",
  gradientePrimario: [VERDE_PRIMARIO, "#9FCC0B"],
  gradienteOscuro: ["#1A1A1A", "#0F0F0F"],
  gradienteTarjeta: ["#2A2A2A", "#1A1A1A"],
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayClaro: "rgba(0, 0, 0, 0.5)",
  blancoTransparente: "rgba(255, 255, 255, 0.1)",
  borde: "#2A2A2A",
  bordeClaro: "#3A3A3A",
  primarioLogin: VERDE_PRIMARIO,
  gradienteLogin: [VERDE_PRIMARIO, "#9FCC0B"],
  subtitulos: VERDE_PRIMARIO,
};

export const PALETA_CLARA: ColoresType = {
  primario: "rgb(196, 255, 13)",
  primarioOscuro: "#9FCC0B",
  primarioClaro: "#D4FF4E",
  verdeAccion: "#B7EF00",
  secundario: "#F5F5F5",
  secundarioClaro: "#FFFFFF",
  secundarioOscuro: "#E0E0E0",
  acento: "#FFC107",
  acentoAzul: "#0288D1",
  acentoCian: "#00ACC1",
  acentoMorado: "#8E24AA",
  acentoRosa: "#D81B60",
  acentoVerde: "#43A047",
  fondoOscuro: "#F0F2F5", // Tu fondo claro original
  fondoTarjeta: "#FFFFFF",
  fondoTarjetaClaro: "#F9F9F9",
  fondoInput: "#E5E5EA", // Gris clarito para inputs
  textoBlanco: "#1A1A1A", // Importante: en modo claro, este texto debe ser oscuro
  textoGris: "#757575",
  textoGrisClaro: "#9E9E9E",
  textoOscuro: "#000000",
  textoClaro: "#424242",
  textoResaltado: "#689F38",
  exito: "#2E7D32",
  error: "#C62828",
  advertencia: "#F9A825",
  info: "#0277BD",
  gradientePrimario: ["rgb(196, 255, 13)", "#9FCC0B"],
  gradienteOscuro: ["#F5F5F5", "#E0E0E0"],
  gradienteTarjeta: ["#FFFFFF", "#F5F5F5"],
  overlay: "rgba(0, 0, 0, 0.3)",
  overlayClaro: "rgba(0, 0, 0, 0.1)",
  blancoTransparente: "rgba(0, 0, 0, 0.05)",
  borde: "#E0E0E0",
  bordeClaro: "#EEEEEE",
  primarioLogin: "rgb(143, 191, 19)",
  gradienteLogin: ["rgb(143, 191, 19)", "#9FCC0B"],
  subtitulos: "#8FBF13",
};

export const obtenerColores = (modo: "claro" | "oscuro"): ColoresType => {
  return modo === "claro" ? PALETA_CLARA : PALETA_OSCURA;
};

// ... mantenemos las fuentes por si las necesitas luego
export const Fonts = Platform.select({
  // ... tu código de Fonts
});
