import { FontAwesome5 } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";
import { router } from "expo-router";

const COLOR_VERDE = "#8CC63F";

export default function PantallaActivacion() {
  const { user, signOut, updateUser } = useAuth();

  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

  const [enValidacion, setEnValidacion] = useState(
    user?.estado_pago === "en_validacion",
  );
  const [cargando, setCargando] = useState(false);

  const [referencia, setReferencia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [banco, setBanco] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [imagen, setImagen] = useState<string | null>(null);

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Error", "Necesitamos acceso a la galería");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const manipulado = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1200 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      setImagen(`data:image/jpeg;base64,${manipulado.base64}`);
    }
  };

  const enviarPago = async () => {
    if (!referencia || !telefono || !banco || !imagen)
      return Alert.alert("Error", "Completa todos los campos");

    setCargando(true);
    try {
      // ¡CAMBIO CLAVE: Apuntamos al PagoController!
      await api.post('/pagos/subir', {
        usuario_id: user?.id,
        referencia: referencia,
        telefono: telefono,
        banco: banco,
        fecha: fecha,
        imagen: imagen,
      });
      updateUser({ estado_pago: "en_validacion" });
      setEnValidacion(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo subir la información");
    } finally {
      setCargando(false);
    }
  };

  if (enValidacion) {
    return (
      <View
        style={[
          estilos.contenedor,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={estilos.tituloValidacion}>Validación en Proceso</Text>
        <Text style={estilos.subtituloValidacion}>
          Hemos recibido la información de tu pago correctamente.
        </Text>
        <Text style={estilos.textoInfo}>
          Nuestro equipo administrativo está verificando la transacción. Una vez
          validado, podrás acceder a todas las funciones de la aplicación
          automáticamente.
        </Text>
        <View style={estilos.cajaTiempo}>
          <Text style={estilos.textoTiempo}>
            El proceso suele tardar menos de 24 horas hábiles.
          </Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          style={{ marginTop: 50 }}
        >
          <Text
            style={{
              color: isDark ? colores.textoGris : "#888",
              fontWeight: "bold",
            }}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <FontAwesome5 name="dollar-sign" size={60} color={COLOR_VERDE} />
          <Text style={estilos.tituloPrincipal}>Activación de Cuenta</Text>
          <Text style={estilos.subtitulo}>
            Para comenzar a usar INVENTARIO YA, realiza el pago a la cuenta que se indica.
          </Text>
        </View>

        <View style={estilos.tarjetaInstrucciones}>
          <Text
            style={{
              color: COLOR_VERDE,
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 15,
            }}
          >
            Instrucciones de Pago
          </Text>
          <View style={estilos.filaInst}>
            <Text style={estilos.lblInst}>Método:</Text>
            <Text style={estilos.valInst}>Pago Móvil / Transferencia</Text>
          </View>
          <View style={estilos.filaInst}>
            <Text style={estilos.lblInst}>Banco Receptor:</Text>
            <Text style={estilos.valInst}>BNC (0191)</Text>
          </View>
          <View style={estilos.filaInst}>
            <Text style={estilos.lblInst}>Cédula/RIF:</Text>
            <Text style={estilos.valInst}>V-31.385.211</Text>
          </View>
          <View style={estilos.filaInst}>
            <Text style={estilos.lblInst}>Teléfono:</Text>
            <Text style={estilos.valInst}>0414-1914478</Text>
          </View>
          <Text
            style={{
              color: isDark ? colores.textoGris : "#888",
              fontStyle: "italic",
              marginTop: 10,
              fontSize: 14,
            }}
          >
            Completa los datos de tu pago móvil abajo.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.label}>Teléfono Emisor</Text>
            <TextInput
              style={estilos.input}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              placeholder="0414..."
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.label}>Fecha del Pago</Text>
            <TextInput
              style={estilos.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
            />
          </View>
        </View>

        <Text style={estilos.label}>Banco Emisor</Text>
        <TextInput
          style={estilos.input}
          value={banco}
          onChangeText={setBanco}
          placeholder="Ej: Banesco, Mercantil..."
          placeholderTextColor={isDark ? colores.textoGris : "#888"}
        />

        <Text style={estilos.label}>Número de Referencia</Text>
        <TextInput
          style={estilos.input}
          value={referencia}
          onChangeText={setReferencia}
          keyboardType="numeric"
          placeholder="Últimos 4-8 dígitos"
          placeholderTextColor={isDark ? colores.textoGris : "#888"}
        />

        <TouchableOpacity style={estilos.btnFoto} onPress={seleccionarImagen}>
          {imagen ? (
            <Image
              source={{ uri: imagen }}
              style={{ width: "100%", height: "100%", borderRadius: 10 }}
            />
          ) : (
            <View style={{ alignItems: "center" }}>
              <FontAwesome5
                name="camera"
                size={30}
                color={isDark ? colores.textoGris : "#888"}
                style={{ marginBottom: 10 }}
              />
              <Text style={{ color: isDark ? colores.textoGris : "#888" }}>
                Adjuntar Comprobante de Pago
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.btnEnviar}
          onPress={enviarPago}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text
              style={{ fontWeight: "bold", fontSize: 16, color: "#1A1A1A" }}
            >
              Enviar Pago
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          style={{ alignItems: "center", marginTop: 25 }}
        >
          <Text
            style={{ color: COLOR_VERDE, fontWeight: "bold", fontSize: 15 }}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const crearEstilos = (c: any, isDark: boolean) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: isDark ? c.fondoOscuro : "#F8F9FA",
    },
    scroll: {
      padding: 25,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 40,
    },

    tituloPrincipal: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      color: COLOR_VERDE,
      marginTop: 10,
    },
    subtitulo: {
      fontSize: 16,
      textAlign: "center",
      color: isDark ? c.textoGris : "#888",
      marginTop: 5,
      paddingHorizontal: 10,
      lineHeight: 22,
    },

    tarjetaInstrucciones: {
      backgroundColor: isDark ? c.fondoTarjeta : "#FFFFFF",
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? c.borde : "#E5E7EB",
      marginVertical: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    filaInst: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    lblInst: { color: isDark ? c.textoGris : "#888", fontSize: 15 },
    valInst: {
      color: isDark ? c.textoBlanco : "#333",
      fontWeight: "bold",
      fontSize: 15,
    },

    label: {
      fontSize: 14,
      fontWeight: "bold",
      color: isDark ? c.textoGris : "#888",
      marginBottom: 8,
      marginTop: 15,
    },
    input: {
      borderWidth: 1.5,
      borderColor: COLOR_VERDE,
      borderRadius: 12,
      padding: 15,
      backgroundColor: isDark ? c.fondoInput : "#FFFFFF",
      color: isDark ? c.textoBlanco : "#333",
      fontSize: 16,
    },

    btnFoto: {
      height: 160,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: isDark ? c.borde : "#E5E7EB",
      borderRadius: 12,
      marginVertical: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? c.fondoInput : "#F3F4F6",
    },
    btnEnviar: {
      backgroundColor: COLOR_VERDE,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
    },

    tituloValidacion: {
      fontSize: 28,
      fontWeight: "bold",
      color: COLOR_VERDE,
      marginTop: 20,
      textAlign: "center",
    },
    subtituloValidacion: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 10,
      color: isDark ? c.textoBlanco : "#333",
      paddingHorizontal: 20,
    },
    textoInfo: {
      fontSize: 16,
      textAlign: "center",
      color: isDark ? c.textoGris : "#888",
      marginTop: 20,
      paddingHorizontal: 20,
      lineHeight: 24,
    },
    cajaTiempo: {
      borderWidth: 1.5,
      borderColor: COLOR_VERDE,
      borderRadius: 12,
      padding: 20,
      marginTop: 30,
      backgroundColor: isDark ? c.fondoTarjeta : "#FFFFFF",
    },
    textoTiempo: {
      fontWeight: "bold",
      fontSize: 15,
      textAlign: "center",
      color: COLOR_VERDE,
    },
  });
