import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#c6ff00"; // Tu verde neón principal

export const Colors = {
  // Mantenemos la estructura por defecto de Expo para evitar errores en otros componentes
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ffffff",
    background: "#0d110d", // Tu fondo ultra oscuro
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  // Aquí está tu paleta web exportada directamente
  neon: {
    primary: "#c6ff00",
    primaryHover: "#aee600",
    secondary: "#1a1f1a",
    background: "#0d110d",
    card: "#1a1a1a",
    text: "#ffffff",
    textSecondary: "#8a8a8a",
    border: "rgba(198, 255, 0, 0.2)", // Convertido a RGBA para React Native
    error: "#ff4444",
    success: "#c6ff00",
    glass: "rgba(26, 31, 26, 0.8)",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
