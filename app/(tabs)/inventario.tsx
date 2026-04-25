import { useTheme } from "../../contexts/ContextTheme";
import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useMemo } from "react";
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

  // 🔥 Conectamos al Tema Global
  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

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
      const respuesta: any = await api.get("/productos");
      setProductos(respuesta || []);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  const productosBajoStock = productos.filter((p) => p.stock <= (p.stockMinimo || 5)); // Ojo al fallback de 5
  const valorTotalInventario = productos.reduce((acc, curr) => {
    const costo = typeof curr.costo === "string" ? parseFloat(curr.costo) : curr.costo || 0;
    const stock = typeof curr.stock === "string" ? parseInt(curr.stock, 10) : curr.stock || 0;
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
      router.push("/productos/gestionar" as any);
    }
  };

  return (
    <View style={estilos.contenedor}>
      {/* ENCABEZADO CON LÍNEA DIVISORIA (Como en el original) */}
      <View style={estilos.encabezado}>
        <Text style={estilos.tituloEncabezado}>Inventario</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.contenido,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* TARJETAS SUPERIORES */}
        <View style={estilos.resumenContainer}>
          <View style={estilos.tarjetaResumen}>
            <View style={estilos.marcaAgua}>
              <FontAwesome5 name="dollar-sign" size={100} color="rgba(0,0,0,0.1)" />
            </View>
            <Text style={estilos.labelResumen}>Valor Total</Text>
            {cargando ? (
              <ActivityIndicator color={colores.textoOscuro} style={{ marginTop: 5 }} />
            ) : (
              <Text style={estilos.valorResumen}>
                {formatearMoneda(valorTotalInventario)}
              </Text>
            )}
          </View>

          <View style={estilos.tarjetaResumen}>
            <View style={estilos.marcaAgua}>
              <FontAwesome5 name="box" size={100} color="rgba(0,0,0,0.1)" />
            </View>
            <Text style={estilos.labelResumen}>Productos</Text>
            {cargando ? (
              <ActivityIndicator color={colores.textoOscuro} style={{ marginTop: 5 }} />
            ) : (
              <Text style={estilos.valorResumen}>{productos.length}</Text>
            )}
          </View>
        </View>

        {/* ALERTA DE STOCK BAJO */}
        {!cargando && productosBajoStock.length > 0 && (
          <View style={estilos.alertaContainer}>
            <View style={estilos.alertaHeader}>
              <FontAwesome5 name="exclamation-triangle" size={16} color={colores.error} />
              <Text style={estilos.alertaTitulo}>
                {productosBajoStock.length} producto{productosBajoStock.length > 1 ? "s" : ""} con stock bajo
              </Text>
            </View>
          </View>
        )}

        {/* SECCIÓN DE GESTIÓN */}
        <Text style={estilos.seccionTitulo}>GESTIÓN</Text>

        <TouchableOpacity
          style={estilos.opcion}
          activeOpacity={0.7}
          onPress={() => router.push("/productos" as any)} // Ajusta la ruta real de tu catálogo
        >
          <FontAwesome5 name="box" size={26} color={colores.primario} style={estilos.iconoOpcion} />
          <View style={estilos.textoContainer}>
            <Text style={estilos.tituloOpcion}>Productos</Text>
            <Text style={estilos.subtituloOpcion}>Ver catálogo de productos</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={16} color={colores.textoGris} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            estilos.opcion,
            !esAdmin() && { opacity: 0.5, backgroundColor: colores.fondoOscuro },
          ]}
          activeOpacity={!esAdmin() ? 1 : 0.7}
          onPress={manejarGestionarProductos}
        >
          <FontAwesome5 
            name="cog" 
            size={26} 
            color={!esAdmin() ? colores.textoGris : colores.primario} 
            style={estilos.iconoOpcion} 
          />
          <View style={estilos.textoContainer}>
            <Text style={[estilos.tituloOpcion, !esAdmin() && { color: colores.textoGris }]}>
              Gestionar Productos {!esAdmin() && "(Solo Admin)"}
            </Text>
            <Text style={estilos.subtituloOpcion}>Editar, agregar y ajustar stock</Text>
          </View>
          <FontAwesome5 
            name={!esAdmin() ? "lock" : "chevron-right"} 
            size={16} 
            color={colores.textoGris} 
          />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// 🔥 ESTILOS DINÁMICOS Y PIXEL PERFECT
const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: c.fondoOscuro,
    },
    encabezado: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.borde, // Línea divisoria igual a tu app vieja
      backgroundColor: c.fondoOscuro,
    },
    tituloEncabezado: {
      fontSize: 28, // Tamaño xl2 original
      fontWeight: "bold",
      color: c.textoBlanco,
    },
    contenido: {
      padding: 24, // Padding global como ESPACIADO.xl
    },
    
    // --- Tarjetas Resumen ---
    resumenContainer: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 24,
    },
    tarjetaResumen: {
      flex: 1,
      backgroundColor: c.primario, // Verde personalizado
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.1)", // Borde muy sutil para dar forma
      overflow: "hidden",
      minHeight: 100,
      justifyContent: "center"
    },
    marcaAgua: {
      position: "absolute",
      right: -20,
      bottom: -20,
    },
    labelResumen: {
      color: c.textoOscuro, // Texto oscuro sobre fondo primario
      fontSize: 14,
      marginBottom: 4,
    },
    valorResumen: {
      color: c.textoOscuro,
      fontSize: 28, // Tamaño xl original
      fontWeight: "bold",
    },

    // --- Alerta ---
    alertaContainer: {
      backgroundColor: "rgba(255, 59, 48, 0.1)", // c.error con opacidad
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.error,
      marginBottom: 24,
    },
    alertaHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    alertaTitulo: {
      color: c.error,
      fontWeight: "600",
      fontSize: 14,
    },

    // --- Menú de Opciones ---
    seccionTitulo: {
      color: c.textoGris,
      fontSize: 14,
      marginBottom: 16,
      marginLeft: 8,
      letterSpacing: 1,
    },
    opcion: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.borde, // Borde para definir la tarjeta
    },
    iconoOpcion: {
        width: 35,
        textAlign: 'center',
        marginRight: 12
    },
    textoContainer: {
      flex: 1,
    },
    tituloOpcion: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    subtituloOpcion: {
      color: c.textoGris,
      fontSize: 13,
    },
  });