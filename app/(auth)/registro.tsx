import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import api from "../../services/api";

// --- TEMA BASADO EN TUS CAPTURAS ---
const COLORES = {
  fondoOscuro: "#121212",
  fondoTarjeta: "#1E1E1E",
  fondoInput: "#1C1C1E",
  fondoModal: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoGrisClaro: "#EBEBF5",
  textoOscuro: "#121212",
  error: "#FF3B30",
  exito: "#34C759",
  borde: "#2C2C2E",
};

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

      setTimeout(() => {
        setModalVisible(false);
        router.replace("/(auth)/login");
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.container}
    >
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.headerIconos}>
          <View style={estilos.themeToggleMock}>
            <View style={estilos.themeToggleKnob}>
              <FontAwesome5 name="moon" size={12} color="#000" />
            </View>
          </View>
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
                style={estilos.input}
                placeholder="Ej: Inversiones El Éxito"
                placeholderTextColor={COLORES.textoGris}
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
                style={estilos.input}
                placeholder="Juan Pérez"
                placeholderTextColor={COLORES.textoGris}
                value={nombreCompleto}
                onChangeText={setNombreCompleto}
                autoFocus
              />

              <Text style={estilos.label}>Número de teléfono</Text>
              <View style={estilos.inputTelefonoContainer}>
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
                    color={COLORES.textoGris}
                    style={{ marginLeft: 5 }}
                  />
                </TouchableOpacity>
                <TextInput
                  style={estilos.inputTelefono}
                  placeholder="412 000 0000"
                  placeholderTextColor={COLORES.textoGris}
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
                  <Text style={{ fontWeight: "bold" }}>Fase Beta</Text>. Usa un
                  correo @betatester.com para continuar. (El correo de
                  betatester es falso y solo es con fines de que se pueda probar
                  la app y sus funcionalidades en este periodo).
                </Text>
              </View>

              <Text style={estilos.label}>Correo electrónico</Text>
              <TextInput
                style={estilos.input}
                placeholder="tu@betatester.com"
                placeholderTextColor={COLORES.textoGris}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={estilos.label}>Contraseña</Text>
              <TextInput
                style={estilos.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORES.textoGris}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={estilos.filaBotones}>
                <TouchableOpacity
                  onPress={retrocederPaso}
                  style={[estilos.botonAtras, { opacity: cargando ? 0.5 : 1 }]}
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
                    <ActivityIndicator color={COLORES.textoOscuro} />
                  ) : (
                    <Text style={estilos.textoBotonPrimario}>Crear Cuenta</Text>
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
                  color={COLORES.textoGris}
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
                    ? COLORES.error
                    : COLORES.primario
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
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  scrollContent: { flexGrow: 1, padding: 20, alignItems: "center" },
  headerIconos: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 20,
  },
  themeToggleMock: {
    width: 50,
    height: 30,
    backgroundColor: "#2C2C2E",
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
  tituloPrincipal: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORES.primario,
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
    backgroundColor: COLORES.borde,
  },
  puntoPasoActivo: { backgroundColor: COLORES.primario },
  puntoPasoActual: { width: 25, borderRadius: 4 },
  tarjetaWizard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  tituloPaso: {
    color: COLORES.textoGrisClaro,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 26,
  },
  label: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORES.fondoInput,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORES.textoBlanco,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  inputTelefonoContainer: {
    flexDirection: "row",
    backgroundColor: COLORES.fondoInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 20,
    overflow: "hidden",
  },
  prefijoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: COLORES.borde,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  banderaTexto: { fontSize: 18, marginRight: 6 },
  textoPrefijo: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 15,
  },
  inputTelefono: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORES.textoBlanco,
  },
  avisoBeta: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  textoAvisoBeta: { color: COLORES.exito, fontSize: 14, lineHeight: 20 },
  filaBotones: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  botonAtras: {
    paddingVertical: 16,
    paddingRight: 25,
    paddingLeft: 10,
    justifyContent: "center",
  },
  textoBotonAtras: {
    color: COLORES.textoGris,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotonPrimario: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
  linkLogin: { marginTop: 30, padding: 10 },
  textoLinkLogin: { color: COLORES.primario, fontSize: 15, fontWeight: "bold" },
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
  },
  iconoModalContainer: { marginBottom: 20 },
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
  modalOverlayPaises: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContentPaises: {
    backgroundColor: COLORES.fondoTarjeta,
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
    borderBottomColor: COLORES.borde,
    marginBottom: 10,
  },
  modalTitle: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: "bold" },
  modalCloseBtn: { padding: 5 },
  itemPais: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  banderaPais: { fontSize: 24, marginRight: 15 },
  nombrePais: { flex: 1, fontSize: 16, color: COLORES.textoBlanco },
  codigoPais: { color: COLORES.textoGris, fontSize: 16, fontWeight: "bold" },
});
