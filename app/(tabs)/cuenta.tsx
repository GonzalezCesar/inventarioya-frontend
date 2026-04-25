import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";

export default function PantallaCuenta() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // --- CONEXIÓN AL TEMA GLOBAL ---
  const { colores, isDark, setModo } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  // --- ESTADOS DE CONFIGURACIÓN ---
  const [cobrarIVA, setCobrarIVA] = useState(false);
  const [tasaIVA, setTasaIVA] = useState(16);
  const [cobrarIGTF, setCobrarIGTF] = useState(false);
  const [tasaIGTF, setTasaIGTF] = useState(3);
  const [cargandoConfig, setCargandoConfig] = useState(false);

  // --- ESTADOS DEL MODAL DE CONTRASEÑA ---
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [cargandoPassword, setCargandoPassword] = useState(false);

  // --- FUNCIONES ---
  useFocusEffect(
    useCallback(() => {
      if (esAdmin()) {
        cargarConfiguracion();
      }
    }, []),
  );

  const cargarConfiguracion = async () => {
    try {
      setCargandoConfig(true);
      const res: any = await api.get("/configuracion");
      if (res) {
        setCobrarIVA(
          res.impuestos_habilitados === 1 || res.impuestos_habilitados === true,
        );
        setTasaIVA(res.tasa_iva ? parseFloat(res.tasa_iva) : 16);
        setCobrarIGTF(
          res.igtf_habilitado === 1 || res.igtf_habilitado === true,
        );
        setTasaIGTF(res.tasa_igtf ? parseFloat(res.tasa_igtf) : 3);
      }
    } catch (error) {
      console.log("No se pudo cargar la configuración o no existe aún.");
    } finally {
      setCargandoConfig(false);
    }
  };

  const guardarConfiguracion = async (tipo: "iva" | "igtf", valor: boolean) => {
    try {
      const payload = {
        impuestos_habilitados: tipo === "iva" ? valor : cobrarIVA,
        tasa_iva: tasaIVA,
        igtf_habilitado: tipo === "igtf" ? valor : cobrarIGTF,
        tasa_igtf: tasaIGTF,
      };
      await api.post("/configuracion", payload);

      if (tipo === "iva") setCobrarIVA(valor);
      if (tipo === "igtf") setCobrarIGTF(valor);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la configuración");
      if (tipo === "iva") setCobrarIVA(!valor);
      if (tipo === "igtf") setCobrarIGTF(!valor);
    }
  };

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
      await api.put(`/usuarios/${user?.id}`, {
        password_actual: passwordActual,
        password: passwordNueva,
      });
      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setModalVisible(false);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Error al cambiar la contraseña. Verifica tu contraseña actual.",
      );
    } finally {
      setCargandoPassword(false);
    }
  };

  const formatearFecha = (fechaString?: string) => {
    if (!fechaString) return "Desconocida";
    const fecha = new Date(fechaString);
    const opciones: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return fecha.toLocaleDateString("es-ES", opciones);
  };

  const opciones = [
    ...(esAdmin()
      ? [
          {
            titulo: "Gestionar Vendedores",
            icono: "users",
            onPress: () => router.push("/admin/usuarios"),
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
          "Versión 2.0.0\n\nSistema de gestión de inventario y ventas.\n\n© 2026",
          [{ text: "Aceptar" }],
        ),
    },
  ];

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* ENCABEZADO Y AVATAR */}
        <View style={estilos.encabezado}>
          <View style={estilos.avatar}>
            <Text style={estilos.iniciales}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <Text style={estilos.nombre}>{user?.nombre || "Usuario"}</Text>
          <Text style={estilos.email}>
            {user?.email || "correo@inventarioya.com"}
          </Text>

          <View style={estilos.badgeRol}>
            <FontAwesome5
              name={esAdmin() ? "star" : "shopping-cart"}
              size={12}
              color={colores.primario}
              solid={esAdmin()}
            />
            <Text style={estilos.textoRol}>
              {user?.rol
                ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
                : "Vendedor"}
            </Text>
          </View>
        </View>

        {/* INFORMACIÓN DE ESTADO */}
        <View style={estilos.tarjetaInfo}>
          <View style={estilos.filaInfo}>
            <Text style={estilos.etiquetaInfo}>Miembro desde</Text>
            <Text style={estilos.valorInfo}>
              {formatearFecha(user?.fecha_creacion || user?.created_at)}
            </Text>
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
                name={isDark ? "moon" : "sun"}
                size={18}
                color={colores.primario}
                solid={isDark}
              />
            </View>
            <Text style={estilos.tituloOpcionSwitch}>Modo Oscuro</Text>
            <Switch
              value={isDark}
              onValueChange={(val) => setModo(val ? "oscuro" : "claro")}
              trackColor={{ false: "#4A4A4C", true: colores.primario }}
              thumbColor={isDark ? colores.textoOscuro : colores.textoBlanco}
            />
          </View>
        </View>

        {/* CONFIGURACIÓN DE IMPUESTOS (Solo Admin) */}
        {esAdmin() && (
          <View style={estilos.seccionOpciones}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                marginLeft: 5,
              }}
            >
              <Text
                style={[
                  estilos.tituloSeccion,
                  { marginBottom: 0, marginLeft: 0 },
                ]}
              >
                Configuración de Impuestos
              </Text>
              {cargandoConfig && (
                <ActivityIndicator size="small" color={colores.primario} />
              )}
            </View>

            <View style={estilos.opcionSwitch}>
              <View style={estilos.iconoOpcion}>
                <FontAwesome5
                  name="file-invoice"
                  size={18}
                  color={colores.primario}
                />
              </View>
              <Text style={estilos.tituloOpcionSwitch}>
                Cobrar IVA ({tasaIVA}%)
              </Text>
              <Switch
                value={cobrarIVA}
                onValueChange={(val) => guardarConfiguracion("iva", val)}
                trackColor={{ false: "#4A4A4C", true: colores.primario }}
                thumbColor={
                  cobrarIVA ? colores.textoOscuro : colores.textoBlanco
                }
                disabled={cargandoConfig}
              />
            </View>

            <View style={estilos.opcionSwitch}>
              <View style={estilos.iconoOpcion}>
                <FontAwesome5
                  name="dollar-sign"
                  size={18}
                  color={colores.primario}
                />
              </View>
              <Text style={estilos.tituloOpcionSwitch}>
                Cobrar IGTF ({tasaIGTF}%)
              </Text>
              <Switch
                value={cobrarIGTF}
                onValueChange={(val) => guardarConfiguracion("igtf", val)}
                trackColor={{ false: "#4A4A4C", true: colores.primario }}
                thumbColor={
                  cobrarIGTF ? colores.textoOscuro : colores.textoBlanco
                }
                disabled={cargandoConfig}
              />
            </View>

            <View style={estilos.contendorDisclaimer}>
              <FontAwesome5
                name="exclamation-triangle"
                size={14}
                color={colores.advertencia}
                style={{ marginTop: 2 }}
              />
              <Text style={estilos.textoDisclaimer}>
                El cálculo de impuestos en esta aplicación es exclusivamente
                para fines de control interno y estimación de costos. Esta
                aplicación NO sustituye las obligaciones legales de facturación
                fiscal ante el SENIAT.
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
                    opcion.destacado ? colores.primario : colores.textoBlanco
                  }
                />
              </View>
              <Text
                style={[
                  estilos.tituloOpcion,
                  opcion.destacado && {
                    color: colores.primario,
                    fontWeight: "bold",
                  },
                ]}
              >
                {opcion.titulo}
              </Text>
              <FontAwesome5
                name="chevron-right"
                size={14}
                color={colores.textoGris}
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
                  color={colores.textoGris}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Contraseña Actual</Text>
            <TextInput
              style={estilos.input}
              value={passwordActual}
              onChangeText={setPasswordActual}
              secureTextEntry
              placeholderTextColor={colores.textoGris}
            />

            <Text style={estilos.label}>Nueva Contraseña</Text>
            <TextInput
              style={estilos.input}
              value={passwordNueva}
              onChangeText={setPasswordNueva}
              secureTextEntry
              placeholderTextColor={colores.textoGris}
            />

            <Text style={estilos.label}>Confirmar Nueva Contraseña</Text>
            <TextInput
              style={estilos.input}
              value={passwordConfirmar}
              onChangeText={setPasswordConfirmar}
              secureTextEntry
              placeholderTextColor={colores.textoGris}
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
                <ActivityIndicator color={colores.textoOscuro} />
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

