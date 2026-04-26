import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme"; // Para el diseño móvil

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  // Tema para la versión móvil
  const { colores } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg("Por favor, completa ambos campos.");
      return;
    }
    setErrorMsg("");
    setCargando(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      setErrorMsg("Credenciales inválidas o error de red.");
    } finally {
      setCargando(false);
    }
  };

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
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {errorMsg ? (
            <Text style={estilosWeb.textoError}>{errorMsg}</Text>
          ) : null}

          <TouchableOpacity
            style={[estilosWeb.botonEntrar, cargando && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        backgroundColor: colores.fondoOscuro,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text
          style={{ fontSize: 32, fontWeight: "bold", color: colores.primario }}
        >
          InventarioYa
        </Text>
        <Text style={{ fontSize: 16, color: colores.textoGris, marginTop: 10 }}>
          Inicia sesión para continuar
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{ color: colores.textoGris, marginBottom: 8, marginLeft: 5 }}
        >
          Correo Electrónico
        </Text>
        <TextInput
          style={{
            backgroundColor: colores.fondoInput,
            color: colores.textoBlanco,
            padding: 15,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colores.borde,
          }}
          placeholder="tu@correo.com"
          placeholderTextColor={colores.textoGris}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{ color: colores.textoGris, marginBottom: 8, marginLeft: 5 }}
        >
          Contraseña
        </Text>
        <TextInput
          style={{
            backgroundColor: colores.fondoInput,
            color: colores.textoBlanco,
            padding: 15,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colores.borde,
          }}
          placeholder="••••••••"
          placeholderTextColor={colores.textoGris}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {errorMsg ? (
        <Text
          style={{
            color: colores.error,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {errorMsg}
        </Text>
      ) : null}

      <TouchableOpacity
        style={{
          backgroundColor: colores.primario,
          padding: 18,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 10,
        }}
        onPress={handleLogin}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color={colores.textoOscuro} />
        ) : (
          <Text
            style={{
              color: colores.textoOscuro,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Iniciar Sesión
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
