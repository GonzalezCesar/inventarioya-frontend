import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  exito: "#34C759", // Verde para el badge de Activo
  peligro: "#FF3B30",
  borde: "#38383A",
  advertencia: "#FFD60A", // Amarillo para el aviso del SENIAT
};

export default function PantallaCuenta() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Estados de UI (Temporales hasta migrar los contextos)
  const [modoOscuro, setModoOscuro] = useState(true);
  const [cobrarIVA, setCobrarIVA] = useState(false);
  const [cobrarIGTF, setCobrarIGTF] = useState(false);

  // Estados del Modal de Contraseña
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [cargandoPassword, setCargandoPassword] = useState(false);

  const esAdmin = () => user?.rol === "admin" || user?.rol === "administrador";

  const manejarCerrarSesion = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => await signOut(),
      },
    ]);
  };

  const cambiarPassword = async () => {
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordNueva.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargandoPassword(true);
    try {
      await api.post("/auth/cambiar-password", {
        actual: passwordActual,
        nueva: passwordNueva,
      });
      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setModalVisible(false);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "La contraseña actual es incorrecta",
      );
    } finally {
      setCargandoPassword(false);
    }
  };

  const opciones = [
    ...(esAdmin()
      ? [
          {
            titulo: "Gestionar Vendedores",
            icono: "users",
            onPress: () => router.push("/(tabs)/usuarios"),
            destacado: true,
          },
        ]
      : []),
    ...(esAdmin()
      ? [
          {
            titulo: "Cambiar Contraseña",
            icono: "lock",
            onPress: () => setModalVisible(true),
          },
        ]
      : []),
    {
      titulo: "Acerca de",
      icono: "info-circle",
      onPress: () =>
        Alert.alert(
          "INVENTARIO YA",
          "Versión 1.0.0\n\nSistema de gestión de inventario y ventas.\n\n© 2026",
          [{ text: "Aceptar" }],
        ),
    },
  ];

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.scrollContent}
      >
        {/* ENCABEZADO Y AVATAR */}
        <View style={estilos.encabezado}>
          <View style={estilos.avatar}>
            <Text style={estilos.iniciales}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "A"}
            </Text>
          </View>
          <Text style={estilos.nombre}>
            {user?.nombre || "Administrador Principal"}
          </Text>
          <Text style={estilos.email}>
            {user?.email || "admin@inventarioya.com"}
          </Text>

          <View style={estilos.badgeRol}>
            <FontAwesome5
              name={esAdmin() ? "star" : "shopping-cart"}
              size={12}
              color={COLORES.primario}
              regular={!esAdmin()}
            />
            <Text style={estilos.textoRol}>
              {esAdmin() ? "Administrador" : "Vendedor"}
            </Text>
          </View>
        </View>

        {/* INFORMACIÓN DE ESTADO */}
        <View style={estilos.tarjetaInfo}>
          <View style={estilos.filaInfo}>
            <Text style={estilos.etiquetaInfo}>Miembro desde</Text>
            <Text style={estilos.valorInfo}>12 de abril de 2026</Text>
          </View>
          <View style={estilos.divisor} />
          <View style={estilos.filaInfo}>
            <Text style={estilos.etiquetaInfo}>Estado</Text>
            <View style={estilos.badgeActivo}>
              <Text style={estilos.textoActivo}>● Activo</Text>
            </View>
          </View>
        </View>

        {/* APARIENCIA */}
        <View style={estilos.seccionOpciones}>
          <Text style={estilos.tituloSeccion}>Apariencia</Text>
          <View style={estilos.opcionSwitch}>
            <View style={estilos.iconoOpcion}>
              <FontAwesome5
                name="moon"
                size={18}
                color={COLORES.primario}
                regular
              />
            </View>
            <Text style={estilos.tituloOpcionSwitch}>Modo Oscuro</Text>
            <Switch
              value={modoOscuro}
              onValueChange={setModoOscuro}
              trackColor={{ false: "#4A4A4C", true: COLORES.primario }}
              thumbColor={
                modoOscuro ? COLORES.textoOscuro : COLORES.textoBlanco
              }
            />
          </View>
        </View>

        {/* CONFIGURACIÓN DE IMPUESTOS (Solo Admin) */}
        {esAdmin() && (
          <View style={estilos.seccionOpciones}>
            <Text style={estilos.tituloSeccion}>
              Configuración de Impuestos
            </Text>

            <View style={estilos.opcionSwitch}>
              <View style={estilos.iconoOpcion}>
                <FontAwesome5
                  name="file-invoice"
                  size={18}
                  color={COLORES.primario}
                />
              </View>
              <Text style={estilos.tituloOpcionSwitch}>Cobrar IVA (16%)</Text>
              <Switch
                value={cobrarIVA}
                onValueChange={setCobrarIVA}
                trackColor={{ false: "#4A4A4C", true: COLORES.primario }}
                thumbColor={
                  cobrarIVA ? COLORES.textoOscuro : COLORES.textoBlanco
                }
              />
            </View>

            <View style={estilos.opcionSwitch}>
              <View style={estilos.iconoOpcion}>
                <FontAwesome5
                  name="dollar-sign"
                  size={18}
                  color={COLORES.primario}
                />
              </View>
              <Text style={estilos.tituloOpcionSwitch}>Cobrar IGTF (3%)</Text>
              <Switch
                value={cobrarIGTF}
                onValueChange={setCobrarIGTF}
                trackColor={{ false: "#4A4A4C", true: COLORES.primario }}
                thumbColor={
                  cobrarIGTF ? COLORES.textoOscuro : COLORES.textoBlanco
                }
              />
            </View>

            {/* Aviso SENIAT */}
            <View style={estilos.contendorDisclaimer}>
              <FontAwesome5
                name="exclamation-triangle"
                size={14}
                color={COLORES.advertencia}
                style={{ marginTop: 2 }}
              />
              <Text style={estilos.textoDisclaimer}>
                El cálculo de impuestos en esta aplicación es exclusivamente
                para fines de control interno y estimación de costos. Esta
                aplicación NO sustituye las obligaciones legales de facturación
                fiscal ante el SENIAT ni emite documentos con validez
                tributaria.
              </Text>
            </View>
          </View>
        )}

        {/* OPCIONES GENERALES */}
        <View style={estilos.seccionOpciones}>
          <Text style={estilos.tituloSeccion}>General</Text>
          {opciones.map((opcion, index) => (
            <TouchableOpacity
              key={index}
              style={estilos.opcion}
              onPress={opcion.onPress}
              activeOpacity={0.7}
            >
              <View style={estilos.iconoOpcion}>
                <FontAwesome5
                  name={opcion.icono}
                  size={16}
                  color={
                    opcion.destacado ? COLORES.primario : COLORES.textoBlanco
                  }
                />
              </View>
              <Text
                style={[
                  estilos.tituloOpcion,
                  opcion.destacado && {
                    color: COLORES.primario,
                    fontWeight: "bold",
                  },
                ]}
              >
                {opcion.titulo}
              </Text>
              <FontAwesome5
                name="chevron-right"
                size={14}
                color={COLORES.textoGris}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          style={estilos.botonCerrarSesion}
          onPress={manejarCerrarSesion}
          activeOpacity={0.8}
        >
          <Text style={estilos.textoBotonCerrar}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CONTRASEÑA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalContainer}
        >
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome5
                  name="times"
                  size={20}
                  color={COLORES.textoGris}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Contraseña Actual</Text>
            <TextInput
              style={estilos.input}
              value={passwordActual}
              onChangeText={setPasswordActual}
              secureTextEntry
              placeholderTextColor={COLORES.textoGris}
            />

            <Text style={estilos.label}>Nueva Contraseña</Text>
            <TextInput
              style={estilos.input}
              value={passwordNueva}
              onChangeText={setPasswordNueva}
              secureTextEntry
              placeholderTextColor={COLORES.textoGris}
            />

            <Text style={estilos.label}>Confirmar Nueva Contraseña</Text>
            <TextInput
              style={estilos.input}
              value={passwordConfirmar}
              onChangeText={setPasswordConfirmar}
              secureTextEntry
              placeholderTextColor={COLORES.textoGris}
            />

            <TouchableOpacity
              style={[
                estilos.botonGuardar,
                (!passwordActual || !passwordNueva || !passwordConfirmar) && {
                  opacity: 0.5,
                },
              ]}
              onPress={cambiarPassword}
              disabled={
                !passwordActual ||
                !passwordNueva ||
                !passwordConfirmar ||
                cargandoPassword
              }
            >
              {cargandoPassword ? (
                <ActivityIndicator color={COLORES.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  scrollContent: { padding: 20, paddingTop: 40, paddingBottom: 60 },
  encabezado: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORES.primario,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  iniciales: { fontSize: 40, fontWeight: "bold", color: COLORES.textoOscuro },
  nombre: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 5,
  },
  email: { fontSize: 15, color: COLORES.textoGris, marginBottom: 15 },
  badgeRol: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.primario,
  },
  textoRol: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORES.primario,
    marginLeft: 8,
  },

  tarjetaInfo: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  filaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  etiquetaInfo: { fontSize: 15, color: COLORES.textoGris },
  valorInfo: { fontSize: 15, fontWeight: "bold", color: COLORES.textoBlanco },
  divisor: { height: 1, backgroundColor: COLORES.borde, marginVertical: 8 },
  badgeActivo: {
    backgroundColor: COLORES.exito,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  textoActivo: { fontSize: 13, fontWeight: "bold", color: COLORES.textoOscuro },

  seccionOpciones: { marginBottom: 30 },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORES.textoGris,
    marginBottom: 12,
    marginLeft: 5,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  opcionSwitch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 12,
    paddingLeft: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  iconoOpcion: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORES.fondoOscuro,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  tituloOpcion: { flex: 1, fontSize: 16, color: COLORES.textoBlanco },
  tituloOpcionSwitch: { flex: 1, fontSize: 16, color: COLORES.textoBlanco },

  contendorDisclaimer: {
    flexDirection: "row",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.3)",
  },
  textoDisclaimer: {
    flex: 1,
    fontSize: 12,
    color: COLORES.textoGris,
    lineHeight: 16,
    fontStyle: "italic",
    marginLeft: 10,
  },

  botonCerrarSesion: {
    backgroundColor: COLORES.peligro,
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  textoBotonCerrar: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: COLORES.fondoTarjeta,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: "bold", color: COLORES.textoBlanco },
  label: {
    color: COLORES.textoGris,
    fontSize: 14,
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: COLORES.fondoOscuro,
    borderRadius: 10,
    padding: 15,
    color: COLORES.textoBlanco,
    borderWidth: 1,
    borderColor: COLORES.borde,
    fontSize: 16,
  },
  botonGuardar: {
    backgroundColor: COLORES.primario,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  textoBotonGuardar: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
});
