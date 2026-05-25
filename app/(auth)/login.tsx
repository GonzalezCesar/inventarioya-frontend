import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import ToggleTema from "../../components/ToggleTema";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";

export default function LoginScreen() {
  const { signIn, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  // Tema global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // Estados comunes
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estados exclusivos Web
  const [errorMsg, setErrorMsg] = useState("");

  // Estados exclusivos Móvil (Modal)
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
      if (Platform.OS === "web") {
        setErrorMsg("Por favor, completa ambos campos.");
      } else {
        mostrarAviso(
          "Datos Incompletos",
          "Por favor completa todos los campos",
          "error",
        );
      }
      return;
    }

    if (Platform.OS === "web") setErrorMsg("");
    setCargando(true);

    try {
      const userData = await signIn(email, contrasena);

      const estadoPago = userData?.estado_pago;
      if (estadoPago === "pendiente" || estadoPago === "en_validacion") {
        const mensaje =
          estadoPago === "en_validacion"
            ? "Hemos recibido tu comprobante de pago. Nuestro equipo está verificándolo. Te notificaremos cuando tu acceso sea activado."
            : "Tu cuenta está en proceso de aprobación. Debes completar el proceso de pago para acceder a la aplicación.";

        if (Platform.OS === "web") {
          setErrorMsg(mensaje);
          setCargando(false);
          return;
        } else {
          mostrarAviso("Cuenta en Revisión", mensaje, "error");
          setCargando(false);
          return;
        }
      }

      if (Platform.OS === "web") {
        window.location.href = "/panel-web";
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      // 🔥 AQUÍ ESTÁ LA MAGIA: Extraemos el mensaje de error EXACTO que manda tu backend PHP
      const mensajeBackend =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Credenciales inválidas o error de red.";

      if (Platform.OS === "web") {
        setErrorMsg(mensajeBackend);
      } else {
        // Mostramos el mensaje del backend en tu Modal elegante
        mostrarAviso("Acceso Denegado", mensajeBackend, "error");
      }
    } finally {
      setCargando(false);
    }
  };

  const isLoading = cargando || authIsLoading;

  // =========================================================
  // 💻 RENDERIZADO EXCLUSIVO PARA WEB (PANEL SAAS)
  // =========================================================
  if (Platform.OS === "web") {
    return (
      <KeyboardAvoidingView
        behavior="height"
        style={estilosWeb.contenedorFondo}
      >
        <View style={estilosWeb.tarjetaLogin}>
          <View style={estilosWeb.headerTarjeta}>
            <Text style={estilosWeb.logoTexto}>InventarioYa</Text>
            <Text style={estilosWeb.titulo}>Bienvenido</Text>
            <Text style={estilosWeb.subtitulo}>
              Ingresa a tu panel administrativo
            </Text>
          </View>

          <View style={estilosWeb.formGroup}>
            <Text style={estilosWeb.label}>Correo Electrónico</Text>
            <TextInput
              style={estilosWeb.input}
              placeholder="admin@inventarioya.com"
              placeholderTextColor="#8a8a8a"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={estilosWeb.formGroup}>
            <Text style={estilosWeb.label}>Contraseña</Text>
            <TextInput
              style={estilosWeb.input}
              placeholder="••••••••"
              placeholderTextColor="#8a8a8a"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
            />
          </View>

          {errorMsg ? (
            <Text style={estilosWeb.textoError}>{errorMsg}</Text>
          ) : null}

          <TouchableOpacity
            style={[estilosWeb.botonEntrar, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={estilosWeb.textoBoton}>Entrar al Panel</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================
  // 📱 RENDERIZADO EXCLUSIVO PARA MÓVIL (iOS / Android)
  // =========================================================
  return (
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
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
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
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
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
                    <Text style={estilos.primaryButtonText}>
                      Iniciar Sesión
                    </Text>
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
                  name={
                    modalConfig.tipo === "error"
                      ? "exclamation-triangle"
                      : "check-circle"
                  }
                  size={50}
                  color={
                    modalConfig.tipo === "error"
                      ? colores.error
                      : colores.primario
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
    </LinearGradient>
  );
}

// --- ESTILOS EXCLUSIVOS DE WEB ---
const estilosWeb = StyleSheet.create({
  contenedorFondo: {
    flex: 1,
    backgroundColor: "#0d110d",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tarjetaLogin: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1a1a",
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTarjeta: { alignItems: "center", marginBottom: 30 },
  logoTexto: {
    fontSize: 22,
    fontWeight: "900",
    color: "#c6ff00",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  subtitulo: { fontSize: 14, color: "#8a8a8a" },
  formGroup: { marginBottom: 20 },
  label: { color: "#8a8a8a", fontSize: 12, marginBottom: 8, marginLeft: 2 },
  input: {
    backgroundColor: "#0d110d",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 14,
  },
  textoError: {
    color: "#ff4444",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 15,
  },
  botonEntrar: {
    backgroundColor: "#c6ff00",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  textoBoton: { color: "#000000", fontSize: 15, fontWeight: "bold" },
});

// 🔥 ESTILOS DINÁMICOS MÓVIL
const crearEstilos = (c: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    headerActions: {
      position: "absolute",
      top: Platform.OS === "ios" ? 60 : 40,
      right: 24,
      zIndex: 10,
    },
    formWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 80,
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
      color: c.primario,
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
      color: c.textoBlanco,
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
      backgroundColor: c.primarioLogin || c.primario,
    },
    primaryButtonText: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: c.primarioLogin || c.primario,
    },
    secondaryButtonText: {
      color: c.primarioLogin || c.primario,
      fontSize: 16,
      fontWeight: "bold",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay || "rgba(0,0,0,0.5)",
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
