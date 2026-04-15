import { Redirect } from "expo-router";
import { useAuth } from "../contexts/ContextAuth";

export default function Index() {
  const { token, isLoading } = useAuth();

  // Mientras verifica el token en el storage, no renderiza nada
  // (el _layout se encarga de mantener el Splash Screen visible)
  if (isLoading) {
    return null;
  }

  // Redirección dinámica y segura
  return <Redirect href={token ? "/(tabs)" : "/(auth)/login"} />;
}
