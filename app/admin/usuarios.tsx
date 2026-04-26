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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean | number;
  last_activity?: string;
}

export default function PantallaGestionUsuarios() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );
  const insets = useSafeAreaInsets();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [idEditando, setIdEditando] = useState<string | null>(null);

  const betaActiva = user?.rol === "beta_tester";

  React.useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      // 🔥 Le pasamos el admin_id por la URL para que PHP nos devuelva toda la lista
      const res: any = await api.get(`/usuarios?admin_id=${user?.id}`);

      // Filtramos para asegurarnos de que el admin vea a sus vendedores y a sí mismo
      const vendedores = (res || []).filter(
        (u: Usuario) => u.rol.includes("vendedor") || u.id === user?.id,
      );
      setUsuarios(vendedores);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los vendedores.");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setNombre("");
    setEmail("");
    setContrasena("");
    setIdEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    setNombre(u.nombre);
    setEmail(u.email);
    setContrasena(""); // Reset
    setIdEditando(u.id);
    setModalVisible(true);
  };

  const manejarGuardar = async () => {
    if (!nombre.trim() || !email.trim()) {
      return Alert.alert("Error", "Nombre y correo son obligatorios.");
    }

    if (!idEditando && !contrasena.trim()) {
      return Alert.alert(
        "Error",
        "La contraseña es obligatoria para un usuario nuevo.",
      );
    }

    if (
      !idEditando &&
      betaActiva &&
      !email.toLowerCase().endsWith("@betatester.com")
    ) {
      return Alert.alert(
        "Fase Beta",
        'Durante la Fase Beta, todos los vendedores deben tener un correo terminado en "@betatester.com".',
      );
    }

    setGuardando(true);
    try {
      if (idEditando) {
        // ACTUALIZAR (PUT) - PHP exige que mandemos el ID dentro del payload
        const payload: any = { id: idEditando, nombre: nombre.trim() };
        if (contrasena.trim()) payload.contrasena = contrasena;

        await api.put(`/usuarios/${idEditando}`, payload);
        Alert.alert("Éxito", "Usuario actualizado correctamente.");
      } else {
        // CREAR (POST)
        const payload = {
          nombre: nombre.trim(),
          email: email.trim(),
          contrasena: contrasena,
          rol: betaActiva ? "vendedor_beta" : "vendedor",
        };
        await api.post("/usuarios", payload);
        Alert.alert("Éxito", "Vendedor creado correctamente.");
      }
      setModalVisible(false);
      cargarUsuarios();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo procesar la solicitud.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    if (u.id === user?.id) {
      return Alert.alert("Error", "No puedes desactivar tu propia cuenta.");
    }

    // PHP maneja 1 (true) y 0 (false)
    const nuevoEstado = u.activo === 1 || u.activo === true ? 0 : 1;

    try {
      // Pasamos el ID en el payload como pide tu controlador
      await api.put(`/usuarios/${u.id}`, { id: u.id, activo: nuevoEstado });
      cargarUsuarios(); // Recargamos para ver el cambio
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cambiar el estado del usuario.");
    }
  };

  const manejarEliminar = (id: string, nombreUsuario: string) => {
    if (id === user?.id) {
      return Alert.alert("Error", "No puedes eliminar tu propia cuenta.");
    }

    Alert.alert(
      "Eliminar Usuario",
      `¿Estás seguro que deseas eliminar permanentemente a ${nombreUsuario}? Se perderá el rastro de sus ventas. Si solo quieres que no inicie sesión, te recomendamos "Desactivarlo" usando el ícono del ojo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/usuarios/${id}`);
              cargarUsuarios();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el usuario.");
            }
          },
        },
      ],
    );
  };

  const renderRoles = (rol: string) => {
    let estiloBadge = estilos.badgeVendedor;
    let estiloTexto = estilos.textoVendedor;
    let etiqueta = rol.toUpperCase();

    if (rol.includes("admin") || rol === "beta_tester") {
      estiloBadge = estilos.badgeAdmin;
      estiloTexto = estilos.textoAdmin;
      etiqueta = rol === "beta_tester" ? "BETA TESTER" : "ADMIN";
    }

    return (
      <View style={[estilos.badgeRol, estiloBadge]}>
        <Text style={[estilos.textoRol, estiloTexto]}>{etiqueta}</Text>
      </View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      {/* ENCABEZADO */}
      <View style={estilos.encabezado}>
        <TouchableOpacity
          style={estilos.botonAtras}
          onPress={() => router.back()}
        >
          <FontAwesome5
            name="arrow-left"
            size={20}
            color={colores.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Vendedores</Text>
        <TouchableOpacity
          style={estilos.botonAgregar}
          onPress={abrirModalCrear}
        >
          <FontAwesome5 name="plus" size={16} color={colores.textoOscuro} />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      {cargando ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            estilos.lista,
            { paddingBottom: Math.max(insets.bottom, 40) },
          ]}
          renderItem={({ item }) => {
            const estaActivo = item.activo === 1 || item.activo === true;
            return (
              <View
                style={[
                  estilos.tarjetaUsuario,
                  !estaActivo && { opacity: 0.6 },
                ]}
              >
                <View style={estilos.infoUsuario}>
                  <View style={estilos.avatar}>
                    <Text style={estilos.iniciales}>
                      {item.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.nombreUsuario}>{item.nombre}</Text>
                    <Text style={estilos.emailUsuario}>{item.email}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                        gap: 8,
                      }}
                    >
                      {renderRoles(item.rol)}

                      <View
                        style={[
                          estilos.badgeEstado,
                          estaActivo
                            ? estilos.badgeActivo
                            : estilos.badgeInactivo,
                        ]}
                      >
                        <Text
                          style={[
                            estilos.textoEstado,
                            estaActivo
                              ? estilos.textoActivo
                              : estilos.textoInactivo,
                          ]}
                        >
                          {estaActivo ? "● ACTIVO" : "○ INACTIVO"}
                        </Text>
                      </View>

                      {item.id === user?.id && (
                        <Text style={estilos.tagTu}>(Tú)</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* ACCIONES */}
                <View style={estilos.accionesUsuario}>
                  <TouchableOpacity
                    style={estilos.botonAccion}
                    onPress={() => abrirModalEditar(item)}
                  >
                    <FontAwesome5
                      name="edit"
                      size={18}
                      color={colores.textoGris}
                    />
                  </TouchableOpacity>

                  {/* No permitir borrar ni desactivar al propio usuario logueado */}
                  {item.id !== user?.id && (
                    <>
                      <TouchableOpacity
                        style={estilos.botonAccion}
                        onPress={() => toggleActivo(item)}
                      >
                        <FontAwesome5
                          name={estaActivo ? "eye-slash" : "eye"}
                          size={18}
                          color={estaActivo ? "#FF9500" : colores.exito}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={estilos.botonAccion}
                        onPress={() => manejarEliminar(item.id, item.nombre)}
                      >
                        <FontAwesome5
                          name="trash-alt"
                          size={18}
                          color={colores.error}
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <FontAwesome5
                name="users"
                size={60}
                color={colores.textoGris}
                style={{ opacity: 0.5 }}
              />
              <Text style={{ color: colores.textoGris, marginTop: 20 }}>
                No hay vendedores registrados.
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL CREAR/EDITAR */}
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
              <Text style={estilos.modalTitulo}>
                {idEditando ? "Editar Vendedor" : "Nuevo Vendedor"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ padding: 5 }}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color={colores.textoGris}
                />
              </TouchableOpacity>
            </View>

            {betaActiva && !idEditando && (
              <View style={estilos.bannerBeta}>
                <FontAwesome5 name="flask" size={16} color={colores.primario} />
                <Text style={estilos.textoBeta}>
                  Fase Beta: El correo del vendedor{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    DEBE terminar en @betatester.com
                  </Text>{" "}
                  (Correo falso solo para pruebas).
                </Text>
              </View>
            )}

            <Text style={estilos.label}>Nombre Completo</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={colores.textoGris}
            />

            <Text style={estilos.label}>Correo Electrónico</Text>
            <TextInput
              style={[estilos.input, idEditando && { opacity: 0.5 }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Ej. usuario@betatester.com"
              placeholderTextColor={colores.textoGris}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!idEditando}
            />
            {idEditando && (
              <Text style={estilos.notaInput}>
                El correo electrónico no se puede modificar.
              </Text>
            )}

            <Text style={estilos.label}>
              {idEditando ? "Nueva Contraseña (Opcional)" : "Contraseña *"}
            </Text>
            <TextInput
              style={estilos.input}
              value={contrasena}
              onChangeText={setContrasena}
              placeholder={
                idEditando ? "Dejar en blanco para no cambiar" : "Ej. 123456"
              }
              placeholderTextColor={colores.textoGris}
              secureTextEntry
            />

            <TouchableOpacity
              style={[estilos.botonGuardar, guardando && { opacity: 0.7 }]}
              onPress={manejarGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color={colores.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --- ESTILOS DINÁMICOS ---
const crearEstilos = (c: any, isDark: boolean) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    encabezado: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      backgroundColor: c.fondoOscuro,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    botonAtras: { width: 40, height: 40, justifyContent: "center" },
    titulo: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    botonAgregar: {
      backgroundColor: c.primario,
      padding: 10,
      borderRadius: 10,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    lista: { padding: 20 },
    tarjetaUsuario: {
      backgroundColor: c.fondoTarjeta,
      borderRadius: 16,
      padding: 15,
      marginBottom: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: c.borde,
    },
    infoUsuario: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 15,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
    iniciales: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    nombreUsuario: { fontSize: 16, fontWeight: "bold", color: c.textoBlanco },
    emailUsuario: { fontSize: 13, color: c.textoGris, marginTop: 2 },
    badgeRol: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeAdmin: { backgroundColor: "rgba(255, 215, 0, 0.15)" },
    badgeVendedor: { backgroundColor: "rgba(76, 175, 80, 0.15)" },
    textoRol: { fontSize: 10, fontWeight: "bold" },
    textoAdmin: { color: "#FFD700" },
    textoVendedor: { color: "#4CAF50" },
    tagTu: { color: c.textoGris, fontSize: 11, fontStyle: "italic" },
    badgeEstado: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    badgeActivo: { backgroundColor: "rgba(76, 175, 80, 0.15)" },
    badgeInactivo: { backgroundColor: "rgba(244, 67, 54, 0.15)" },
    textoEstado: { fontSize: 9, fontWeight: "bold" },
    textoActivo: { color: "#4CAF50" },
    textoInactivo: { color: "#F44336" },
    accionesUsuario: { flexDirection: "row", gap: 5 },
    botonAccion: { padding: 10 },

    // Modal
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.8)",
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
      fontSize: 14,
      color: c.textoBlanco,
      marginTop: 15,
      marginBottom: 8,
      fontWeight: "500",
    },
    input: {
      backgroundColor: c.fondoOscuro,
      color: c.textoBlanco,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      fontSize: 16,
    },
    notaInput: { fontSize: 12, color: c.textoGris, marginTop: 5 },
    bannerBeta: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(212, 255, 0, 0.1)",
      padding: 15,
      borderRadius: 12,
      marginBottom: 15,
      gap: 15,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoBeta: { flex: 1, fontSize: 12, color: c.primario, lineHeight: 18 },
    botonGuardar: {
      backgroundColor: c.primario,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 25,
    },
    textoBotonGuardar: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
