import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Importamos el tema
import api from "../../services/api";

const API_URL = "http://192.168.1.111:8000";

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria_id: string;
  imagen?: string;
}

export default function PantallaProductos() {
  const router = useRouter();
  const { user } = useAuth();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

  // 🔥 Arreglamos la validación para incluir al superadmin y hacerlo case-insensitive
  const esAdmin = () => {
    const rol = user?.rol?.toLowerCase() || "";
    return rol === "admin" || rol === "administrador" || rol === "superadmin";
  };

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("__todas__");

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resProductos, resCategorias]: any = await Promise.all([
        api.get("/productos"),
        api.get("/categorias"),
      ]);

      setProductos(resProductos || []);
      setCategorias(resCategorias || []);
    } catch (error) {
      console.error("Error cargando datos del catálogo:", error);
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
      String(producto.categoria_id) === String(categoriaSeleccionada);
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
              <FontAwesome5 name="box" size={30} color={colores.textoGris} />
            </View>
          )}
          {bloqueado && (
            <View style={estilos.badgeCandado}>
              <FontAwesome5 name="lock" size={10} color="#FFFFFF" />
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
              stockBajo && { color: colores.error, fontWeight: "bold" },
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
            color={colores.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Productos</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Buscador */}
      <View style={estilos.barraBusqueda}>
        <FontAwesome5 name="search" size={18} color={colores.textoGris} />
        <TextInput
          style={estilos.inputBusqueda}
          placeholder="Buscar por nombre o SKU..."
          placeholderTextColor={colores.textoGris}
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
          color={colores.primario}
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
              <FontAwesome5 name="box-open" size={50} color={colores.borde} />
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

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any, isDark: boolean) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },

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
    titulo: { fontSize: 22, fontWeight: "bold", color: c.textoBlanco },

    barraBusqueda: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      marginHorizontal: 20,
      marginBottom: 15,
      paddingHorizontal: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    inputBusqueda: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      fontSize: 16,
      color: c.textoBlanco,
    },

    chipCategoria: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.fondoTarjeta,
      borderWidth: 1,
      borderColor: c.borde,
      justifyContent: "center",
    },
    chipCategoriaActiva: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    textoCategoria: {
      color: c.textoGris,
      fontSize: 14,
      fontWeight: "bold",
    },
    textoCategoriaActiva: { color: c.textoOscuro },

    gridProductos: { paddingHorizontal: 20, paddingBottom: 40 },
    rowWrapper: { justifyContent: "space-between", marginBottom: 15 },

    card: {
      width: "48%",
      backgroundColor: c.fondoTarjeta,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borde,
      overflow: "hidden",
    },
    cardImagen: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: c.fondoOscuro,
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
      color: c.textoBlanco,
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
      minHeight: 38,
    },
    cardStock: { color: c.textoGris, fontSize: 12, marginBottom: 8 },
    cardPrecio: { color: c.primario, fontSize: 18, fontWeight: "900" },

    vacio: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 15,
    },
    textoVacio: { color: c.textoGris, fontSize: 16 },
  });
