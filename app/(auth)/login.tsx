import { Image } from "expo-image";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../contexts/ContextAuth";

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !contrasena.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      setError("");
      console.log("Iniciando sesión con:", email);

      // Llamamos a la función signIn de tu contexto (¡Que ya no tiene el .php!)
      await signIn(email, contrasena);

      // Si todo sale bien, Expo Router (gracias a tu index.tsx raíz)
      // te teletransportará automáticamente al Dashboard.
    } catch (err: any) {
      console.error("ERROR DE API:", err.message);
      // Mostramos el mensaje de error real en la pantalla roja de tu app
      setError(err?.message || "Credenciales inválidas");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle de Tema (Visual/Placeholder superior derecho) */}
        <View style={styles.header}>
          <View style={styles.themeToggleMock}>
            <View style={styles.themeToggleKnob} />
          </View>
        </View>

        <View style={styles.formWrapper}>
          {/* Mock del Logo - Puedes cambiarlo por un <Image source={require('...')} /> */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/iya.png")}
              style={styles.logoImage}
              contentFit="contain"
              transition={1000}
            />
          </View>

          {/* Título y subtítulo */}
          <Text style={styles.title}>Inventario Ya</Text>
          <Text style={styles.subtitle}>
            Gestiona tu inventario de forma inteligente
          </Text>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@betatester.com"
                placeholderTextColor={Colors.neon.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.neon.textSecondary}
                secureTextEntry
                editable={!isLoading}
                value={contrasena}
                onChangeText={setContrasena}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.neon.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neon.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    width: "100%",
    alignItems: "flex-end",
    paddingTop: 50, // Espacio para el status bar
    paddingRight: 24,
  },
  // Simulación visual del switch de la esquina
  themeToggleMock: {
    width: 50,
    height: 30,
    backgroundColor: Colors.neon.card,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  themeToggleKnob: {
    width: 22,
    height: 22,
    backgroundColor: Colors.neon.text,
    borderRadius: 11,
    alignSelf: "flex-end", // Simula que está en modo oscuro
  },
  formWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: Colors.neon.primary,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 42,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#000000",
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: Colors.neon.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: Colors.neon.textSecondary,
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.neon.text,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: Colors.neon.card,
    borderWidth: 1,
    borderColor: Colors.neon.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.neon.text,
  },
  buttonContainer: {
    marginTop: 10,
    gap: 16, // Espaciado nativo entre botones
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: Colors.neon.primary,
  },
  primaryButtonText: {
    color: "#000000", // El texto negro contrasta perfecto con el neón
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.neon.primary,
  },
  secondaryButtonText: {
    color: Colors.neon.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: Colors.neon.error,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
});
