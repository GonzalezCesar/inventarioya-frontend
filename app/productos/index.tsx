import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
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

// URL base para las imágenes (ajustada a tu IP local)
const API_URL = "http://192.168.1.105:8000";

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoriaId: string;
  imagen?: string;
}

export default function PantallaProductos() {
  const router = useRouter();
  const { user } = useAuth();

  const esAdmin = () => user?.rol === "admin" || user?.rol === "administrador";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("__todas__");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const resProductos: any = await api.get("/productos");
      setProductos(resProductos || []);

      setCategorias([
        { id: "1", nombre: "Bebids" },
        { id: "2", nombre: "Snacks" },
        { id: "3", nombre: "Limpieza" },
        { id: "4", nombre: "Dulce" },
      ]);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.sku.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaSeleccionada === "__todas__" ||
      producto.categoriaId === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  const formatearMoneda = (valor: number) => `$ ${valor.toFixed(2)}`;

  const getImageSource = (imagen?: string) => {
    if (!imagen) return null;
    if (imagen.startsWith("http") || imagen.startsWith("data:"))
      return { uri: imagen };
    return { uri: `${API_URL}/uploads/${imagen}` };
  };

  // Componente Tarjeta de Producto
  const renderProductCard = ({ item }: { item: Producto }) => {
    const bloqueado = !esAdmin();
    const source = getImageSource(item.imagen);
    const stockBajo = item.stock <= item.stockMinimo;

    return (
      <TouchableOpacity
        style={[estilos.card, bloqueado && { opacity: 0.7 }]}
        activeOpacity={bloqueado ? 1 : 0.7}
        onPress={() => {
          if (!bloqueado) {
            // Aquí enrutaremos a la pantalla de edición más adelante
            Alert.alert("Editar", `Abriendo edición para: ${item.nombre}`);
            router.push(`/productos/editar/${item.id}`);
          } else {
            Alert.alert(
              "Acceso Restringido",
              "Solo los administradores pueden editar productos.",
            );
          }
        }}
      >
        <View style={estilos.cardImagen}>
          {source ? (
            <Image source={source} style={estilos.imagen} />
          ) : (
            <View style={estilos.imagenPlaceholder}>
              <FontAwesome5 name="box" size={30} color={COLORES.textoGris} />
            </View>
          )}
          {bloqueado && (
            <View style={estilos.badgeCandado}>
              <FontAwesome5 name="lock" size={10} color={COLORES.textoBlanco} />
            </View>
          )}
        </View>
        <View style={estilos.cardInfo}>
          <Text style={estilos.cardNombre} numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text
            style={[
              estilos.cardStock,
              stockBajo && { color: COLORES.error, fontWeight: "bold" },
            ]}
          >
            Stock: {item.stock}
          </Text>
          <Text style={estilos.cardPrecio}>{formatearMoneda(item.precio)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={estilos.contenedor}>
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
        <Text style={estilos.titulo}>Productos</Text>
        <View style={{ width: 40 }} />
        {/* Espaciador invisible para centrar título */}
      </View>

      {/* Buscador */}
      <View style={estilos.barraBusqueda}>
        <FontAwesome5 name="search" size={18} color={COLORES.textoGris} />
        <TextInput
          style={estilos.inputBusqueda}
          placeholder="Buscar por nombre o SKU..."
          placeholderTextColor={COLORES.textoGris}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Chips de Categorías */}
      <View style={{ paddingBottom: 15 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "__todas__", nombre: "Todas" }, ...categorias]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                estilos.chipCategoria,
                categoriaSeleccionada === item.id &&
                  estilos.chipCategoriaActiva,
              ]}
              onPress={() => setCategoriaSeleccionada(item.id)}
            >
              <Text
                style={[
                  estilos.textoCategoria,
                  categoriaSeleccionada === item.id &&
                    estilos.textoCategoriaActiva,
                ]}
              >
                {item.nombre}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Cuadrícula de Productos */}
      {cargando ? (
        <ActivityIndicator
          size="large"
          color={COLORES.primario}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={estilos.rowWrapper}
          contentContainerStyle={estilos.gridProductos}
          renderItem={renderProductCard}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <FontAwesome5 name="box-open" size={50} color={COLORES.borde} />
              <Text style={estilos.textoVacio}>
                No se encontraron productos
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  },
  botonVolver: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titulo: { fontSize: 22, fontWeight: "bold", color: COLORES.textoBlanco },

  barraBusqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  inputBusqueda: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORES.textoBlanco,
  },

  chipCategoria: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    justifyContent: "center",
  },
  chipCategoriaActiva: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primario,
  },
  textoCategoria: {
    color: COLORES.textoGris,
    fontSize: 14,
    fontWeight: "bold",
  },
  textoCategoriaActiva: { color: COLORES.textoOscuro },

  gridProductos: { paddingHorizontal: 20, paddingBottom: 40 },
  rowWrapper: { justifyContent: "space-between", marginBottom: 15 },

  card: {
    width: "48%",
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    overflow: "hidden",
  },
  cardImagen: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORES.fondoOscuro,
    position: "relative",
  },
  imagen: { width: "100%", height: "100%", resizeMode: "cover" },
  imagenPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCandado: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 6,
    borderRadius: 12,
  },

  cardInfo: { padding: 12 },
  cardNombre: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    minHeight: 38,
  },
  cardStock: { color: COLORES.textoGris, fontSize: 12, marginBottom: 8 },
  cardPrecio: { color: COLORES.primario, fontSize: 18, fontWeight: "900" },

  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 15,
  },
  textoVacio: { color: COLORES.textoGris, fontSize: 16 },
});
