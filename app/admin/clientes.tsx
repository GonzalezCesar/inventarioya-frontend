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

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cedula?: string;
  direccion?: string;
  activo: boolean | number;
}

export default function PantallaGestionClientes() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );
  const insets = useSafeAreaInsets();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [idEditando, setIdEditando] = useState<string | null>(null);

  React.useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const res: any = await api.get(`/clientes`);
      setClientes(res || []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los clientes.");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setNombre("");
    setEmail("");
    setTelefono("");
    setCedula("");
    setDireccion("");
    setIdEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (c: Cliente) => {
    setNombre(c.nombre);
    setEmail(c.email || "");
    setTelefono(c.telefono || "");
    setCedula(c.cedula || "");
    setDireccion(c.direccion || "");
    setIdEditando(c.id);
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
      cedula: cedula.trim(),
      direccion: direccion.trim(),
    };

    try {
      if (idEditando) {
        payload.id = idEditando;
        await api.put(`/clientes/${idEditando}`, payload);
        Alert.alert("Éxito", "Cliente actualizado correctamente.");
      } else {
        await api.post("/clientes", payload);
        Alert.alert("Éxito", "Cliente creado correctamente.");
      }
      setModalVisible(false);
      cargarClientes();
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || "";
      const esLimite = error.response?.status === 403;
      if (esLimite) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo procesar la solicitud.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = (id: string, nombreCliente: string) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro que deseas desactivar a ${nombreCliente}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/clientes/${id}`);
              cargarClientes();
            } catch (error) {
              Alert.alert("Error", "No se pudo desactivar el cliente.");
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
        <Text style={estilos.titulo}>Clientes</Text>
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
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            estilos.lista,
            { paddingBottom: Math.max(insets.bottom, 40) },
          ]}
          renderItem={({ item }) => (
            <View style={estilos.tarjetaUsuario}>
              <View style={estilos.infoUsuario}>
                <View style={estilos.avatar}>
                  <Text style={estilos.iniciales}>
                    {item.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nombreUsuario}>{item.nombre}</Text>
                  <Text style={estilos.emailUsuario}>
                    {item.cedula ? `C.I: ${item.cedula}` : "Sin cédula"}
                  </Text>
                  <Text style={estilos.emailUsuario}>
                    {item.telefono || "Sin teléfono"}
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
                name="address-book"
                size={60}
                color={colores.textoGris}
                style={{ opacity: 0.5 }}
              />
              <Text style={{ color: colores.textoGris, marginTop: 20 }}>
                No hay clientes registrados.
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
                {idEditando ? "Editar Cliente" : "Nuevo Cliente"}
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

            <Text style={estilos.label}>Nombre / Razón Social *</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={colores.textoGris}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.label}>Cédula / RIF</Text>
                <TextInput
                  style={estilos.input}
                  value={cedula}
                  onChangeText={setCedula}
                  placeholder="V-12345678"
                  placeholderTextColor={colores.textoGris}
                />
              </View>
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
            </View>

            <Text style={estilos.label}>Correo Electrónico</Text>
            <TextInput
              style={estilos.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Ej. cliente@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colores.textoGris}
            />

            <Text style={estilos.label}>Dirección</Text>
            <TextInput
              style={estilos.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej. Calle Principal..."
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
