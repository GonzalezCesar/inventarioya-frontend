import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";

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

// --- COMPONENTE REUTILIZABLE: OPCIÓN DE MENÚ ---
const OpcionMenu = ({ titulo, subtitulo, icono, onPress, esAdmin }: any) => {
  const bloqueado = !esAdmin;

  return (
    <TouchableOpacity
      style={[estilos.opcion, bloqueado && { opacity: 0.5 }]}
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
          size={22}
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
  const [productos, setProductos] = useState<any[]>([]);

  const esAdmin = user?.rol === "admin" || user?.rol === "administrador";

  useEffect(() => {
    // Mock de productos para ver el diseño (luego lo conectaremos a la API)
    setProductos([
      {
        id: "101",
        nombre: "Coca Cola 2L",
        sku: "BEB-001",
        stock: 45,
        stockMinimo: 10,
      },
      {
        id: "102",
        nombre: "Pepsi 2L",
        sku: "BEB-002",
        stock: 4,
        stockMinimo: 10,
      },
    ]);
  }, []);

  // --- MOCKS DE FUNCIONES (Hasta migrar utilidades) ---
  const manejarDescargaPlantilla = () => {
    Alert.alert("Descargar", "Descargando plantilla Excel...");
  };
  const manejarImportacion = () => {
    Alert.alert("Importar", "Abriendo selector de archivos...");
  };
  const manejarExportarExcel = () => {
    Alert.alert("Exportar", "Generando Excel del inventario...");
  };
  const manejarExportarPDF = () => {
    Alert.alert("Exportar", "Generando Catálogo PDF...");
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
          onPress={() => router.push("/productos/agregar")} // Ruta preparada para el siguiente paso
          esAdmin={esAdmin}
        />
        <OpcionMenu
          titulo="Ajuste de Stock"
          subtitulo="Entradas y salidas de inventario"
          icono="clipboard-list"
          onPress={() => Alert.alert("Navegar", "Ir a Ajuste de Stock")}
          esAdmin={esAdmin}
        />
        <OpcionMenu
          titulo="Gestionar Categorías"
          subtitulo="Crear y editar categorías"
          icono="tags"
          onPress={() => Alert.alert("Navegar", "Ir a Categorías")}
          esAdmin={esAdmin}
        />

        {/* SECCIÓN CARGA MASIVA */}
        <Text style={estilos.seccionTitulo}>CARGA MASIVA</Text>
        <OpcionMenu
          titulo="Descargar Plantilla Excel"
          subtitulo="Guarda la plantilla y ábrela para editar"
          icono="file-download"
          onPress={manejarDescargaPlantilla}
          esAdmin={esAdmin}
        />
        <OpcionMenu
          titulo="Importar Productos (Excel)"
          subtitulo="Carga el archivo editado a la App"
          icono="file-upload"
          onPress={manejarImportacion}
          esAdmin={esAdmin}
        />

        {/* SECCIÓN EXPORTAR */}
        <Text style={estilos.seccionTitulo}>EXPORTAR</Text>
        <OpcionMenu
          titulo="Exportar Catálogo PDF"
          subtitulo="Crea un catálogo con imágenes y precios"
          icono="file-pdf"
          onPress={manejarExportarPDF}
          esAdmin={esAdmin}
        />
        <OpcionMenu
          titulo="Exportar Inventario Excel"
          subtitulo="Descarga la lista completa de productos"
          icono="file-excel"
          onPress={manejarExportarExcel}
          esAdmin={esAdmin}
        />

        {procesando && (
          <View style={estilos.loadingBox}>
            <ActivityIndicator size="large" color={COLORES.primario} />
            <Text style={{ color: COLORES.textoBlanco, marginTop: 10 }}>
              Procesando...
            </Text>
          </View>
        )}

        {/* LISTA RÁPIDA DE PRODUCTOS */}
        <Text style={estilos.seccionTitulo}>
          PRODUCTOS ({productos.length})
        </Text>

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

  loadingBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
});
