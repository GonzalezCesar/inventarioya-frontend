import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // 🔥 Recuperamos el degradado elegante
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import ToggleTema from "../../components/ToggleTema"; // 🔥 Tu botón animado
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Importamos el tema global
import api from "../../services/api";

export const LISTA_PAISES = [
  { nombre: "Venezuela", codigo: "+58", iso: "VE", bandera: "🇻🇪" },
  { nombre: "Colombia", codigo: "+57", iso: "CO", bandera: "🇨🇴" },
  { nombre: "España", codigo: "+34", iso: "ES", bandera: "🇪🇸" },
  { nombre: "México", codigo: "+52", iso: "MX", bandera: "🇲🇽" },
  { nombre: "Estados Unidos", codigo: "+1", iso: "US", bandera: "🇺🇸" },
  { nombre: "Argentina", codigo: "+54", iso: "AR", bandera: "🇦🇷" },
  { nombre: "Chile", codigo: "+56", iso: "CL", bandera: "🇨🇱" },
  { nombre: "Perú", codigo: "+51", iso: "PE", bandera: "🇵🇪" },
  { nombre: "Ecuador", codigo: "+593", iso: "EC", bandera: "🇪🇨" },
  { nombre: "Panamá", codigo: "+507", iso: "PA", bandera: "🇵🇦" },
  { nombre: "Rep. Dominicana", codigo: "+1809", iso: "DO", bandera: "🇩🇴" },
  { nombre: "Costa Rica", codigo: "+506", iso: "CR", bandera: "🇨🇷" },
  { nombre: "Guatemala", codigo: "+502", iso: "GT", bandera: "🇬🇹" },
  { nombre: "Honduras", codigo: "+504", iso: "HN", bandera: "🇭🇳" },
  { nombre: "Nicaragua", codigo: "+505", iso: "NI", bandera: "🇳🇮" },
  { nombre: "Uruguay", codigo: "+598", iso: "UY", bandera: "🇺🇾" },
  { nombre: "Bolivia", codigo: "+591", iso: "BO", bandera: "🇧🇴" },
  { nombre: "Paraguay", codigo: "+595", iso: "PY", bandera: "🇵🇾" },
  { nombre: "El Salvador", codigo: "+503", iso: "SV", bandera: "🇸🇻" },
];

