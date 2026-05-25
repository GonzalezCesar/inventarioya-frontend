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

interface Proveedor {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
}

export default function PantallaGestionProveedores() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );
  const insets = useSafeAreaInsets();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [idEditando, setIdEditando] = useState<string | null>(null);

  React.useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const res: any = await api.get(`/proveedores`);
      setProveedores(res || []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los proveedores.");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setNombre("");
    setEmail("");
    setTelefono("");
    setDireccion("");
    setNotas("");
    setIdEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (p: Proveedor) => {
    setNombre(p.nombre);
    setEmail(p.email || "");
    setTelefono(p.telefono || "");
    setDireccion(p.direccion || "");
    setNotas(p.notas || "");
    setIdEditando(p.id);
    setModalVisible(true);
  };

  const manejarGuardar = async () => {
    if (!nombre.trim()) {
      return Alert.alert("Error", "El nombre es obligatorio.");
    }

    setGuardando(true);
    const payload: any = {
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      notas: notas.trim(),
    };

    try {
      if (idEditando) {
        payload.id = idEditando;
        await api.put(`/proveedores/${idEditando}`, payload);
        Alert.alert("Éxito", "Proveedor actualizado correctamente.");
      } else {
        await api.post("/proveedores", payload);
        Alert.alert("Éxito", "Proveedor creado correctamente.");
      }
      setModalVisible(false);
      cargarProveedores();
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || "";
      if (error.response?.status === 403) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo procesar la solicitud.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = (id: string, nombreProveedor: string) => {
    Alert.alert(
      "Eliminar Proveedor",
      `¿Estás seguro que deseas eliminar a ${nombreProveedor}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/proveedores/${id}`);
              cargarProveedores();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el proveedor.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={estilos.contenedor}>
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
        <Text style={estilos.titulo}>Proveedores</Text>
        <TouchableOpacity
          style={estilos.botonAgregar}
          onPress={abrirModalCrear}
        >
          <FontAwesome5 name="plus" size={16} color={colores.textoOscuro} />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      ) : (
        <FlatList
          data={proveedores}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            estilos.lista,
            { paddingBottom: Math.max(insets.bottom, 40) },
          ]}
          renderItem={({ item }) => (
            <View style={estilos.tarjetaUsuario}>
              <View style={estilos.infoUsuario}>
                <View
                  style={[
                    estilos.avatar,
                    { backgroundColor: "rgba(212, 255, 0, 0.1)" },
                  ]}
                >
                  <FontAwesome5
                    name="truck"
                    size={20}
                    color={colores.primario}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nombreUsuario}>{item.nombre}</Text>
                  <Text style={estilos.emailUsuario}>
                    {item.telefono || "Sin teléfono"}
                  </Text>
                  <Text style={estilos.emailUsuario} numberOfLines={1}>
                    {item.direccion || "Sin dirección"}
                  </Text>
                </View>
              </View>
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
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <FontAwesome5
                name="truck-loading"
                size={60}
                color={colores.textoGris}
                style={{ opacity: 0.5 }}
              />
              <Text style={{ color: colores.textoGris, marginTop: 20 }}>
                No hay proveedores registrados.
              </Text>
            </View>
          }
        />
      )}

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
                {idEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
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

            <Text style={estilos.label}>Nombre de la Empresa / Vendedor *</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Distribuidora Sur"
              placeholderTextColor={colores.textoGris}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.label}>Teléfono</Text>
                <TextInput
                  style={estilos.input}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="0414..."
                  keyboardType="phone-pad"
                  placeholderTextColor={colores.textoGris}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.label}>Correo Electrónico</Text>
                <TextInput
                  style={estilos.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colores.textoGris}
                />
              </View>
            </View>

            <Text style={estilos.label}>Dirección</Text>
            <TextInput
              style={estilos.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej. Zona Industrial..."
              placeholderTextColor={colores.textoGris}
            />

            <Text style={estilos.label}>Notas adicionales</Text>
            <TextInput
              style={[estilos.input, { height: 80 }]}
              value={notas}
              onChangeText={setNotas}
              multiline
              placeholder="Ej. Entregan los lunes..."
              placeholderTextColor={colores.textoGris}
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
    accionesUsuario: { flexDirection: "row", gap: 5 },
    botonAccion: { padding: 10 },
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
      marginBottom: 10,
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
