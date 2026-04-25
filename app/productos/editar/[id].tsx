import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ContextTheme";
import api from "../../../services/api";

// Asumiendo tu IP local para las fotos del servidor
const API_URL_UPLOADS = "http://192.168.1.111:8000/uploads/";

interface Categoria {
  id: string;
  nombre: string;
}

export default function PantallaEditarProducto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProducto, resCategorias]: any = await Promise.all([
          api.get(`/productos/${id}`),
          api.get("/categorias"),
        ]);

        setCategorias(resCategorias || []);
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
          // Lógica de URL para imagen existente
          setImagen(
            resProducto.imagen.startsWith("http")
              ? resProducto.imagen
              : `${API_URL_UPLOADS}${resProducto.imagen}`,
          );
        }

        if (resProducto.categoria_id && resCategorias) {
          const catEncontrada = resCategorias.find(
            (c: any) => String(c.id) === String(resProducto.categoria_id),
          );
          if (catEncontrada) setCategoriaSeleccionada(catEncontrada);
        }
      } catch (error: any) {
        Alert.alert("Error", "No se pudo cargar el producto.");
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

    return () => suscripcion.remove();
  }, [id]);

  const seleccionarImagen = async () => {
    Alert.alert("Imagen", "¿De dónde quieres obtener la imagen?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tomar Foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") return;
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

  const guardarCambios = async () => {
    if (!nombre.trim() || !precio) {
      Alert.alert("Error", "El nombre y precio son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      const payload: any = {
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
      Alert.alert("Éxito", "Producto actualizado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = () => {
    Alert.alert(
      "Eliminar Producto",
      "¿Seguro que deseas eliminarlo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setGuardando(true);
            try {
              await api.delete(`/productos/${id}`);
              router.back();
            } catch (e: any) {
              Alert.alert("Error", "No se pudo eliminar el producto.");
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
    return `${(((p - c) / c) * 100).toFixed(1)}%`;
  };

  if (cargandoInicial) {
    return (
      <View style={[estilos.contenedor, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colores.primario} />
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
            color={colores.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Editar Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGEN */}
        <TouchableOpacity
          style={estilos.imagenContainer}
          onPress={seleccionarImagen}
          activeOpacity={0.8}
        >
          {imagen ? (
            <Image
              source={{ uri: imagen }}
              style={estilos.imagen}
              key={imagen}
            />
          ) : (
            <View style={estilos.imagenPlaceholder}>
              <FontAwesome5 name="camera" size={32} color={colores.textoGris} />
              <Text style={estilos.imagenTexto}>Tocar para cambiar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={estilos.seccionTitulo}>INFORMACIÓN BÁSICA</Text>

        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={colores.textoGris}
        />

        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          placeholderTextColor={colores.textoGris}
          autoCapitalize="characters"
        />

        <Text style={estilos.label}>Descripción</Text>
        <TextInput
          style={[estilos.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholderTextColor={colores.textoGris}
          multiline
          numberOfLines={3}
        />

        <Text style={estilos.label}>Categoría</Text>
        <TouchableOpacity
          style={estilos.selector}
          onPress={() => setModalCategoriasVisible(true)}
        >
          <Text
            style={{
              color: categoriaSeleccionada
                ? colores.textoBlanco
                : colores.textoGris,
              fontSize: 16,
            }}
          >
            {categoriaSeleccionada
              ? categoriaSeleccionada.nombre
              : "Sin Categoría"}
          </Text>
          <FontAwesome5
            name="chevron-down"
            size={14}
            color={colores.textoGris}
          />
        </TouchableOpacity>

        <Text style={estilos.seccionTitulo}>PRECIOS</Text>
        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Costo ($)</Text>
            <TextInput
              style={estilos.input}
              value={costo}
              onChangeText={setCosto}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Precio ($) *</Text>
            <TextInput
              style={estilos.input}
              value={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={estilos.margenContainer}>
          <Text style={estilos.margenLabel}>Margen de ganancia:</Text>
          <Text style={estilos.margenValor}>{calcularMargen()}</Text>
        </View>

        <Text style={estilos.seccionTitulo}>INVENTARIO</Text>
        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Actual</Text>
            <View style={estilos.stockContainer}>
              <TextInput
                style={[estilos.input, estilos.inputDisabled]}
                value={stock}
                editable={false}
              />
              <TouchableOpacity
                style={estilos.botonAjustar}
                onPress={() =>
                  router.push({
                    pathname: "/productos/ajuste-stock",
                    params: { productoId: id },
                  })
                }
              >
                <FontAwesome5
                  name="edit"
                  size={14}
                  color={colores.textoOscuro}
                />
                <Text style={estilos.textoBotonAjustar}>Ajustar</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Mínimo</Text>
            <TextInput
              style={estilos.input}
              value={stockMinimo}
              onChangeText={setStockMinimo}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={estilos.seccionTitulo}>OTROS DATOS</Text>
        <Text style={estilos.label}>Código de Barras</Text>
        <View style={estilos.row}>
          <TextInput
            style={[estilos.input, { flex: 1 }]}
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={estilos.botonEscanear}
            onPress={() => router.push("/productos/escaner")}
          >
            <FontAwesome5
              name="barcode"
              size={20}
              color={colores.textoOscuro}
            />
          </TouchableOpacity>
        </View>

        <Text style={estilos.label}>Proveedor</Text>
        <TextInput
          style={estilos.input}
          value={proveedor}
          onChangeText={setProveedor}
          placeholderTextColor={colores.textoGris}
        />

        <TouchableOpacity
          style={estilos.botonEliminar}
          onPress={manejarEliminar}
        >
          <FontAwesome5 name="trash-alt" size={16} color={colores.error} />
          <Text style={estilos.textoEliminar}>Eliminar Producto</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View
        style={[estilos.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        <TouchableOpacity
          style={[estilos.botonGuardar, guardando && { opacity: 0.7 }]}
          onPress={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color={colores.textoOscuro} />
          ) : (
            <Text style={estilos.textoBotonGuardar}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL CATEGORIAS */}
      <Modal visible={modalCategoriasVisible} transparent animationType="slide">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Seleccionar Categoría</Text>
              <TouchableOpacity
                onPress={() => setModalCategoriasVisible(false)}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color={colores.textoGris}
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
                      color={colores.primario}
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
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any, isDark: boolean) =>
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
    },
    botonVolver: { width: 40, height: 40, justifyContent: "center" },
    titulo: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    contenido: { padding: 20 },

    imagenContainer: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: c.fondoTarjeta,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.borde,
    },
    imagen: { width: "100%", height: "100%", resizeMode: "cover" },
    imagenPlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    imagenTexto: { color: c.textoGris, fontSize: 14, marginTop: 10 },

    seccionTitulo: {
      color: c.primario,
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 25,
      marginBottom: 10,
      letterSpacing: 1,
    },
    label: { color: c.textoGris, fontSize: 14, marginBottom: 8, marginTop: 15 },
    input: {
      backgroundColor: c.fondoTarjeta,
      borderRadius: 12,
      padding: 16,
      color: c.textoBlanco,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.borde,
    },
    selector: {
      backgroundColor: c.fondoTarjeta,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
    },
    row: { flexDirection: "row", gap: 15 },
    inputGroup: { flex: 1 },

    margenContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? c.primario : "rgba(196, 255, 14, 0.2)",
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: c.primario,
    },
    margenLabel: {
      color: isDark ? c.textoOscuro : c.textoBlanco,
      fontSize: 16,
    },
    margenValor: {
      color: isDark ? c.textoOscuro : c.textoBlanco,
      fontSize: 20,
      fontWeight: "bold",
    },

    stockContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
    inputDisabled: { backgroundColor: c.secundario, opacity: 0.6, flex: 1 },
    botonAjustar: {
      backgroundColor: c.primario,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoBotonAjustar: {
      color: c.textoOscuro,
      fontWeight: "bold",
      fontSize: 13,
    },

    botonEscanear: {
      backgroundColor: c.primario,
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
      borderColor: c.error,
      borderRadius: 12,
      backgroundColor: "rgba(255, 59, 48, 0.05)",
    },
    textoEliminar: { color: c.error, fontSize: 16, fontWeight: "bold" },

    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      backgroundColor: c.fondoOscuro,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    botonGuardar: {
      backgroundColor: c.primario,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
    },
    textoBotonGuardar: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: c.fondoTarjeta,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: "70%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    modalTitulo: { fontSize: 18, fontWeight: "bold", color: c.textoBlanco },
    itemCategoria: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    textoCategoria: { fontSize: 16, color: c.textoBlanco },
  });
