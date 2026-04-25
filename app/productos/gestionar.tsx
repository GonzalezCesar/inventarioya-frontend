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
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Importamos el tema global
import api from "../../services/api";
import { exportarCatalogoPDF, exportarInventarioExcel } from "@/utils/exportadores"; // Ajusta si la ruta es diferente
import { descargarPlantillaExcel, procesarExcelImportacion } from "@/utils/excel"; // Ajusta si la ruta es diferente

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  stockMinimo: number;
}

export default function PantallaGestionarProductos() {
  const router = useRouter();
  const { user } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const esAdmin = () =>
    user?.rol === "admin" ||
    user?.rol === "administrador" ||
    user?.rol === "superadmin";

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, []),
  );

  const cargarProductos = async () => {
    try {
      setProcesando(true);
      const res: any = await api.get("/productos");
      setProductos(res || []);
    } catch (error) {
      console.log("Error cargando lista rápida de productos", error);
    } finally {
      setProcesando(false);
    }
  };

  // --- FUNCIONES DE EXPORTACIÓN ---
  const manejarDescargaPlantilla = async () => {
    setProcesando(true);
    const exito = await descargarPlantillaExcel();
    setProcesando(false);
    if (exito)
      Alert.alert(
        "Éxito",
        "Plantilla descargada. Llénala y usa la opción de importar.",
      );
  };

  const manejarImportacion = async () => {
    setProcesando(true);
    try {
      const resCategorias: any = await api.get("/categorias");
      const resultado = await procesarExcelImportacion(resCategorias || []);

      if (!resultado.success || !resultado.data) {
        if (resultado.error !== "Cancelado")
          Alert.alert("Error", resultado.error);
        return;
      }

      await api.post("/productos", resultado.data);

      Alert.alert(
        "Éxito",
        `${resultado.data.length} productos importados correctamente.`,
      );
      cargarProductos();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Ocurrió un error en la importación.");
    } finally {
      setProcesando(false);
    }
  };

  const manejarExportarExcel = async () => {
    if (productos.length === 0) return Alert.alert("Aviso", "No hay productos.");
    setProcesando(true);
    const categorias: any = await api.get("/categorias").catch(() => []);
    await exportarInventarioExcel(productos, categorias);
    setProcesando(false);
  };

  const manejarExportarPDF = async () => {
    if (productos.length === 0) return Alert.alert("Aviso", "No hay productos.");
    setProcesando(true);
    const categorias: any = await api.get("/categorias").catch(() => []);
    await exportarCatalogoPDF(productos, categorias, user?.nombre_negocio || 'Mi Negocio');
    setProcesando(false);
  };

  // --- COMPONENTE INTERNO: OPCIÓN DE MENÚ ---
  const OpcionMenu = ({ titulo, subtitulo, icono, onPress, Admin }: any) => {
    const bloqueado = !Admin;
    return (
      <TouchableOpacity
        style={[
          estilos.opcion,
          bloqueado && { opacity: 0.5, backgroundColor: colores.fondoOscuro },
        ]}
        onPress={() => {
          if (bloqueado) {
            Alert.alert("Acceso Restringido", "Solo para administradores");
          } else {
            onPress();
          }
        }}
        activeOpacity={bloqueado ? 1 : 0.7}
      >
        <FontAwesome5
          name={icono}
          size={24}
          color={bloqueado ? colores.textoGris : colores.primario}
          style={estilos.iconoOpcion}
        />
        <View style={estilos.textoContainer}>
          <Text
            style={[
              estilos.tituloOpcion,
              bloqueado && { color: colores.textoGris },
            ]}
          >
            {titulo} {bloqueado && "(Solo Admin)"}
          </Text>
          <Text style={estilos.subtituloOpcion}>{subtitulo}</Text>
        </View>
        <FontAwesome5
          name={bloqueado ? "lock" : "chevron-right"}
          size={16}
          color={colores.textoGris}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={estilos.contenedor}>
      {/* Encabezado (Idéntico al original) */}
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
        <Text style={estilos.tituloEncabezado}>Gestionar Productos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >
        {/* SECCIÓN ACCIONES */}
        <Text style={estilos.seccionTitulo}>ACCIONES</Text>
        <View style={{ gap: 10 }}>
            <OpcionMenu
            titulo="Agregar Producto"
            subtitulo="Crear nuevo producto"
            icono="plus"
            onPress={() => router.push("/productos/agregar")}
            Admin={esAdmin()}
            />
            <OpcionMenu
            titulo="Ajuste de Stock"
            subtitulo="Entradas y salidas de inventario"
            icono="clipboard-list" // Cambiado a un ícono más parecido al original
            onPress={() => router.push("/productos/ajuste-stock")}
            Admin={esAdmin()}
            />
            <OpcionMenu
            titulo="Gestionar Categorías"
            subtitulo="Crear y editar categorías"
            icono="tags"
            onPress={() => router.push("/productos/categorias")}
            Admin={esAdmin()}
            />
        </View>

        {/* SECCIÓN CARGA MASIVA */}
        <Text style={estilos.seccionTitulo}>CARGA MASIVA</Text>
        <View style={{ gap: 10 }}>
            <OpcionMenu
            titulo="Descargar Plantilla Excel"
            subtitulo="Guarda la plantilla y ábrela para editar"
            icono="file-download"
            onPress={manejarDescargaPlantilla}
            Admin={esAdmin()}
            />
            <OpcionMenu
            titulo="Importar Productos (Excel)"
            subtitulo="Carga el archivo editado a la App"
            icono="file-upload"
            onPress={manejarImportacion}
            Admin={esAdmin()}
            />
        </View>

        {/* SECCIÓN EXPORTAR */}
        <Text style={estilos.seccionTitulo}>EXPORTAR</Text>
        <View style={{ gap: 10 }}>
            <OpcionMenu
            titulo="Exportar Catálogo PDF"
            subtitulo="Crea un catálogo con imágenes y precios"
            icono="file-pdf"
            onPress={manejarExportarPDF}
            Admin={esAdmin()}
            />
            <OpcionMenu
            titulo="Exportar Inventario Excel"
            subtitulo="Descarga la lista completa de productos"
            icono="file-excel"
            onPress={manejarExportarExcel}
            Admin={esAdmin()}
            />
        </View>

        {/* LISTADO DE PRODUCTOS */}
        <View style={estilos.headerLista}>
          <Text style={[estilos.seccionTitulo, { marginTop: 0, marginBottom: 0 }]}>
            PRODUCTOS ({productos.length})
          </Text>
          {procesando && (
            <ActivityIndicator size="small" color={colores.primario} />
          )}
        </View>

        {productos.length > 0 ? (
          productos.map((producto) => (
            <TouchableOpacity
              key={producto.id}
              style={estilos.productoItem}
              onPress={() => router.push(`/productos/editar/${producto.id}`)}
            >
              <View style={estilos.productoInfo}>
                <Text style={estilos.productoNombre}>{producto.nombre}</Text>
                <Text style={estilos.productoSku}>SKU: {producto.sku}</Text>
              </View>
              <View style={estilos.productoDetalles}>
                <Text
                  style={[
                    estilos.productoStock,
                    producto.stock <= (producto.stockMinimo || 5) && { // Fallback por si stockMinimo no existe
                      color: colores.error,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Stock: {producto.stock}
                </Text>
                <FontAwesome5 name="edit" size={18} color={colores.primario} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={estilos.vacio}>
            <FontAwesome5 name="box-open" size={40} color={colores.textoGris} />
            <Text style={estilos.textoVacio}>No hay productos</Text>
          </View>
        )}
      </ScrollView>

      {/* Overlay de Carga (Como en el original) */}
      {procesando && (
        <View style={estilos.loadingOverlay}>
            <ActivityIndicator size="large" color={colores.primario} />
            <Text style={{ color: colores.textoBlanco, marginTop: 10 }}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: c.fondoOscuro,
    },
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
    tituloEncabezado: {
      fontSize: 20,
      fontWeight: "bold",
      color: c.textoBlanco,
    },

    contenido: {
      padding: 20,
      paddingBottom: 40,
    },

    seccionTitulo: {
      color: c.subtitulos, // Títulos en Verde
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 15,
      marginTop: 25,
      letterSpacing: 1,
    },

    headerLista: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 25,
      marginBottom: 15,
    },

    opcion: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 16,
      borderRadius: 16, // Bordes un poco más redondeados como en la imagen
      borderWidth: 1,
      borderColor: c.borde,
    },
    iconoOpcion: {
        width: 35,
        textAlign: 'center',
        marginRight: 15,
    },
    textoContainer: { flex: 1 },
    tituloOpcion: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    subtituloOpcion: { color: c.textoGris, fontSize: 13 },

    productoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.borde,
    },
    productoInfo: { flex: 1 },
    productoNombre: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "600",
    },
    productoSku: { color: c.textoGris, fontSize: 13, marginTop: 4 },
    productoDetalles: { flexDirection: "row", alignItems: "center", gap: 15 },
    productoStock: { color: c.textoGris, fontSize: 14 },

    vacio: { alignItems: "center", paddingVertical: 40, gap: 10 },
    textoVacio: { color: c.textoGris, fontSize: 16 },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    }
  });