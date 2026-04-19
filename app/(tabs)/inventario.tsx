import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO (Pixel Perfect basado en tu imagen) ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#212124", // Ligeramente más claro que el fondo
  primario: "#C4FF0D", // Verde Neón exacto de la foto
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
};

interface Producto {
  id: string;
  costo: number;
  precio: number;
  stock: number;
  stockMinimo: number;
}

export default function PantallaInventario() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Función de seguridad
  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  useFocusEffect(
    useCallback(() => {
      cargarResumenInventario();
    }, []),
  );

  const cargarResumenInventario = async () => {
    try {
      setCargando(true);
      // Pedimos la lista de productos a tu API real
      const respuesta: any = await api.get("/productos");
      setProductos(respuesta || []);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  // Cálculos en tiempo real basados en los productos obtenidos
  const productosBajoStock = productos.filter((p) => p.stock <= p.stockMinimo);
  const valorTotalInventario = productos.reduce((acc, curr) => {
    // Si tu API devuelve el costo como string, lo parseamos
    const costo =
      typeof curr.costo === "string" ? parseFloat(curr.costo) : curr.costo || 0;
    const stock =
      typeof curr.stock === "string"
        ? parseInt(curr.stock, 10)
        : curr.stock || 0;
    return acc + costo * stock;
  }, 0);

  const formatearMoneda = (monto: number) => `$${monto.toFixed(2)}`;

  const manejarGestionarProductos = () => {
    if (!esAdmin()) {
      Alert.alert(
        "Acceso Restringido",
        "Solo los administradores pueden gestionar productos.",
      );
    } else {
      router.push("/productos/gestionar");
    }
  };

  return (
    <View style={estilos.contenedor}>
      {/* HEADER DE LA PANTALLA */}
      <View style={estilos.header}>
        <Text style={estilos.tituloPantalla}>Inventario</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* TARJETAS SUPERIORES (KPIs) */}
        <View style={estilos.filaTarjetas}>
          <View style={estilos.tarjetaNeon}>
            <View style={{ zIndex: 1, alignItems: "center" }}>
              <Text style={estilos.tituloTarjetaNeon}>Valor Total</Text>
              {cargando ? (
                <ActivityIndicator
                  color={COLORES.textoOscuro}
                  style={{ marginTop: 5 }}
                />
              ) : (
                <Text style={estilos.valorTarjetaNeon}>
                  {formatearMoneda(valorTotalInventario)}
                </Text>
              )}
            </View>
            <FontAwesome5
              name="dollar-sign"
              size={90}
              color="rgba(0,0,0,0.05)"
              style={estilos.marcaAgua}
            />
          </View>

          <View style={estilos.tarjetaNeon}>
            <View style={{ zIndex: 1, alignItems: "center" }}>
              <Text style={estilos.tituloTarjetaNeon}>Productos</Text>
              {cargando ? (
                <ActivityIndicator
                  color={COLORES.textoOscuro}
                  style={{ marginTop: 5 }}
                />
              ) : (
                <Text style={estilos.valorTarjetaNeon}>{productos.length}</Text>
              )}
            </View>
            <FontAwesome5
              name="box"
              size={80}
              color="rgba(0,0,0,0.05)"
              style={estilos.marcaAgua}
            />
          </View>
        </View>

        {/* ALERTA DE STOCK BAJO (Solo visible si hay > 0) */}
        {!cargando && productosBajoStock.length > 0 && (
          <View style={estilos.alertaContainer}>
            <View style={estilos.alertaHeader}>
              <FontAwesome5
                name="exclamation-triangle"
                size={16}
                color={COLORES.error}
              />
              <Text style={estilos.alertaTitulo}>
                {productosBajoStock.length} producto
                {productosBajoStock.length > 1 ? "s" : ""} con stock bajo
              </Text>
            </View>
          </View>
        )}

        {/* SECCIÓN DE GESTIÓN */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>GESTIÓN</Text>

          {/* Botón Productos (Acceso para todos) */}
          <TouchableOpacity
            style={estilos.botonLista}
            activeOpacity={0.7}
            onPress={() => router.push("/productos")}
          >
            <View style={estilos.iconoContenedor}>
              <FontAwesome5
                name="box-open"
                size={20}
                color={COLORES.primario}
              />
            </View>
            <View style={estilos.textosBotonLista}>
              <Text style={estilos.tituloBotonLista}>Productos</Text>
              <Text style={estilos.subtituloBotonLista}>
                Ver catálogo de productos
              </Text>
            </View>
            <FontAwesome5
              name="chevron-right"
              size={14}
              color={COLORES.textoGris}
            />
          </TouchableOpacity>

          {/* Botón Gestionar Productos (Solo Administradores) */}
          <TouchableOpacity
            style={[
              estilos.botonLista,
              !esAdmin() && {
                opacity: 0.5,
                backgroundColor: COLORES.fondoOscuro,
              },
            ]}
            activeOpacity={!esAdmin() ? 1 : 0.7}
            onPress={manejarGestionarProductos}
          >
            <View style={estilos.iconoContenedor}>
              <FontAwesome5
                name="cog"
                size={22}
                color={!esAdmin() ? COLORES.textoGris : COLORES.primario}
              />
            </View>
            <View style={estilos.textosBotonLista}>
              <Text
                style={[
                  estilos.tituloBotonLista,
                  !esAdmin() && { color: COLORES.textoGris },
                ]}
              >
                Gestionar Productos {!esAdmin() && "(Solo Admin)"}
              </Text>
              <Text style={estilos.subtituloBotonLista}>
                Editar, agregar y ajustar stock
              </Text>
            </View>
            <FontAwesome5
              name={!esAdmin() ? "lock" : "chevron-right"}
              size={14}
              color={COLORES.textoGris}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 25,
    backgroundColor: COLORES.fondoOscuro,
  },
  tituloPantalla: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },
  scrollContent: { padding: 20, paddingTop: 0 },

  filaTarjetas: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  tarjetaNeon: {
    width: "48%",
    backgroundColor: COLORES.primario,
    padding: 20,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  tituloTarjetaNeon: {
    fontSize: 14,
    color: COLORES.textoOscuro,
    marginBottom: 8,
  },
  valorTarjetaNeon: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
  },
  marcaAgua: { position: "absolute", right: -15, bottom: -20 },

  alertaContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.1)", // Rojo con 10% opacidad
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.error,
    marginBottom: 25,
  },
  alertaHeader: { flexDirection: "row", alignItems: "center" },
  alertaTitulo: {
    color: COLORES.error,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 10,
  },

  seccion: { marginBottom: 30 },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORES.textoGris,
    marginBottom: 15,
    letterSpacing: 1,
    marginLeft: 5,
  },

  botonLista: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconoContenedor: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textosBotonLista: { flex: 1 },
  tituloBotonLista: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 4,
  },
  subtituloBotonLista: { fontSize: 13, color: COLORES.textoGris },
});
