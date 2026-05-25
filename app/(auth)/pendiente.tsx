import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";

export default function PantallaPendiente() {
  const { signOut } = useAuth();

  const handleCerrarSesion = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.contenido}>
        <View style={estilos.iconoContenedor}>
          <FontAwesome5 name="clock" size={50} color="#8CC63F" />
        </View>
        <Text style={estilos.titulo}>Pago en Revisión</Text>
        <Text style={estilos.mensaje}>
          Hemos recibido tu comprobante de pago. Nuestro equipo está
          verificándolo. Te notificaremos cuando tu acceso sea activado.
        </Text>
        <TouchableOpacity style={estilos.boton} onPress={handleCerrarSesion}>
          <FontAwesome5
            name="sign-out-alt"
            size={16}
            color="#1a1a1a"
            style={{ marginRight: 8 }}
          />
          <Text style={estilos.textoBoton}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  contenido: {
    alignItems: "center",
    maxWidth: 400,
  },
  iconoContenedor: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(140,198,63,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    textAlign: "center",
  },
  mensaje: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  boton: {
    flexDirection: "row",
    backgroundColor: "#8CC63F",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBoton: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "bold",
  },
});
