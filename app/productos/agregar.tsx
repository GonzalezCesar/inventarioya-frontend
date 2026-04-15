import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
};

export default function PantallaAgregarProducto() {
  const router = useRouter();

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("5");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);

  // Funciones de Imagen
  const seleccionarImagen = async () => {
    Alert.alert("Imagen del Producto", "¿De dónde quieres obtener la imagen?", [
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
          if (!result.canceled && result.assets[0].base64)
            setImagen(`data:image/jpeg;base64,${result.assets[0].base64}`);
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso denegado", "Necesitamos acceso a la galería.");
            return;
          }
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

  // Guardar Producto
  const guardarProducto = async () => {
    if (!nombre.trim() || !precio) {
      Alert.alert("Error", "El nombre y el precio son obligatorios.");
      return;
    }

    setCargando(true);
    try {
      const nuevoProducto = {
        nombre,
        sku,
        descripcion,
        costo: parseFloat(costo) || 0,
        precio: parseFloat(precio) || 0,
        stock: parseInt(stock) || 0,
        stock_minimo: parseInt(stockMinimo) || 5,
        codigo_barras: codigoBarras,
        imagen_base64: imagen, // Tu backend procesará esto
      };

      // Simulación de guardado (Descomentaremos la API en el siguiente paso)
      await api.post("/productos", nuevoProducto);

      setTimeout(() => {
        Alert.alert("Éxito", "Producto agregado correctamente", [
          { text: "OK", onPress: () => router.back() },
        ]);
        setCargando(false);
      }, 1000);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar el producto");
      setCargando(false);
    }
  };
//   const guardarProducto = async () => {
//     if (!nombre.trim() || !precio) {
//       Alert.alert("Error", "El nombre y el precio son obligatorios.");
//       return;
//     }

//     setCargando(true);
//     try {
//       const nuevoProducto = {
//         nombre,
//         sku,
//         descripcion,
//         costo: parseFloat(costo) || 0,
//         precio: parseFloat(precio) || 0,
//         stock: parseInt(stock) || 0,
//         stock_minimo: parseInt(stockMinimo) || 5,
//         codigo_barras: codigoBarras,
//         imagen_base64: imagen, // Tu backend procesará esto
//       };

//       // Simulación de guardado (Descomentaremos la API en el siguiente paso)
//       await api.post("/productos", nuevoProducto);

//       setTimeout(() => {
//         Alert.alert("Éxito", "Producto agregado correctamente", [
//           { text: "OK", onPress: () => router.back() },
//         ]);
//         setCargando(false);
//       }, 1000);
//     } catch (error: any) {
//       Alert.alert("Error", error.message || "No se pudo guardar el producto");
//       setCargando(false);
//     }
//   };

  const calcularMargen = () => {
    const c = parseFloat(costo) || 0;
    const p = parseFloat(precio) || 0;
    if (c === 0) return "0%";
    return `${(((p - c) / c) * 100).toFixed(1)}%`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      {/* Encabezado */}
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
        <Text style={estilos.titulo}>Nuevo Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen del Producto */}
        <TouchableOpacity
          style={estilos.imagenContainer}
          onPress={seleccionarImagen}
        >
          {imagen ? (
            <Image source={{ uri: imagen }} style={estilos.imagen} />
          ) : (
            <View style={estilos.imagenPlaceholder}>
              <FontAwesome5 name="camera" size={40} color={COLORES.textoGris} />
              <Text style={estilos.imagenTexto}>Tocar para agregar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info Básica */}
        <Text style={estilos.seccionTitulo}>INFORMACIÓN BÁSICA</Text>
        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Coca Cola 2L"
          placeholderTextColor={COLORES.textoGris}
        />

        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          placeholder="Código interno (Ej. BEB-001)"
          placeholderTextColor={COLORES.textoGris}
          autoCapitalize="characters"
        />

        <Text style={estilos.label}>Descripción</Text>
        <TextInput
          style={[estilos.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Detalles del producto..."
          placeholderTextColor={COLORES.textoGris}
          multiline
        />

        {/* Precios */}
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
            <Text style={estilos.label}>Precio Venta ($) *</Text>
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

        {/* Inventario */}
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
              placeholder="5"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="numeric"
            />
          </View>
        </View>

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
            <FontAwesome5
              name="barcode"
              size={20}
              color={COLORES.textoOscuro}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Guardar */}
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
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  imagen: { width: "100%", height: "100%", resizeMode: "cover" },
  imagenPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagenTexto: { color: COLORES.textoGris, fontSize: 14, marginTop: 10 },

  seccionTitulo: {
    color: COLORES.primario,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
  label: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    padding: 15,
    color: COLORES.textoBlanco,
    fontSize: 16,
  },

  row: { flexDirection: "row", gap: 15 },
  inputGroup: { flex: 1 },

  margenContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(212, 255, 0, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "rgba(212, 255, 0, 0.3)",
  },
  margenLabel: { color: COLORES.textoBlanco, fontSize: 14 },
  margenValor: { color: COLORES.primario, fontSize: 20, fontWeight: "bold" },

  botonEscanear: {
    backgroundColor: COLORES.primario,
    width: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  footer: {
    padding: 20,
    backgroundColor: COLORES.fondoTarjeta,
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
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
});
