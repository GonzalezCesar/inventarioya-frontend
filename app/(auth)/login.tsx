// app/(auth)/login.tsx
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
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
import { LinearGradient } from 'expo-linear-gradient'; // 🔥 Recuperamos el degradado
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Importamos el tema global
import ToggleTema from "../../components/ToggleTema"; // 🔥 Importamos tu botón animado

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  const router = useRouter();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // Estados del Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    titulo: "",
    mensaje: "",
    tipo: "error",
  });

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
      await signIn(email, contrasena);
    } catch (err: any) {
      mostrarAviso("Error", err?.message || "Credenciales inválidas", "error");
    }
  };

  return (
    // 🔥 Reemplazamos View por LinearGradient para el fondo elegante
    <LinearGradient
      colors={[colores.fondoOscuro, colores.secundario]}
      style={estilos.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={estilos.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Toggle de Tema Original */}
          <View style={estilos.headerActions}>
            <ToggleTema />
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
                  style={[estilos.input, !isDark && { borderColor: colores.primario }]}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colores.textoGris}
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
                  style={[estilos.input, !isDark && { borderColor: colores.primario }]}
                  placeholder="••••••••"
                  placeholderTextColor={colores.textoGris}
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
                    <ActivityIndicator color={colores.textoOscuro} />
                  ) : (
                    <Text style={estilos.primaryButtonText}>Iniciar Sesión</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[estilos.button, estilos.secondaryButton]}
                  onPress={() => router.push("/(auth)/registro")}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.secondaryButtonText}>Crear Cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* --- MODAL DE ERROR --- */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={estilos.modalOverlay}>
            <View style={estilos.modalContent}>
              <View style={estilos.iconoModalContainer}>
                <FontAwesome5
                  name={modalConfig.tipo === "error" ? "exclamation-triangle" : "check-circle"}
                  size={50}
                  color={modalConfig.tipo === "error" ? colores.error : colores.primario}
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
    </LinearGradient>
  );
}

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
  },
  formWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80, // Espacio para el switch superior
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
    color: c.primario, // En modo claro se verá verde manzana, en oscuro verde neón
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: c.textoGris,
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
    color: c.textoBlanco, // En modo claro se vuelve oscuro
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: c.fondoInput,
    borderWidth: 1,
    borderColor: c.borde,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: c.textoBlanco,
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
    backgroundColor: c.primarioLogin,
  },
  primaryButtonText: {
    color: c.textoOscuro, // Letras oscuras sobre el fondo primario
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: c.primarioLogin,
  },
  secondaryButtonText: {
    color: c.primarioLogin,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // --- Estilos del Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: c.fondoTarjeta,
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
    color: c.textoBlanco,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMensaje: {
    color: c.textoGris,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  botonModal: {
    backgroundColor: c.primario,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  textoBotonModal: {
    color: c.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
});