export default function PantallaRegistro() {
  const router = useRouter();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // Estados del Wizard
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  // Estados del Formulario
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados para Países
  const [paisSeleccionado, setPaisSeleccionado] = useState(LISTA_PAISES[0]);
  const [modalPaisesVisible, setModalPaisesVisible] = useState(false);

  // Estados del Modal de Error/Éxito
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

  const avanzarPaso = () => {
    if (paso === 1 && !nombreNegocio.trim()) {
      mostrarAviso(
        "Error",
        "Por favor ingresa el nombre de tu negocio.",
        "error",
      );
      return;
    }
    if (paso === 2 && (!nombreCompleto.trim() || !telefono.trim())) {
      mostrarAviso(
        "Error",
        "Por favor completa tus datos de contacto.",
        "error",
      );
      return;
    }
    setPaso(paso + 1);
  };

  const retrocederPaso = () => {
    setPaso(paso - 1);
  };

  const manejarRegistro = async () => {
    if (!email.trim() || !password.trim()) {
      mostrarAviso("Error", "Por favor completa tus credenciales.", "error");
      return;
    }
    if (password.length < 6) {
      mostrarAviso(
        "Error",
        "La contraseña debe tener al menos 6 caracteres.",
        "error",
      );
      return;
    }

    setCargando(true);
    const telefonoCompleto = `${paisSeleccionado.codigo} ${telefono.trim()}`;

    try {
      await api.post("/auth/register", {
        nombre_negocio: nombreNegocio,
        nombre: nombreCompleto,
        telefono: telefonoCompleto,
        email: email,
        contrasena: password,
      });

      mostrarAviso(
        "¡Genial!",
        "Cuenta creada exitosamente. Ya puedes iniciar sesión.",
        "exito",
      );

      // 1. Esperamos 2 segundos para que el usuario lea el mensaje de éxito
      setTimeout(() => {
        setModalVisible(false); // 2. Ordenamos que el modal se empiece a cerrar
        
        // 3. Le damos 500ms al modal para que desaparezca completamente
        setTimeout(() => {
          router.replace("/login"); // 4. AHORA SÍ, navegamos seguros
        }, 500);

      }, 2000);
    } catch (error: any) {
      mostrarAviso(
        "Error",
        error.response?.data?.error ||
          "Hubo un problema al crear la cuenta. Verifica que el correo no esté en uso.",
        "error",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    // 🔥 Fondo con LinearGradient igual al Login
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
          {/* Header con botón Atrás y el ToggleTema */}
          <View style={estilos.headerIconos}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={estilos.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome5
                name="arrow-left"
                size={20}
                color={colores.textoBlanco}
              />
            </TouchableOpacity>
            <ToggleTema />
          </View>

          <Text style={estilos.tituloPrincipal}>Registro</Text>

          <View style={estilos.indicadorContainer}>
            {[1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  estilos.puntoPaso,
                  paso >= index && estilos.puntoPasoActivo,
                  paso === index && estilos.puntoPasoActual,
                ]}
              />
            ))}
          </View>

          <View style={estilos.tarjetaWizard}>
            {paso === 1 && (
              <View>
                <Text style={estilos.tituloPaso}>
                  Primero, ¿cómo se llama tu negocio?
                </Text>
                <Text style={estilos.label}>Nombre del Negocio</Text>
                <TextInput
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
                  placeholder="Ej: Inversiones El Éxito"
                  placeholderTextColor={colores.textoGris}
                  value={nombreNegocio}
                  onChangeText={setNombreNegocio}
                  autoFocus
                />
                <TouchableOpacity
                  style={estilos.botonPrimario}
                  onPress={avanzarPaso}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.textoBotonPrimario}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}

            {paso === 2 && (
              <View>
                <Text style={estilos.tituloPaso}>
                  Genial, ahora necesitamos tus datos de contacto
                </Text>
                <Text style={estilos.label}>Tu nombre completo</Text>
                <TextInput
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colores.textoGris}
                  value={nombreCompleto}
                  onChangeText={setNombreCompleto}
                  autoFocus
                />

                <Text style={estilos.label}>Número de teléfono</Text>
                <View
                  style={[
                    estilos.inputTelefonoContainer,
                    !isDark && { borderColor: colores.primario },
                  ]}
                >
                  <TouchableOpacity
                    style={estilos.prefijoContainer}
                    onPress={() => setModalPaisesVisible(true)}
                  >
                    <Text style={estilos.banderaTexto}>
                      {paisSeleccionado.bandera}
                    </Text>
                    <Text style={estilos.textoPrefijo}>
                      {paisSeleccionado.codigo}
                    </Text>
                    <FontAwesome5
                      name="chevron-down"
                      size={10}
                      color={colores.textoGris}
                      style={{ marginLeft: 5 }}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={estilos.inputTelefono}
                    placeholder="412 000 0000"
                    placeholderTextColor={colores.textoGris}
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                  />
                </View>

                <View style={estilos.filaBotones}>
                  <TouchableOpacity
                    onPress={retrocederPaso}
                    style={estilos.botonAtras}
                  >
                    <Text style={estilos.textoBotonAtras}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[estilos.botonPrimario, { flex: 1, marginTop: 0 }]}
                    onPress={avanzarPaso}
                    activeOpacity={0.8}
                  >
                    <Text style={estilos.textoBotonPrimario}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paso === 3 && (
              <View>
                <Text style={estilos.tituloPaso}>
                  Finalmente, crea tus credenciales de acceso
                </Text>
                <View style={estilos.avisoBeta}>
                  <Text style={estilos.textoAvisoBeta}>
                    La app está en{" "}
                    <Text style={{ fontWeight: "bold" }}>Fase Beta</Text>. Usa
                    un correo @betatester.com para continuar.
                  </Text>
                </View>

                <Text style={estilos.label}>Correo electrónico</Text>
                <TextInput
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
                  placeholder="tu@betatester.com"
                  placeholderTextColor={colores.textoGris}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={estilos.label}>Contraseña</Text>
                <TextInput
                  style={[
                    estilos.input,
                    !isDark && { borderColor: colores.primario },
                  ]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colores.textoGris}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <View style={estilos.filaBotones}>
                  <TouchableOpacity
                    onPress={retrocederPaso}
                    style={[
                      estilos.botonAtras,
                      { opacity: cargando ? 0.5 : 1 },
                    ]}
                    disabled={cargando}
                  >
                    <Text style={estilos.textoBotonAtras}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      estilos.botonPrimario,
                      { flex: 1, marginTop: 0 },
                      cargando && { opacity: 0.7 },
                    ]}
                    onPress={manejarRegistro}
                    disabled={cargando}
                    activeOpacity={0.8}
                  >
                    {cargando ? (
                      <ActivityIndicator color={colores.textoOscuro} />
                    ) : (
                      <Text style={estilos.textoBotonPrimario}>
                        Crear Cuenta
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {paso === 1 && (
            <TouchableOpacity
              style={estilos.linkLogin}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={estilos.textoLinkLogin}>
                Ya tengo cuenta, iniciar sesión
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* --- MODAL DE PAÍSES --- */}
        <Modal
          visible={modalPaisesVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalPaisesVisible(false)}
        >
          <View style={estilos.modalOverlayPaises}>
            <View style={estilos.modalContentPaises}>
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitle}>Selecciona tu país</Text>
                <TouchableOpacity
                  onPress={() => setModalPaisesVisible(false)}
                  style={estilos.modalCloseBtn}
                >
                  <FontAwesome5
                    name="times"
                    size={20}
                    color={colores.textoGris}
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
                    <Text style={estilos.nombrePais}>{item.nombre}</Text>
                    <Text style={estilos.codigoPais}>{item.codigo}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* --- MODAL DE ERROR/ÉXITO --- */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !cargando && setModalVisible(false)}
        >
          <View style={estilos.modalOverlay}>
            <View style={estilos.modalContentError}>
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
              {modalConfig.tipo === "error" && (
                <TouchableOpacity
                  style={estilos.botonModal}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.textoBotonModal}>Entendido</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 20, alignItems: "center" },
    headerIconos: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Platform.OS === "ios" ? 40 : 20,
      marginBottom: 20,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
    tituloPrincipal: {
      fontSize: 32,
      fontWeight: "bold",
      color: c.primario,
      marginBottom: 10,
    },
    indicadorContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 30,
      alignItems: "center",
    },
    puntoPaso: {
      width: 10,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.borde,
    },
    puntoPasoActivo: { backgroundColor: c.primario },
    puntoPasoActual: { width: 25, borderRadius: 4 },

    tarjetaWizard: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: c.fondoTarjeta,
      borderRadius: 20,
      padding: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    tituloPaso: {
      color: c.textoBlanco,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 26,
    },
    label: {
      color: c.textoBlanco,
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
    },
    input: {
      backgroundColor: c.fondoInput,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: c.textoBlanco,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.borde,
    },
    inputTelefonoContainer: {
      flexDirection: "row",
      backgroundColor: c.fondoInput,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 20,
      overflow: "hidden",
    },
    prefijoContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      borderRightWidth: 1,
      borderRightColor: c.borde,
      backgroundColor: "rgba(255,255,255,0.02)",
    },
    banderaTexto: { fontSize: 18, marginRight: 6 },
    textoPrefijo: { color: c.textoBlanco, fontWeight: "bold", fontSize: 15 },
    inputTelefono: { flex: 1, padding: 16, fontSize: 16, color: c.textoBlanco },

    avisoBeta: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(34, 197, 94, 0.3)",
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
    },
    textoAvisoBeta: { color: c.exito, fontSize: 14, lineHeight: 20 },

    filaBotones: { flexDirection: "row", alignItems: "center", marginTop: 10 },
    botonAtras: {
      paddingVertical: 16,
      paddingRight: 25,
      paddingLeft: 10,
      justifyContent: "center",
    },
    textoBotonAtras: { color: c.textoGris, fontSize: 16, fontWeight: "bold" },
    botonPrimario: {
      backgroundColor: c.primarioLogin,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
    },
    textoBotonPrimario: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },

    linkLogin: { marginTop: 30, padding: 10 },
    textoLinkLogin: { color: c.primario, fontSize: 15, fontWeight: "bold" },

    // --- Modales ---
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContentError: {
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
    iconoModalContainer: { marginBottom: 20 },
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
    textoBotonModal: { color: c.textoOscuro, fontSize: 16, fontWeight: "bold" },

    modalOverlayPaises: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "flex-end",
    },
    modalContentPaises: {
      backgroundColor: c.fondoTarjeta,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: "70%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      marginBottom: 10,
    },
    modalTitle: { color: c.textoBlanco, fontSize: 18, fontWeight: "bold" },
    modalCloseBtn: { padding: 5 },
    itemPais: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    banderaPais: { fontSize: 24, marginRight: 15 },
    nombrePais: { flex: 1, fontSize: 16, color: c.textoBlanco },
    codigoPais: { color: c.textoGris, fontSize: 16, fontWeight: "bold" },
  });
