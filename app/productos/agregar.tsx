import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import api from "../../services/api";
import { DeviceEventEmitter } from "react-native";

const COLORES = {
  fondoOscuro: "#121212",
  fondoTarjeta: "#1E1E1E",
  primario: "#D4FF00",
  secundarioVerde: "#8FBF13",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  error: "#FF3B30",
};

interface Categoria {
  id: string;
  nombre: string;
}

export default function PantallaAgregarProducto() {
  const router = useRouter();

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);

  // Estados para Categorías (Desplegable y Creación Rápida)
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [desplegableCategoria, setDesplegableCategoria] = useState(false);

  // Modal chiquito para escribir la nueva categoría
  const [modalNuevaCatVisible, setModalNuevaCatVisible] = useState(false);
  const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  useEffect(() => {
    cargarCategorias();

    const suscripcion = DeviceEventEmitter.addListener("onCodigoEscaneado", (codigo) => {
      setCodigoBarras(codigo);
    });

    // Limpiamos la escucha cuando la pantalla se cierra
    return () => suscripcion.remove();
  }, []);

  const cargarCategorias = async () => {
    try {
      const res: any = await api.get("/categorias");
      setCategorias(res || []);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // Función para crear categoría en el momento
  const guardarNuevaCategoria = async () => {
    if (!nuevoNombreCategoria.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la categoría");
      return;
    }
    setCreandoCategoria(true);
    try {
      // Creamos la categoría en el backend
      const res: any = await api.post("/categorias", {
        nombre: nuevoNombreCategoria.trim(),
      });

      // Recargamos la lista para que aparezca
      await cargarCategorias();

      // Asumimos que la API devuelve la categoría creada (ajusta según tu backend)
      // Si no la devuelve completa, al menos tenemos el nombre para seleccionarla visualmente
      const catCreada = res.categoria || res;

      setCategoriaSeleccionada({
        id: catCreada.id || res.id,
        nombre: catCreada.nombre || nuevoNombreCategoria.trim(),
      });

      setModalNuevaCatVisible(false);
      setDesplegableCategoria(false);
      setNuevoNombreCategoria("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la categoría");
    } finally {
      setCreandoCategoria(false);
    }
  };

  const seleccionarImagen = async () => {
    Alert.alert("Imagen", "¿De dónde quieres obtener la imagen?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tomar Foto",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") return Alert.alert("Permiso denegado");
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64)
            setImagen(`data:image/jpeg;base64,${result.assets[0].base64}`);
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") return Alert.alert("Permiso denegado");
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64)
            setImagen(`data:image/jpeg;base64,${result.assets[0].base64}`);
        },
      },
    ]);
  };

  const guardarProducto = async () => {
    if (!nombre.trim() || !precio) {
      Alert.alert("Error", "El nombre y el precio son obligatorios.");
      return;
    }

    const costoFinal = parseFloat(costo.toString().replace(",", ".")) || 0;
    const precioFinal = parseFloat(precio.toString().replace(",", ".")) || 0;

    setCargando(true);
    try {
      const nuevoProducto = {
        nombre,
        sku,
        descripcion,
        costo: costoFinal,
        precio: precioFinal,
        stock: parseInt(stock) || 0,
        stock_minimo: parseInt(stockMinimo) || 10,
        codigo_barras: codigoBarras,
        proveedor: proveedor,
        imagen: imagen,
        categoria_id: categoriaSeleccionada?.id || null,
      };

      await api.post("/productos", nuevoProducto);
      Alert.alert("Éxito", "Producto agregado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar el producto");
    } finally {
      setCargando(false);
    }
  };

  const calcularMargen = () => {
    const c = parseFloat(costo.toString().replace(",", ".")) || 0;
    const p = parseFloat(precio.toString().replace(",", ".")) || 0;
    if (c === 0) return "0%";
    return `${(((p - c) / c) * 100).toFixed(0)}%`;
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
            color={COLORES.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Agregar Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={estilos.imagenTexto}>Tocar para agregar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={estilos.seccionTitulo}>INFORMACIÓN BÁSICA</Text>

        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={COLORES.textoGris}
        />

        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          placeholderTextColor={COLORES.textoGris}
          autoCapitalize="characters"
        />

        <Text style={estilos.label}>Descripción</Text>
        <TextInput
          style={[estilos.input, { minHeight: 60, textAlignVertical: "top" }]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholderTextColor={COLORES.textoGris}
          multiline
        />

        {/* --- ACORDEÓN DE CATEGORÍAS (Idéntico a tu foto) --- */}
        <Text style={estilos.label}>Categoría</Text>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={[
              estilos.input,
              estilos.selectorCategoria,
              desplegableCategoria && estilos.selectorActivo,
            ]}
            onPress={() => setDesplegableCategoria(!desplegableCategoria)}
            activeOpacity={1}
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
            <FontAwesome5
              name={desplegableCategoria ? "chevron-up" : "chevron-down"}
              size={14}
              color={COLORES.textoGris}
            />
          </TouchableOpacity>

          {desplegableCategoria && (
            <View style={estilos.desplegableContenedor}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    estilos.itemCategoria,
                    !categoriaSeleccionada && estilos.itemCategoriaActiva,
                  ]}
                  onPress={() => {
                    setCategoriaSeleccionada(null);
                    setDesplegableCategoria(false);
                  }}
                >
                  <Text style={estilos.textoCategoria}>Sin Categoría</Text>
                  {!categoriaSeleccionada && (
                    <FontAwesome5
                      name="check-circle"
                      size={16}
                      color={COLORES.primario}
                      regular
                    />
                  )}
                </TouchableOpacity>

                {categorias.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      estilos.itemCategoria,
                      categoriaSeleccionada?.id === item.id &&
                        estilos.itemCategoriaActiva,
                    ]}
                    onPress={() => {
                      setCategoriaSeleccionada(item);
                      setDesplegableCategoria(false);
                    }}
                  >
                    <Text style={estilos.textoCategoria}>{item.nombre}</Text>
                    {categoriaSeleccionada?.id === item.id && (
                      <FontAwesome5
                        name="check-circle"
                        size={16}
                        color={COLORES.primario}
                        regular
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={estilos.botonRapidoCrear}
                onPress={() => {
                  setDesplegableCategoria(false);
                  setModalNuevaCatVisible(true);
                }}
              >
                <FontAwesome5
                  name="plus"
                  size={14}
                  color={COLORES.primario}
                  style={{ marginRight: 8 }}
                />
                <Text style={estilos.textoBotonRapido}>Crear Categoría</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* PRECIOS */}
        <Text style={estilos.seccionTitulo}>PRECIOS</Text>
        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Costo</Text>
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
            <Text style={estilos.label}>Precio</Text>
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
            <Text style={estilos.label}>Stock Inicial</Text>
            <TextInput
              style={estilos.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="numeric"
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

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={estilos.footer}>
        <TouchableOpacity
          style={[estilos.botonGuardar, cargando && { opacity: 0.7 }]}
          onPress={guardarProducto}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={COLORES.textoOscuro} />
          ) : (
            <Text style={estilos.textoBotonGuardar}>Guardar Producto</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL CREACIÓN RÁPIDA DE CATEGORÍA */}
      <Modal
        visible={modalNuevaCatVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalNuevaCatVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalOverlay}
        >
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Nueva Categoría</Text>
              <TouchableOpacity onPress={() => setModalNuevaCatVisible(false)}>
                <FontAwesome5
                  name="times"
                  size={20}
                  color={COLORES.textoGris}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Nombre</Text>
            <TextInput
              style={estilos.inputModal}
              placeholder="Ej: Snacks, Bebidas..."
              placeholderTextColor={COLORES.textoGris}
              value={nuevoNombreCategoria}
              onChangeText={setNuevoNombreCategoria}
              autoFocus
            />

            <TouchableOpacity
              style={[
                estilos.botonGuardar,
                creandoCategoria && { opacity: 0.7 },
              ]}
              onPress={guardarNuevaCategoria}
              disabled={creandoCategoria}
            >
              {creandoCategoria ? (
                <ActivityIndicator color={COLORES.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>
                  Crear y Seleccionar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    color: COLORES.secundarioVerde,
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

  // Estilos del Acordeón de Categorías
  selectorCategoria: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorActivo: {
    borderColor: COLORES.primario,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  desplegableContenedor: {
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORES.primario,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  itemCategoria: {
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCategoriaActiva: { backgroundColor: "rgba(212, 255, 0, 0.05)" },
  textoCategoria: { color: COLORES.textoBlanco, fontSize: 16 },
  botonRapidoCrear: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(212, 255, 0, 0.08)",
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 255, 0, 0.2)",
  },
  textoBotonRapido: {
    color: COLORES.primario,
    fontWeight: "bold",
    fontSize: 16,
  },

  margenContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORES.secundarioVerde,
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

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORES.fondoOscuro,
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

  // Modal Pequeño
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: "bold" },
  inputModal: {
    backgroundColor: COLORES.fondoOscuro,
    borderRadius: 12,
    padding: 16,
    color: COLORES.textoBlanco,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 25,
  },
});
