import { useTheme } from "../../contexts/ContextTheme";
import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import api from "../../services/api";

interface Categoria {
  id: string;
  nombre: string;
  total_productos?: number;
}

export default function PantallaCategorias() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 🔥 Conectamos al Tema Global
  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(
    null,
  );
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

  const abrirModal = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setNombreCategoria(categoria.nombre);
    } else {
      setCategoriaEditando(null);
      setNombreCategoria("");
    }
    setModalVisible(true);
  };

  const guardarCategoria = async () => {
    if (!nombreCategoria.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    setGuardando(true);
    try {
      if (categoriaEditando) {
        await api.put(`/categorias/${categoriaEditando.id}`, {
          nombre: nombreCategoria.trim(),
        });
      } else {
        await api.post("/categorias", { nombre: nombreCategoria.trim() });
      }
      setModalVisible(false);
      setNombreCategoria("");
      cargarCategorias();
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || error.message || "";
      if (error.response?.status === 403) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo guardar la categoría");
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (categoria: Categoria) => {
    const cantidad = categoria.total_productos || 0;
    if (cantidad > 0) {
      Alert.alert(
        "No se puede eliminar",
        `Hay ${cantidad} producto(s) usando esta categoría.`,
      );
      return;
    }
    Alert.alert(
      "Eliminar Categoría",
      `¿Estás seguro de eliminar "${categoria.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setCargando(true);
              await api.delete(`/categorias/${categoria.id}`);
              cargarCategorias();
            } catch (error: any) {
              Alert.alert("Error", "No se pudo eliminar la categoría");
              setCargando(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      <View style={estilos.encabezado}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => router.back()}
        >
          <FontAwesome5
            name="chevron-left"
            size={20}
            color={colores.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Categorías</Text>
        <TouchableOpacity
          style={estilos.botonAgregar}
          onPress={() => abrirModal()}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="plus" size={16} color={colores.textoOscuro} />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            estilos.lista,
            { paddingBottom: Math.max(insets.bottom, 40) },
          ]}
          numColumns={2}
          columnWrapperStyle={estilos.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={estilos.tarjetaCategoria}
              activeOpacity={0.7}
              onPress={() => abrirModal(item)}
              onLongPress={() => handleEliminar(item)}
            >
              <View style={estilos.cardContent}>
                <Text style={estilos.nombreCategoria} numberOfLines={2}>
                  {item.nombre}
                </Text>
                <Text style={estilos.cantidadProductos}>
                  {item.total_productos || 0} prod.
                </Text>
              </View>
              <View style={estilos.editIndicator}>
                <FontAwesome5 name="pen" size={10} color={colores.textoGris} />
              </View>
            </TouchableOpacity>
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

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !guardando && setModalVisible(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>
                {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color={colores.textoGris}
                />
              </TouchableOpacity>
            </View>
            <Text style={estilos.label}>Nombre</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: Electrónica"
              placeholderTextColor={colores.textoGris}
              value={nombreCategoria}
              onChangeText={setNombreCategoria}
              autoFocus
            />
            <TouchableOpacity
              style={[estilos.botonGuardar, guardando && { opacity: 0.7 }]}
              onPress={guardarCategoria}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator color={colores.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>
                  {categoriaEditando ? "Guardar Cambios" : "Crear Categoría"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    encabezado: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      marginBottom: 10,
    },
    botonVolver: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    titulo: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    botonAgregar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primario,
      justifyContent: "center",
      alignItems: "center",
    },
    lista: { paddingHorizontal: 20, paddingTop: 10, flexGrow: 1 },
    columnWrapper: { justifyContent: "space-between", gap: 15 },
    centro: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    textoVacio: { color: c.textoGris, fontSize: 16 },
    tarjetaCategoria: {
      flex: 1,
      backgroundColor: c.fondoTarjeta,
      borderRadius: 16,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: c.borde,
      minHeight: 100,
      justifyContent: "center",
      position: "relative",
    },
    cardContent: { alignItems: "center", justifyContent: "center", gap: 4 },
    nombreCategoria: {
      fontSize: 16,
      fontWeight: "bold",
      color: c.textoBlanco,
      textAlign: "center",
    },
    cantidadProductos: { fontSize: 12, color: c.textoGris },
    editIndicator: { position: "absolute", top: 10, right: 10, opacity: 0.5 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: c.fondoTarjeta,
      borderRadius: 20,
      padding: 25,
      width: "100%",
      maxWidth: 340,
      borderWidth: 1,
      borderColor: c.borde,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitulo: { color: c.textoBlanco, fontSize: 20, fontWeight: "bold" },
    label: { color: c.textoGris, fontSize: 14, marginBottom: 8 },
    input: {
      backgroundColor: c.fondoOscuro,
      borderRadius: 12,
      padding: 16,
      color: c.textoBlanco,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 25,
    },
    botonGuardar: {
      backgroundColor: c.primario,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    textoBotonGuardar: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
