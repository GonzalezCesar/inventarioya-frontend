import { useTheme } from "../../contexts/ContextTheme";
import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

interface Categoria {
  id: string;
  nombre: string;
}

interface Proveedor {
  id: string;
  nombre: string;
}

export default function PantallaAgregarProducto() {
  const router = useRouter();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);

  // Estados para Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [desplegableCategoria, setDesplegableCategoria] = useState(false);
  const [modalNuevaCatVisible, setModalNuevaCatVisible] = useState(false);
  const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  // 🔥 Estados para Proveedores
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<Proveedor | null>(null);
  const [desplegableProveedor, setDesplegableProveedor] = useState(false);
  const [modalNuevoProvVisible, setModalNuevoProvVisible] = useState(false);
  const [nuevoNombreProveedor, setNuevoNombreProveedor] = useState("");
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  useEffect(() => {
    cargarCategorias();
    cargarProveedores();

    const suscripcion = DeviceEventEmitter.addListener(
      "onCodigoEscaneado",
      (codigo) => {
        setCodigoBarras(codigo);
      },
    );

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

  const cargarProveedores = async () => {
    try {
      const res: any = await api.get("/proveedores");
      setProveedores(res || []);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const guardarNuevaCategoria = async () => {
    if (!nuevoNombreCategoria.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la categoría");
      return;
    }
    setCreandoCategoria(true);
    try {
      const res: any = await api.post("/categorias", {
        nombre: nuevoNombreCategoria.trim(),
      });

      await cargarCategorias();
      const catCreada = res.categoria || res;

      setCategoriaSeleccionada({
        id: catCreada.id || res.id,
        nombre: catCreada.nombre || nuevoNombreCategoria.trim(),
      });

      setModalNuevaCatVisible(false);
      setDesplegableCategoria(false);
      setNuevoNombreCategoria("");
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || error.message || "";
      if (error.response?.status === 403) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo crear la categoría");
      }
    } finally {
      setCreandoCategoria(false);
    }
  };

  const guardarNuevoProveedor = async () => {
    if (!nuevoNombreProveedor.trim()) {
      Alert.alert("Error", "Ingresa un nombre para el proveedor");
      return;
    }
    setCreandoProveedor(true);
    try {
      // El backend devuelve { mensaje: '...', success: true, id: '...' }
      const res: any = await api.post("/proveedores", {
        nombre: nuevoNombreProveedor.trim(),
      });

      await cargarProveedores();

      setProveedorSeleccionado({
        id: res.id,
        nombre: nuevoNombreProveedor.trim(),
      });

      setModalNuevoProvVisible(false);
      setDesplegableProveedor(false);
      setNuevoNombreProveedor("");
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || error.message || "";
      if (error.response?.status === 403) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo crear el proveedor");
      }
    } finally {
      setCreandoProveedor(false);
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
        proveedor_id: proveedorSeleccionado?.id || null, // 🔥 Ahora enviamos el ID del proveedor
        imagen: imagen,
        categoria_id: categoriaSeleccionada?.id || null,
      };

      await api.post("/productos", nuevoProducto);
      Alert.alert("Éxito", "Producto agregado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const mensajeBackend = error.response?.data?.error || error.message || "";
      if (error.response?.status === 403) {
        Alert.alert("Límite de Plan Alcanzado", mensajeBackend);
      } else {
        Alert.alert("Error", mensajeBackend || "No se pudo guardar el producto");
      }
    } finally {
      setCargando(false);
    }
  };

  const calcularMargen = () => {
    const c = parseFloat(costo.toString().replace(",", ".")) || 0;
    const p = parseFloat(precio.toString().replace(",", ".")) || 0;
    if (c === 0) return "0%";
    return `${(((p - c) / c) * 100).toFixed(1)}%`;
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
        <Text style={estilos.titulo}>Agregar Producto</Text>
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
              <FontAwesome5 name="camera" size={32} color={colores.textoGris} />
              <Text style={estilos.imagenTexto}>Tocar para agregar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* INFORMACIÓN BÁSICA */}
        <Text style={estilos.seccionTitulo}>INFORMACIÓN BÁSICA</Text>

        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del producto"
          placeholderTextColor={colores.textoGris}
        />

        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          placeholder="Código SKU"
          placeholderTextColor={colores.textoGris}
          autoCapitalize="characters"
        />

        <Text style={estilos.label}>Descripción</Text>
        <TextInput
          style={[estilos.input, estilos.inputMultilinea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción del producto"
          placeholderTextColor={colores.textoGris}
          multiline
        />

        {/* ACORDEÓN DE CATEGORÍAS */}
        <Text style={estilos.label}>Categoría</Text>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={[
              estilos.input,
              estilos.selectorCategoria,
              desplegableCategoria && estilos.selectorActivo,
            ]}
            onPress={() => {
              setDesplegableCategoria(!desplegableCategoria);
              setDesplegableProveedor(false); // Cierra el otro si está abierto
            }}
            activeOpacity={1}
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
              name={desplegableCategoria ? "chevron-up" : "chevron-down"}
              size={14}
              color={colores.textoGris}
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
                      name="check"
                      size={16}
                      color={colores.primario}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.botonRapidoCrear}
                  onPress={() => {
                    setDesplegableCategoria(false);
                    setModalNuevaCatVisible(true);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesome5
                      name="plus"
                      size={14}
                      color={colores.primario}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={estilos.textoBotonRapido}>
                      Crear Categoría
                    </Text>
                  </View>
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
                        name="check"
                        size={16}
                        color={colores.primario}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
              placeholderTextColor={colores.textoGris}
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
              placeholderTextColor={colores.textoGris}
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
              placeholderTextColor={colores.textoGris}
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
              placeholderTextColor={colores.textoGris}
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
            placeholderTextColor={colores.textoGris}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={estilos.botonEscanear}
            onPress={() => router.push("/productos/escaner")}
          >
            <FontAwesome5
              name="barcode"
              size={24}
              color={colores.textoOscuro}
            />
          </TouchableOpacity>
        </View>

        {/* 🔥 ACORDEÓN DE PROVEEDORES */}
        <Text style={estilos.label}>Proveedor</Text>
        <View style={{ zIndex: 9 }}>
          <TouchableOpacity
            style={[
              estilos.input,
              estilos.selectorCategoria,
              desplegableProveedor && estilos.selectorActivo,
            ]}
            onPress={() => {
              setDesplegableProveedor(!desplegableProveedor);
              setDesplegableCategoria(false); // Cierra el otro si está abierto
            }}
            activeOpacity={1}
          >
            <Text
              style={{
                color: proveedorSeleccionado
                  ? colores.textoBlanco
                  : colores.textoGris,
                fontSize: 16,
              }}
            >
              {proveedorSeleccionado
                ? proveedorSeleccionado.nombre
                : "Sin Proveedor"}
            </Text>
            <FontAwesome5
              name={desplegableProveedor ? "chevron-up" : "chevron-down"}
              size={14}
              color={colores.textoGris}
            />
          </TouchableOpacity>

          {desplegableProveedor && (
            <View style={estilos.desplegableContenedor}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                <TouchableOpacity
                  style={[
                    estilos.itemCategoria,
                    !proveedorSeleccionado && estilos.itemCategoriaActiva,
                  ]}
                  onPress={() => {
                    setProveedorSeleccionado(null);
                    setDesplegableProveedor(false);
                  }}
                >
                  <Text style={estilos.textoCategoria}>Sin Proveedor</Text>
                  {!proveedorSeleccionado && (
                    <FontAwesome5
                      name="check"
                      size={16}
                      color={colores.primario}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.botonRapidoCrear}
                  onPress={() => {
                    setDesplegableProveedor(false);
                    setModalNuevoProvVisible(true);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesome5
                      name="plus"
                      size={14}
                      color={colores.primario}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={estilos.textoBotonRapido}>
                      Crear Proveedor
                    </Text>
                  </View>
                </TouchableOpacity>

                {proveedores.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      estilos.itemCategoria,
                      proveedorSeleccionado?.id === item.id &&
                        estilos.itemCategoriaActiva,
                    ]}
                    onPress={() => {
                      setProveedorSeleccionado(item);
                      setDesplegableProveedor(false);
                    }}
                  >
                    <Text style={estilos.textoCategoria}>{item.nombre}</Text>
                    {proveedorSeleccionado?.id === item.id && (
                      <FontAwesome5
                        name="check"
                        size={16}
                        color={colores.primario}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={estilos.footer}>
        <TouchableOpacity
          style={[estilos.botonGuardar, cargando && { opacity: 0.7 }]}
          onPress={guardarProducto}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colores.textoOscuro} />
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
                  color={colores.textoGris}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Nombre de Categoría</Text>
            <TextInput
              style={estilos.inputModal}
              placeholder="Ej: Snacks, Bebidas..."
              placeholderTextColor={colores.textoGris}
              value={nuevoNombreCategoria}
              onChangeText={setNuevoNombreCategoria}
              autoFocus
            />

            <TouchableOpacity
              style={[
                estilos.botonGuardar,
                { marginTop: 15 },
                creandoCategoria && { opacity: 0.7 },
              ]}
              onPress={guardarNuevaCategoria}
              disabled={creandoCategoria}
            >
              {creandoCategoria ? (
                <ActivityIndicator color={colores.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonGuardar}>
                  Crear y Seleccionar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🔥 MODAL CREACIÓN RÁPIDA DE PROVEEDOR */}
      <Modal
        visible={modalNuevoProvVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalNuevoProvVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalOverlay}
        >
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>Nuevo Proveedor</Text>
              <TouchableOpacity onPress={() => setModalNuevoProvVisible(false)}>
                <FontAwesome5
                  name="times"
                  size={20}
                  color={colores.textoGris}
                />
              </TouchableOpacity>
            </View>

            <Text style={estilos.label}>Nombre del Proveedor</Text>
            <TextInput
              style={estilos.inputModal}
              placeholder="Ej: Distribuidora Polar, Coca Cola..."
              placeholderTextColor={colores.textoGris}
              value={nuevoNombreProveedor}
              onChangeText={setNuevoNombreProveedor}
              autoFocus
            />

            <TouchableOpacity
              style={[
                estilos.botonGuardar,
                { marginTop: 15 },
                creandoProveedor && { opacity: 0.7 },
              ]}
              onPress={guardarNuevoProveedor}
              disabled={creandoProveedor}
            >
              {creandoProveedor ? (
                <ActivityIndicator color={colores.textoOscuro} />
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

// --- ESTILOS DINÁMICOS ---
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
    botonVolver: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },
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
    imagenTexto: { color: c.textoGris, fontSize: 16, marginTop: 10 },
    seccionTitulo: {
      color: c.subtitulos,
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 10,
      marginBottom: 5,
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
    inputMultilinea: { minHeight: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", gap: 15 },
    inputGroup: { flex: 1 },
    selectorCategoria: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    selectorActivo: {
      borderColor: c.primario,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    desplegableContenedor: {
      backgroundColor: c.fondoTarjeta,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: c.primario,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      overflow: "hidden",
    },
    itemCategoria: {
      padding: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemCategoriaActiva: { backgroundColor: "rgba(212, 255, 0, 0.05)" },
    textoCategoria: { color: c.textoBlanco, fontSize: 16 },
    botonRapidoCrear: {
      padding: 15,
      backgroundColor: "rgba(212, 255, 0, 0.1)",
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      justifyContent: "center",
      alignItems: "center",
    },
    textoBotonRapido: { color: c.primario, fontWeight: "bold", fontSize: 16 },
    margenContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? c.primario : "#D4FF4E",
      padding: 16,
      borderRadius: 12,
      marginTop: 15,
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
    botonEscanear: {
      backgroundColor: c.primario,
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
      backgroundColor: c.fondoOscuro,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
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
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: c.fondoTarjeta,
      borderRadius: 20,
      padding: 25,
      borderWidth: 1,
      borderColor: c.borde,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    modalTitulo: { color: c.textoBlanco, fontSize: 20, fontWeight: "bold" },
    inputModal: {
      backgroundColor: c.fondoOscuro,
      borderRadius: 12,
      padding: 16,
      color: c.textoBlanco,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.borde,
      marginTop: 5,
    },
  });
