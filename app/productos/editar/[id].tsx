import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import api from "../../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
};

// Asumiendo tu IP local para las fotos
const API_URL_UPLOADS = "http://192.168.1.111:8000/uploads/";

export default function PantallaEditarProducto() {
  const router = useRouter();
  // MAGIA EXPO ROUTER: Extraemos el ID directamente de la URL
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
  const [stockMinimo, setStockMinimo] = useState("0");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [imagenNuevaBase64, setImagenNuevaBase64] = useState<string | null>(
    null,
  );

  // 1. Cargar datos del producto al abrir la pantalla
  useEffect(() => {
    const cargarProducto = async () => {
      try {
        const data: any = await api.get(`/productos/${id}`);
        setNombre(data.nombre || "");
        setSku(data.sku || "");
        setDescripcion(data.descripcion || "");
        setCosto(data.costo?.toString() || "0");
        setPrecio(data.precio?.toString() || "0");
        setStock(data.stock?.toString() || "0");
        setStockMinimo(data.stock_minimo?.toString() || "0");
        setCodigoBarras(data.codigo_barras || "");

        if (data.imagen) {
          setImagen(`${API_URL_UPLOADS}${data.imagen}`);
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
    if (id) cargarProducto();
  }, [id]);

  // 2. Manejar Imagen
  const seleccionarImagen = async () => {
    Alert.alert("Imagen", "¿De dónde quieres obtener la imagen?", [
      { text: "Cancelar", style: "cancel" },
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
            setImagen(result.assets[0].uri); // Para previsualizar
            setImagenNuevaBase64(
              `data:image/jpeg;base64,${result.assets[0].base64}`,
            ); // Para enviar a PHP
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
        stock_minimo: parseInt(stockMinimo) || 0,
        codigo_barras: codigoBarras.trim(),
      };

      if (imagenNuevaBase64) {
        payload.imagen = imagenNuevaBase64;
      }

      // PHP espera PUT o POST para actualizar? Como en tu controlador no vi PUT explícito, usualmente PHP con fetch() json usa PUT.
      // Asumiremos que tu enrutador php acepta PUT para update()
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

  // 4. Eliminar Producto (Destroy)
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

      <ScrollView contentContainerStyle={estilos.contenido}>
        <TouchableOpacity
          style={estilos.imagenContainer}
          onPress={seleccionarImagen}
        >
          {imagen ? (
            <Image source={{ uri: imagen }} style={estilos.imagen} />
          ) : (
            <View style={estilos.imagenPlaceholder}>
              <FontAwesome5 name="camera" size={40} color={COLORES.textoGris} />
              <Text style={estilos.imagenTexto}>Cambiar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={COLORES.textoGris}
        />

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

        <View style={estilos.row}>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Actual</Text>
            <TextInput
              style={[
                estilos.input,
                { backgroundColor: COLORES.secundario, opacity: 0.7 },
              ]}
              value={stock}
              editable={false}
            />
          </View>
          <View style={estilos.inputGroup}>
            <Text style={estilos.label}>Stock Mínimo</Text>
            <TextInput
              style={estilos.input}
              value={stockMinimo}
              onChangeText={setStockMinimo}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={estilos.label}>Código de Barras</Text>
        <TextInput
          style={estilos.input}
          value={codigoBarras}
          onChangeText={setCodigoBarras}
          keyboardType="numeric"
        />
        <Text style={estilos.label}>SKU</Text>
        <TextInput
          style={estilos.input}
          value={sku}
          onChangeText={setSku}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={estilos.botonEliminar}
          onPress={manejarEliminar}
        >
          <FontAwesome5 name="trash" size={16} color={COLORES.error} />
          <Text style={estilos.textoEliminar}>Eliminar Producto</Text>
        </TouchableOpacity>
      </ScrollView>

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
    width: 120,
    height: 120,
    alignSelf: "center",
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 60,
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
  imagenTexto: { color: COLORES.textoGris, fontSize: 10, marginTop: 5 },
  label: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 15,
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