// --- ESTILOS DINÁMICOS ---
const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    scrollContent: { padding: 20, paddingTop: 60 },
    encabezado: { alignItems: "center", marginBottom: 30 },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.primario,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    iniciales: { fontSize: 40, fontWeight: "bold", color: c.textoOscuro },
    nombre: {
      fontSize: 22,
      fontWeight: "bold",
      color: c.textoBlanco,
      marginBottom: 5,
    },
    email: { fontSize: 15, color: c.textoGris, marginBottom: 15 },
    badgeRol: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoRol: {
      fontSize: 13,
      fontWeight: "bold",
      color: c.primario,
      marginLeft: 8,
    },
    tarjetaInfo: {
      backgroundColor: c.fondoTarjeta,
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
    etiquetaInfo: { fontSize: 15, color: c.textoGris },
    valorInfo: { fontSize: 15, fontWeight: "bold", color: c.textoBlanco },
    divisor: { height: 1, backgroundColor: c.borde, marginVertical: 8 },
    badgeActivo: {
      backgroundColor: c.exito,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    textoActivo: { fontSize: 13, fontWeight: "bold", color: c.textoBlanco },
    seccionOpciones: { marginBottom: 30 },
    tituloSeccion: {
      fontSize: 15,
      fontWeight: "bold",
      color: c.textoGris,
      marginBottom: 12,
      marginLeft: 5,
    },
    opcion: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
    },
    opcionSwitch: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 12,
      paddingLeft: 16,
      borderRadius: 16,
      marginBottom: 10,
    },
    iconoOpcion: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.fondoOscuro,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    tituloOpcion: { flex: 1, fontSize: 16, color: c.textoBlanco },
    tituloOpcionSwitch: { flex: 1, fontSize: 16, color: c.textoBlanco },
    contendorDisclaimer: {
      flexDirection: "row",
      backgroundColor: c.fondoTarjeta,
      padding: 15,
      borderRadius: 12,
      marginTop: 5,
      borderWidth: 1,
      borderColor: "rgba(255, 214, 10, 0.3)",
    },
    textoDisclaimer: {
      flex: 1,
      fontSize: 12,
      color: c.textoGris,
      lineHeight: 16,
      fontStyle: "italic",
      marginLeft: 10,
    },
    botonCerrarSesion: {
      backgroundColor: c.error,
      padding: 16,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    textoBotonCerrar: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    modalContent: {
      backgroundColor: c.fondoTarjeta,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      padding: 25,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitulo: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    label: {
      color: c.textoGris,
      fontSize: 14,
      marginBottom: 5,
      marginTop: 15,
    },
    input: {
      backgroundColor: c.fondoOscuro,
      borderRadius: 10,
      padding: 15,
      color: c.textoBlanco,
      borderWidth: 1,
      borderColor: c.borde,
      fontSize: 16,
    },
    botonGuardar: {
      backgroundColor: c.primario,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 25,
    },
    textoBotonGuardar: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
