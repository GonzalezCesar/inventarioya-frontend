import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import api from "../../../services/api";

const COLORES = {
  fondoOscuro: "#121212", // Negro profundo de la foto
  fondoTarjeta: "#1E1E1E", // Gris oscuro para inputs
  primario: "#D4FF00", // Verde Neón
  secundarioVerde: "#8FBF13", // Verde oliva de los títulos de sección
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  error: "#FF3B30",
};

// Asumiendo tu IP local para las fotos
const API_URL_UPLOADS = "http://192.168.1.111:8000/uploads/";

interface Categoria {
  id: string;
  nombre: string;
}

export default function PantallaEditarProducto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados del producto
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [imagenNuevaBase64, setImagenNuevaBase64] = useState<string | null>(
    null,
  );

  // Estados para Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [modalCategoriasVisible, setModalCategoriasVisible] = useState(false);

  // 1. Cargar datos del producto y categorías al abrir
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProducto, resCategorias]: any = await Promise.all([
          api.get(`/productos/${id}`),
          api.get("/categorias"),
        ]);

        // Poblar Categorías
        setCategorias(resCategorias || []);

        // Poblar Producto
        setNombre(resProducto.nombre || "");
        setSku(resProducto.sku || "");
        setDescripcion(resProducto.descripcion || "");
        setCosto(resProducto.costo?.toString() || "0");
        setPrecio(resProducto.precio?.toString() || "0");
        setStock(resProducto.stock?.toString() || "0");
        setStockMinimo(resProducto.stock_minimo?.toString() || "10");
        setCodigoBarras(resProducto.codigo_barras || "");
        setProveedor(resProducto.proveedor || "");

        if (resProducto.imagen) {
          setImagen(`${API_URL_UPLOADS}${resProducto.imagen}`);
        }

        // Buscar si el producto tenía una categoría y setearla
        if (resProducto.categoria_id && resCategorias) {
          const catEncontrada = resCategorias.find(
            (c: any) => String(c.id) === String(resProducto.categoria_id),
          );
          if (catEncontrada) setCategoriaSeleccionada(catEncontrada);
        }
      } catch (error: any) {
        Alert.alert(
          "Error",
          "No se pudo cargar el producto. Puede que haya sido eliminado.",
        );
        router.back();
      } finally {
        setCargandoInicial(false);
      }
    };

    if (id) cargarDatos();

    const suscripcion = DeviceEventEmitter.addListener(
      "onCodigoEscaneado",
      (codigo) => {
        setCodigoBarras(codigo);
      },
    );

    // Limpiamos la escucha cuando la pantalla se cierra
    return () => suscripcion.remove();
  }, [id]);

  // 2. Manejar Imagen
  const seleccionarImagen = async () => {
    Alert.alert("Imagen", "¿De dónde quieres obtener la imagen?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tomar Foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setImagen(result.assets[0].uri);
            setImagenNuevaBase64(
              `data:image/jpeg;base64,${result.assets[0].base64}`,
            );
          }
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setImagen(result.assets[0].uri);
            setImagenNuevaBase64(
              `data:image/jpeg;base64,${result.assets[0].base64}`,
            );
          }
        },
      },
    ]);
  };

  // 3. Guardar Cambios (Update)
  const guardarCambios = async () => {
    if (!nombre.trim() || !precio) {
      Alert.alert("Error", "El nombre y precio son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      const payload: any = {
        id: id,
        nombre: nombre.trim(),
        sku: sku.trim(),
        descripcion: descripcion.trim(),
        costo: parseFloat(costo.toString().replace(",", ".")) || 0,
        precio: parseFloat(precio.toString().replace(",", ".")) || 0,
        stock_minimo: parseInt(stockMinimo) || 10,
        codigo_barras: codigoBarras.trim(),
        proveedor: proveedor.trim(),
        categoria_id: categoriaSeleccionada?.id || null,
      };

      if (imagenNuevaBase64) {
        payload.imagen = imagenNuevaBase64;
      }

      await api.put(`/productos/${id}`, payload);

      Alert.alert("Éxito", "Producto actualizado", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  };

  // 4. Eliminar Producto
  const manejarEliminar = () => {
    Alert.alert(
      "Eliminar Producto",
      "¿Seguro que deseas eliminarlo? Esto no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setGuardando(true);
            try {
              await api.delete(`/productos/${id}`);
              Alert.alert("Eliminado", "Producto borrado.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert("Error", e.message || "No se pudo eliminar.");
              setGuardando(false);
            }
          },
        },
      ],
    );
  };

  const calcularMargen = () => {
    const c = parseFloat(costo.toString().replace(",", ".")) || 0;
    const p = parseFloat(precio.toString().replace(",", ".")) || 0;
    if (c === 0) return "0%";
    return `${(((p - c) / c) * 100).toFixed(0)}%`;
  };

  if (cargandoInicial) {
    return (
      <View style={[estilos.contenedor, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

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
            color={COLORES.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Editar Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGEN DEL PRODUCTO */}
        <TouchableOpacity
          style={estilos.imagenContainer}
          onPress={seleccionarImagen}
          activeOpacity={0.8}
        >
          {imagen ? (
            <Image source={{ uri: imagen }} style={estilos.imagen} />
          ) : (
            <View style={estilos.imagenPlaceholder}>
              <FontAwesome5 name="camera" size={32} color={COLORES.textoGris} />
              <Text style={estilos.imagenTexto}>Cambiar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* INFO BÁSICA */}
        <Text style={estilos.seccionTitulo}>INFORMACIÓN BÁSICA</Text>

        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del producto"
          placeholderTextColor={COLORES.textoGris}
        />

        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          placeholder="Código SKU"
          placeholderTextColor={COLORES.textoGris}
          autoCapitalize="characters"
        />

        <Text style={estilos.label}>Descripción</Text>
        <TextInput
          style={[estilos.input, { minHeight: 60, textAlignVertical: "top" }]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción del producto"
          placeholderTextColor={COLORES.textoGris}
          multiline
        />

        <Text style={estilos.label}>Categoría</Text>
        <TouchableOpacity
          style={[
            estilos.input,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
          onPress={() => setModalCategoriasVisible(true)}
        >
          <Text
            style={{
              color: categoriaSeleccionada
                ? COLORES.textoBlanco
                : COLORES.textoGris,
              fontSize: 16,
            }}
          >
            {categoriaSeleccionada
              ? categoriaSeleccionada.nombre
              : "Sin Categoría"}
          </Text>
        </TouchableOpacity>

        {/* PRECIOS */}
        <Text style={estilos.seccionTitulo}>PRECIOS</Text>
        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Costo ($)</Text>
            <TextInput
              style={estilos.input}
              value={costo}
              onChangeText={setCosto}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Precio ($) *</Text>
            <TextInput
              style={estilos.input}
              value={precio}
              onChangeText={setPrecio}
              placeholder="0.00"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={estilos.margenContainer}>
          <Text style={estilos.margenLabel}>Margen de ganancia:</Text>
          <Text style={estilos.margenValor}>{calcularMargen()}</Text>
        </View>

        {/* INVENTARIO */}
        <Text style={estilos.seccionTitulo}>INVENTARIO</Text>
        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Actual</Text>
            <TextInput
              style={[
                estilos.input,
                { backgroundColor: "#1A1A1A", opacity: 0.8 },
              ]}
              value={stock}
              editable={false} // El stock no se debe editar aquí, se edita en Ajuste de Stock
            />
          </View>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Mínimo</Text>
            <TextInput
              style={estilos.input}
              value={stockMinimo}
              onChangeText={setStockMinimo}
              placeholder="10"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* INFORMACIÓN ADICIONAL */}
        <Text style={estilos.seccionTitulo}>INFORMACIÓN ADICIONAL</Text>

        <Text style={estilos.label}>Código de Barras</Text>
        <View style={estilos.row}>
          <TextInput
            style={[estilos.input, { flex: 1 }]}
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            placeholder="Escanear o ingresar"
            placeholderTextColor={COLORES.textoGris}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={estilos.botonEscanear}
            onPress={() => router.push("/productos/escaner")}
          >
            <FontAwesome5 name="camera" size={20} color={COLORES.textoOscuro} />
          </TouchableOpacity>
        </View>

        <Text style={estilos.label}>Proveedor</Text>
        <TextInput
          style={estilos.input}
          value={proveedor}
          onChangeText={setProveedor}
          placeholder="Nombre del proveedor"
          placeholderTextColor={COLORES.textoGris}
        />

        <TouchableOpacity
          style={estilos.botonEliminar}
          onPress={manejarEliminar}
        >
          <FontAwesome5 name="trash" size={16} color={COLORES.error} />
          <Text style={estilos.textoEliminar}>Eliminar Producto</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FOOTER (Botón Guardar) */}
      <View style={estilos.footer}>
        <TouchableOpacity
          style={[estilos.botonGuardar, guardando && { opacity: 0.7 }]}
          onPress={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color={COLORES.textoOscuro} />
          ) : (
            <Text style={estilos.textoBotonGuardar}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- MODAL PARA SELECCIONAR CATEGORÍA --- */}
      <Modal
        visible={modalCategoriasVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Seleccionar Categoría</Text>
              <TouchableOpacity
                onPress={() => setModalCategoriasVisible(false)}
              >
                <FontAwesome5
                  name="times"
                  size={24}
                  color={COLORES.textoGris}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categorias}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={estilos.itemCategoria}
                  onPress={() => {
                    setCategoriaSeleccionada(item);
                    setModalCategoriasVisible(false);
                  }}
                >
                  <Text style={estilos.textoCategoria}>{item.nombre}</Text>
                  {categoriaSeleccionada?.id === item.id && (
                    <FontAwesome5
                      name="check"
                      size={16}
                      color={COLORES.primario}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <TouchableOpacity
                  style={estilos.itemCategoria}
                  onPress={() => {
                    setCategoriaSeleccionada(null);
                    setModalCategoriasVisible(false);
                  }}
                >
                  <Text style={estilos.textoCategoria}>
                    Sin Categoría (Ninguna)
                  </Text>
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <Text
                  style={{
                    color: COLORES.textoGris,
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  No hay categorías registradas.
                </Text>
              }
            />
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
  contenido: { padding: 20, paddingBottom: 40 },

  imagenContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  imagen: { width: "100%", height: "100%", resizeMode: "cover" },
  imagenPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagenTexto: { color: COLORES.textoGris, fontSize: 16, marginTop: 10 },

  seccionTitulo: {
    color: COLORES.secundarioVerde, // Verde apagado/oliva de tu foto
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 15,
    letterSpacing: 1,
  },
  label: {
    color: COLORES.textoGris,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 12,
    padding: 16,
    color: COLORES.textoBlanco,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  row: { flexDirection: "row", gap: 15 },
  inputGroup: { flex: 1 },

  margenContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORES.secundarioVerde, // Fondo sólido verde completo
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  margenLabel: { color: COLORES.textoBlanco, fontSize: 16 },
  margenValor: { color: COLORES.textoOscuro, fontSize: 20, fontWeight: "bold" },

  botonEscanear: {
    backgroundColor: COLORES.primario,
    width: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  botonEliminar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORES.error,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  textoEliminar: { color: COLORES.error, fontSize: 16, fontWeight: "bold" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORES.fondoOscuro, // Se funde con el fondo
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  botonGuardar: {
    backgroundColor: COLORES.primario,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  textoBotonGuardar: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal de Categorías
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORES.fondoOscuro,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  modalTitulo: { fontSize: 18, fontWeight: "bold", color: COLORES.textoBlanco },
  itemCategoria: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  textoCategoria: { fontSize: 16, color: COLORES.textoBlanco },
});
