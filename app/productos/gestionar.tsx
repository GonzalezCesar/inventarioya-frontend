import { exportarCatalogoPDF, exportarInventarioExcel } from "@/utils";
import {
  descargarPlantillaExcel,
  procesarExcelImportacion,
} from "@/utils/excel";
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
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO (Pixel Perfect) ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#C4FF0D", // Verde exacto de la UI
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF3B30",
};

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  stockMinimo: number;
}

// --- COMPONENTE REUTILIZABLE: OPCIÓN DE MENÚ ---
const OpcionMenu = ({ titulo, subtitulo, icono, onPress, esAdmin }: any) => {
  const bloqueado = !esAdmin;

  return (
    <TouchableOpacity
      style={[
        estilos.opcion,
        bloqueado && { opacity: 0.5, backgroundColor: COLORES.fondoOscuro },
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
      <View style={estilos.iconoContenedor}>
        <FontAwesome5
          name={icono}
          size={24}
          color={bloqueado ? COLORES.textoGris : COLORES.primario}
        />
      </View>
      <View style={estilos.textoContainer}>
        <Text
          style={[
            estilos.tituloOpcion,
            bloqueado && { color: COLORES.textoGris },
          ]}
        >
          {titulo} {bloqueado && "(Solo Admin)"}
        </Text>
        <Text style={estilos.subtituloOpcion}>{subtitulo}</Text>
      </View>
      <FontAwesome5
        name={bloqueado ? "lock" : "chevron-right"}
        size={16}
        color={COLORES.textoGris}
      />
    </TouchableOpacity>
  );
};

export default function PantallaGestionarProductos() {
  const router = useRouter();
  const { user } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);

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

  // --- MOCKS DE FUNCIONES DE EXPORTACIÓN ---
  // (Aquí luego conectaremos con tus utilidades de Excel/PDF)
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
      // Necesitamos las categorías para mapearlas
      const resCategorias: any = await api.get("/categorias");
      const resultado = await procesarExcelImportacion(resCategorias || []);

      if (!resultado.success || !resultado.data) {
        if (resultado.error !== "Cancelado")
          Alert.alert("Error", resultado.error);
        return;
      }

      // Enviar el array de productos a tu backend (Bulk Insert)
      await api.post("/productos", resultado.data);

      Alert.alert(
        "Éxito",
        `${resultado.data.length} productos importados correctamente.`,
      );
      cargarProductos(); // Recargar la lista de la pantalla
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Ocurrió un error en la importación.",
      );
    } finally {
      setProcesando(false);
    }
  };

  const manejarExportarExcel = async () => {
    if (productos.length === 0)
      return Alert.alert("Aviso", "No hay productos.");
    setProcesando(true);
    const categorias: any = await api.get("/categorias").catch(() => []);
    await exportarInventarioExcel(productos, categorias);
    setProcesando(false);
  };

  const manejarExportarPDF = async () => {
    if (productos.length === 0)
      return Alert.alert("Aviso", "No hay productos.");
    setProcesando(true);
    const categorias: any = await api.get("/categorias").catch(() => []);
    await exportarCatalogoPDF(productos, categorias);
    setProcesando(false);
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
        <Text style={estilos.tituloEncabezado}>Gestionar Productos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >
        {/* SECCIÓN ACCIONES */}
        <Text style={estilos.seccionTitulo}>ACCIONES</Text>
        <OpcionMenu
          titulo="Agregar Producto"
          subtitulo="Crear nuevo producto"
          icono="plus"
          onPress={() => router.push("/productos/agregar")} // Ruta corregida a tu estructura
          esAdmin={esAdmin()}
        />
        <OpcionMenu
          titulo="Ajuste de Stock"
          subtitulo="Entradas y salidas de inventario"
          icono="clipboard-list"
          // Mantenemos esto pendiente hasta que pasemos la pantalla de AjusteStock
          onPress={() => router.push("/productos/ajuste-stock")}
          esAdmin={esAdmin()}
        />
        <OpcionMenu
          titulo="Gestionar Categorías"
          subtitulo="Crear y editar categorías"
          icono="tags"
          onPress={() => router.push("/productos/categorias")} // Navegación a categorías
          esAdmin={esAdmin()}
        />

        {/* SECCIÓN CARGA MASIVA */}
        <Text style={estilos.seccionTitulo}>CARGA MASIVA</Text>
        <OpcionMenu
          titulo="Descargar Plantilla Excel"
          subtitulo="Guarda la plantilla y ábrela para editar"
          icono="file-download"
          onPress={manejarDescargaPlantilla}
          esAdmin={esAdmin()}
        />
        <OpcionMenu
          titulo="Importar Productos (Excel)"
          subtitulo="Carga el archivo editado a la App"
          icono="file-upload"
          onPress={manejarImportacion}
          esAdmin={esAdmin()}
        />

        {/* SECCIÓN EXPORTAR */}
        <Text style={estilos.seccionTitulo}>EXPORTAR</Text>
        <OpcionMenu
          titulo="Exportar Catálogo PDF"
          subtitulo="Crea un catálogo con imágenes y precios"
          icono="file-pdf"
          onPress={manejarExportarPDF}
          esAdmin={esAdmin()}
        />
        <OpcionMenu
          titulo="Exportar Inventario Excel"
          subtitulo="Descarga la lista completa de productos"
          icono="file-excel"
          onPress={manejarExportarExcel}
          esAdmin={esAdmin()}
        />

        {/* LISTA RÁPIDA DE PRODUCTOS */}
        <View style={estilos.headerLista}>
          <Text
            style={[estilos.seccionTitulo, { marginTop: 0, marginBottom: 0 }]}
          >
            PRODUCTOS ({productos.length})
          </Text>
          {procesando && (
            <ActivityIndicator size="small" color={COLORES.primario} />
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
                    producto.stock <= producto.stockMinimo && {
                      color: COLORES.error,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Stock: {producto.stock}
                </Text>
                <FontAwesome5 name="edit" size={18} color={COLORES.primario} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={estilos.vacio}>
            <FontAwesome5 name="box-open" size={40} color={COLORES.textoGris} />
            <Text style={estilos.textoVacio}>No hay productos</Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  tituloEncabezado: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },

  contenido: { padding: 20, paddingBottom: 40 },

  seccionTitulo: {
    color: COLORES.primario,
    fontSize: 13,
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
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  iconoContenedor: { width: 40, alignItems: "center" },
  textoContainer: { flex: 1 },
  tituloOpcion: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  subtituloOpcion: { color: COLORES.textoGris, fontSize: 12 },

  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  productoInfo: { flex: 1 },
  productoNombre: {
    color: COLORES.textoBlanco,
    fontSize: 15,
    fontWeight: "bold",
  },
  productoSku: { color: COLORES.textoGris, fontSize: 12, marginTop: 4 },
  productoDetalles: { flexDirection: "row", alignItems: "center", gap: 15 },
  productoStock: { color: COLORES.textoGris, fontSize: 14 },

  vacio: { alignItems: "center", paddingVertical: 30, gap: 10 },
  textoVacio: { color: COLORES.textoGris, fontSize: 14 },
});
