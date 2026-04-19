import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";

// --- TEMA BASADO EN TU CAPTURA ---
const COLORES = {
  fondoOscuro: "#121212", // Fondo negro de la app
  fondoInput: "#1C1C1E", // Fondo de los text inputs
  fondoModal: "#2C2C2E", // Fondo gris del modal
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  error: "#FF3B30",
  borde: "#38383A",
};

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Estados del Modal Personalizado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    titulo: "",
    mensaje: "",
    tipo: "error", // 'error' o 'exito'
  });

  const router = useRouter();

  const mostrarAviso = (titulo: string, mensaje: string, tipo = "error") => {
    setModalConfig({ titulo, mensaje, tipo });
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !contrasena.trim()) {
      mostrarAviso("Error", "Por favor completa todos los campos", "error");
      return;
    }

    try {
      console.log("Iniciando sesión con:", email);
      await signIn(email, contrasena);
      // Si todo sale bien, el contexto redirige al Dashboard automáticamente
    } catch (err: any) {
      console.error("ERROR DE API:", err.message);
      mostrarAviso("Error", err?.message || "Credenciales inválidas", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.container}
    >
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle de Tema (Visual Superior Derecho) */}
        <View style={estilos.header}>
          <View style={estilos.themeToggleMock}>
            <View style={estilos.themeToggleKnob}>
              <FontAwesome5 name="moon" size={12} color="#000" />
            </View>
          </View>
        </View>

        <View style={estilos.formWrapper}>
          {/* Logo iya */}
          <View style={estilos.logoContainer}>
            <Image
              source={require("../../assets/images/iya.png")}
              style={estilos.logoImage}
              contentFit="contain"
              transition={1000}
            />
          </View>

          {/* Título y subtítulo */}
          <Text style={estilos.title}>Inventario Ya</Text>
          <Text style={estilos.subtitle}>
            Gestiona tu inventario de forma inteligente
          </Text>

          {/* Formulario */}
          <View style={estilos.formContainer}>
            <View style={estilos.formGroup}>
              <Text style={estilos.label}>Correo Electrónico</Text>
              <TextInput
                style={estilos.input}
                placeholder="tu@betatester.com"
                placeholderTextColor={COLORES.textoGris}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={estilos.formGroup}>
              <Text style={estilos.label}>Contraseña</Text>
              <TextInput
                style={estilos.input}
                placeholder="••••••••"
                placeholderTextColor={COLORES.textoGris}
                secureTextEntry
                editable={!isLoading}
                value={contrasena}
                onChangeText={setContrasena}
              />
            </View>

            {/* Botones */}
            <View style={estilos.buttonContainer}>
              <TouchableOpacity
                style={[
                  estilos.button,
                  estilos.primaryButton,
                  isLoading && estilos.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORES.textoOscuro} />
                ) : (
                  <Text style={estilos.primaryButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.button, estilos.secondaryButton]}
                onPress={() => router.push("/(auth)/registro")} // ACÁ ESTÁ LA SOLUCIÓN
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={estilos.secondaryButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL DE ERROR (Idéntico a tu captura) --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            {/* Icono Triangular de Advertencia */}
            <View style={estilos.iconoModalContainer}>
              <FontAwesome5
                name={
                  modalConfig.tipo === "error"
                    ? "exclamation-triangle"
                    : "check-circle"
                }
                size={50}
                color={
                  modalConfig.tipo === "error"
                    ? COLORES.error
                    : COLORES.primario
                }
              />
            </View>

            <Text style={estilos.modalTitulo}>{modalConfig.titulo}</Text>
            <Text style={estilos.modalMensaje}>{modalConfig.mensaje}</Text>

            <TouchableOpacity
              style={estilos.botonModal}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={estilos.textoBotonModal}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondoOscuro,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    width: "100%",
    alignItems: "flex-end",
    paddingTop: 50,
    paddingRight: 24,
  },
  themeToggleMock: {
    width: 50,
    height: 30,
    backgroundColor: COLORES.fondoModal,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  themeToggleKnob: {
    width: 22,
    height: 22,
    backgroundColor: COLORES.textoBlanco,
    borderRadius: 11,
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
  },
  formWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    color: COLORES.primario,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: COLORES.textoGris,
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: COLORES.fondoInput,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: COLORES.textoBlanco,
  },
  buttonContainer: {
    marginTop: 10,
    gap: 16,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORES.primario,
  },
  primaryButtonText: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORES.primario,
  },
  secondaryButtonText: {
    color: COLORES.primario,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // --- Estilos del Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORES.fondoModal,
    borderRadius: 24,
    padding: 30,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconoModalContainer: {
    marginBottom: 20,
  },
  modalTitulo: {
    color: COLORES.textoBlanco,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMensaje: {
    color: COLORES.textoGris,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  botonModal: {
    backgroundColor: COLORES.primario,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  textoBotonModal: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
});
