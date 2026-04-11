import { Redirect } from "expo-router";
import { useAuth } from "../contexts/ContextAuth";

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null; // Keep splash screen visible
  }

  // Redirige basado en estado de autenticación
  return <Redirect href={token ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
