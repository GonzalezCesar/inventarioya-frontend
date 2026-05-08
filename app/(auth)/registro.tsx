import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import ToggleTema from "../../components/ToggleTema"; // 🔥 Volvemos a traer tu componente real
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Volvemos a traer el tema dinámico
import api from "../../services/api";

const COLOR_VERDE = "#8CC63F"; // El color de tu marca

export const LISTA_PAISES = [
  { nombre: "Venezuela", codigo: "+58", iso: "VE", bandera: "🇻🇪" },
  { nombre: "Colombia", codigo: "+57", iso: "CO", bandera: "🇨🇴" },
  { nombre: "España", codigo: "+34", iso: "ES", bandera: "🇪🇸" },
  { nombre: "México", codigo: "+52", iso: "MX", bandera: "🇲🇽" },
  { nombre: "Estados Unidos", codigo: "+1", iso: "US", bandera: "🇺🇸" },
  { nombre: "Argentina", codigo: "+54", iso: "AR", bandera: "🇦🇷" },
  { nombre: "Chile", codigo: "+56", iso: "CL", bandera: "🇨🇱" },
  { nombre: "Perú", codigo: "+51", iso: "PE", bandera: "🇵🇪" },
];

export default function PantallaRegistro() {
  const router = useRouter();
  const { signIn } = useAuth();

  // 🔥 Activamos la inteligencia del modo oscuro
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombrePersona, setNombrePersona] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [paisSeleccionado, setPaisSeleccionado] = useState(LISTA_PAISES[0]);
  const [modalPaisesVisible, setModalPaisesVisible] = useState(false);

  const avanzarPaso = () => {
    if (paso === 1 && !nombreNegocio.trim())
      return Alert.alert("Requerido", "Ingresa el nombre de tu negocio");
    if (paso === 2 && (!nombrePersona.trim() || !telefono.trim()))
      return Alert.alert("Requerido", "Completa tus datos de contacto");
    setPaso(paso + 1);
  };

  const manejarRegistro = async () => {
    if (!email.trim() || !email.includes("@"))
      return Alert.alert("Error", "Email inválido");
    if (contrasena.length < 6)
      return Alert.alert(
        "Error",
        "La contraseña debe tener al menos 6 caracteres",
      );

    setCargando(true);
    const telefonoCompleto = `${paisSeleccionado.codigo} ${telefono.trim()}`;
    const emailLimpio = email.trim().toLowerCase();

    try {
      await api.post("/auth/register", {
        nombre_negocio: nombreNegocio,
        nombre: nombrePersona,
        telefono: telefonoCompleto,
        email: emailLimpio,
        contrasena: contrasena,
      });

      // Auto-Login
      await signIn(emailLimpio, contrasena);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Error al crear la cuenta. Intenta de nuevo.",
      );
      setCargando(false);
    }
  };

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <View style={estilos.tarjeta}>
            <Text style={estilos.pregunta}>
              Primero, ¿cómo se llama tu negocio?
            </Text>
            <Text style={estilos.label}>Nombre del Negocio</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: Inversiones El Éxito"
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
              value={nombreNegocio}
              onChangeText={setNombreNegocio}
              autoFocus
            />
            <TouchableOpacity
              style={estilos.botonPrimario}
              onPress={avanzarPaso}
            >
              <Text style={estilos.textoBotonPrimario}>Continuar</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={estilos.tarjeta}>
            <Text style={estilos.pregunta}>
              Genial, ahora necesitamos tus datos de contacto
            </Text>

            <Text style={estilos.label}>Tu nombre completo</Text>
            <TextInput
              style={estilos.input}
              placeholder="Juan Pérez"
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
              value={nombrePersona}
              onChangeText={setNombrePersona}
              autoFocus
            />

            <Text style={estilos.label}>Número de teléfono</Text>
            <View style={estilos.inputTelefonoWrapper}>
              <TouchableOpacity
                style={estilos.selectorPais}
                onPress={() => setModalPaisesVisible(true)}
              >
                <Text style={{ fontSize: 16, marginRight: 5 }}>
                  {paisSeleccionado.bandera}
                </Text>
                <Text style={estilos.textoCodigoPais}>
                  {paisSeleccionado.codigo}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[estilos.input, { flex: 1, borderWidth: 0 }]}
                placeholder="412 000 0000"
                placeholderTextColor={isDark ? colores.textoGris : "#888"}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />
            </View>

            <View style={estilos.filaBotones}>
              <TouchableOpacity
                style={estilos.botonAtras}
                onPress={() => setPaso(1)}
              >
                <Text style={estilos.textoBotonAtras}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botonPrimario, { flex: 2, marginTop: 0 }]}
                onPress={avanzarPaso}
              >
                <Text style={estilos.textoBotonPrimario}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={estilos.tarjeta}>
            <Text style={estilos.pregunta}>
              Finalmente, crea tus credenciales de acceso
            </Text>

            <Text style={estilos.label}>Correo electrónico</Text>
            <TextInput
              style={estilos.input}
              placeholder="tu@email.com"
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <Text style={estilos.label}>Contraseña</Text>
            <TextInput
              style={estilos.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={isDark ? colores.textoGris : "#888"}
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
            />

            <View style={estilos.filaBotones}>
              <TouchableOpacity
                style={estilos.botonAtras}
                onPress={() => setPaso(2)}
                disabled={cargando}
              >
                <Text style={estilos.textoBotonAtras}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botonPrimario, { flex: 2, marginTop: 0 }]}
                onPress={manejarRegistro}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={estilos.textoBotonPrimario}>Crear Cuenta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      <ScrollView
        contentContainerStyle={estilos.scrollContenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 🔥 Componente real del tema */}
        <View style={estilos.headerActions}>
          <ToggleTema />
        </View>

        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Registro</Text>
          <View style={estilos.indicadorPasos}>
            {[1, 2, 3].map((p) => (
              <View
                key={p}
                style={[
                  estilos.puntoPaso,
                  paso >= p ? estilos.puntoActivo : estilos.puntoInactivo,
                  paso === p && estilos.puntoActual,
                ]}
              />
            ))}
          </View>
        </View>

        {renderPaso()}

        {paso === 1 && (
          <TouchableOpacity
            style={estilos.botonLogin}
            onPress={() => router.back()}
          >
            <Text style={estilos.textoBotonLogin}>
              Ya tengo cuenta, iniciar sesión
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL DE PAÍSES */}
      <Modal
        visible={modalPaisesVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalPaisesVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? colores.borde : "#E0E0E0",
                paddingBottom: 15,
              }}
            >
              <Text style={estilos.modalTitle}>Selecciona tu país</Text>
              <TouchableOpacity onPress={() => setModalPaisesVisible(false)}>
                <FontAwesome5
                  name="times"
                  size={20}
                  color={isDark ? colores.textoGris : "#888"}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LISTA_PAISES}
              keyExtractor={(item) => item.iso}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={estilos.itemPais}
                  onPress={() => {
                    setPaisSeleccionado(item);
                    setModalPaisesVisible(false);
                  }}
                >
                  <Text style={estilos.banderaPais}>{item.bandera}</Text>
                  <Text
                    style={{
                      color: isDark ? colores.textoBlanco : "#333",
                      flex: 1,
                      fontSize: 16,
                    }}
                  >
                    {item.nombre}
                  </Text>
                  <Text
                    style={{
                      color: isDark ? colores.textoGris : "#888",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {item.codigo}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 🔥 Estilos dinámicos inyectados con isDark y colores
const crearEstilos = (c: any, isDark: boolean) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: isDark ? c.fondoOscuro : "#F8F9FA",
    },
    scrollContenido: { flexGrow: 1, justifyContent: "center", padding: 25 },
    headerActions: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 30,
      right: 25,
      zIndex: 10,
    },

    encabezado: { alignItems: "center", marginBottom: 30 },
    titulo: {
      fontSize: 32,
      fontWeight: "900",
      color: COLOR_VERDE,
      marginBottom: 10,
    },

    indicadorPasos: { flexDirection: "row", gap: 8 },
    puntoPaso: { height: 8, borderRadius: 4 },
    puntoInactivo: { width: 8, backgroundColor: isDark ? c.borde : "#E0E0E0" },
    puntoActivo: { width: 8, backgroundColor: COLOR_VERDE },
    puntoActual: { width: 22, backgroundColor: COLOR_VERDE },

    tarjeta: {
      backgroundColor: isDark ? c.fondoTarjeta : "#FFFFFF",
      padding: 25,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: isDark ? 1 : 0,
      borderColor: c.borde,
    },
    pregunta: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? c.textoBlanco : "#888",
      marginBottom: 25,
      textAlign: "center",
    },

    label: {
      color: isDark ? c.textoGris : "#888",
      fontSize: 13,
      marginBottom: 8,
      marginTop: 15,
      fontWeight: "bold",
    },
    input: {
      backgroundColor: isDark ? c.fondoInput : "#FFFFFF",
      color: isDark ? c.textoBlanco : "#333",
      padding: 15,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: COLOR_VERDE,
      fontSize: 15,
    },

    inputTelefonoWrapper: {
      flexDirection: "row",
      backgroundColor: isDark ? c.fondoInput : "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: COLOR_VERDE,
      overflow: "hidden",
      alignItems: "center",
    },
    selectorPais: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 15,
      borderRightWidth: 1.5,
      borderRightColor: COLOR_VERDE,
    },
    textoCodigoPais: {
      color: isDark ? c.textoBlanco : "#333",
      fontWeight: "bold",
      fontSize: 15,
    },

    filaBotones: {
      flexDirection: "row",
      gap: 15,
      marginTop: 30,
      alignItems: "center",
    },
    botonAtras: { flex: 1, justifyContent: "center", alignItems: "center" },
    textoBotonAtras: {
      color: isDark ? c.textoGris : "#888",
      fontWeight: "bold",
      fontSize: 15,
    },

    botonPrimario: {
      backgroundColor: COLOR_VERDE,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 25,
    },
    textoBotonPrimario: { color: "#1A1A1A", fontWeight: "bold", fontSize: 16 }, // Siempre negro para contraste con el verde

    botonLogin: { marginTop: 30, alignItems: "center" },
    textoBotonLogin: { color: COLOR_VERDE, fontWeight: "bold", fontSize: 15 },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDark ? c.fondoTarjeta : "#FFFFFF",
      borderRadius: 20,
      height: "60%",
      padding: 20,
    },
    modalTitle: {
      color: isDark ? c.textoBlanco : "#333",
      fontSize: 18,
      fontWeight: "bold",
    },
    itemPais: {
      flexDirection: "row",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? c.borde : "#E0E0E0",
      alignItems: "center",
    },
    banderaPais: { fontSize: 24, marginRight: 15 },
  });
