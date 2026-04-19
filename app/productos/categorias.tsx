import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import api from "../../services/api";

const COLORES = {
  fondoOscuro: "#121212",
  fondoTarjeta: "#1E1E1E",
  fondoInput: "#1C1C1E",
  fondoModal: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
};

interface Categoria {
  id: string;
  nombre: string;
  cantidad_productos?: number; // Asumiendo que tu API devuelve cuántos productos tiene
}

export default function PantallaCategorias() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, []),
  );

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const res: any = await api.get("/categorias");
      setCategorias(res || []);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    } finally {
      setCargando(false);
    }
  };

  const crearCategoria = async () => {
    if (!nombreCategoria.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la categoría");
      return;
    }

    setGuardando(true);
    try {
      await api.post("/categorias", { nombre: nombreCategoria.trim() });
      setModalVisible(false);
      setNombreCategoria("");
      cargarCategorias(); // Recargar la lista
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la categoría");
    } finally {
      setGuardando(false);
    }
  };

  // Botón flotante superior derecho como en tu captura
  const BotonAgregar = () => (
    <TouchableOpacity
      style={estilos.botonCircular}
      onPress={() => setModalVisible(true)}
      activeOpacity={0.8}
    >
      <FontAwesome5 name="plus" size={16} color={COLORES.textoOscuro} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      {/* HEADER */}
      <View style={estilos.encabezado}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => router.back()}
        >
          <FontAwesome5
            name="chevron-left"
            size={20}
            color={COLORES.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Categorías</Text>
        <BotonAgregar />
      </View>

      {/* CONTENIDO */}
      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => (
            <View style={estilos.tarjetaCategoria}>
              <Text style={estilos.nombreCategoria}>{item.nombre}</Text>
              <Text style={estilos.cantidadProductos}>
                {item.cantidad_productos || 0} prod.
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={estilos.centro}>
              <Text style={estilos.textoVacio}>
                No hay categorías registradas
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL NUEVA CATEGORÍA */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !guardando && setModalVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Nueva Categoría</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color={COLORES.textoBlanco}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Nombre</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: Electrónica"
              placeholderTextColor={COLORES.textoGris}
              value={nombreCategoria}
              onChangeText={setNombreCategoria}
              autoFocus
            />

            <TouchableOpacity
              style={[estilos.botonGuardar, guardando && { opacity: 0.7 }]}
              onPress={crearCategoria}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator color={COLORES.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>Crear Categoría</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
  },
  botonVolver: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titulo: { fontSize: 20, fontWeight: "bold", color: COLORES.textoBlanco },
  botonCircular: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORES.primario,
    justifyContent: "center",
    alignItems: "center",
  },

  lista: { padding: 20, flexGrow: 1 },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  textoVacio: { color: COLORES.textoGris, fontSize: 16 },

  tarjetaCategoria: {
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  nombreCategoria: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 5,
  },
  cantidadProductos: {
    fontSize: 14,
    color: COLORES.textoGris,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORES.fondoModal,
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: "bold" },
  label: { color: COLORES.textoGris, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: COLORES.fondoInput,
    borderRadius: 12,
    padding: 16,
    color: COLORES.textoBlanco,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 25,
  },
  botonGuardar: {
    backgroundColor: COLORES.primario,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  textoBotonGuardar: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
});
