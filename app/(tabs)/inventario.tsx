import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#C4FF0D", // Tu VERDE_PERSONALIZADO exacto
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  error: "#FF6B6B",
};

interface DatosInventario {
  valor_total: number;
  cantidad_productos: number;
  bajo_stock: number;
}

export default function PantallaInventario() {
  const router = useRouter();
  const { user } = useAuth();

  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState<DatosInventario>({
    valor_total: 0,
    cantidad_productos: 0,
    bajo_stock: 0, // Añadimos esto para la alerta roja
  });

  // Función de seguridad
  const esAdmin = () => user?.rol === "admin" || user?.rol === "administrador";

  useEffect(() => {
    cargarResumenInventario();
  }, []);

  const cargarResumenInventario = async () => {
    try {
      setCargando(true);
      // Cuando crees el backend para esto, descomenta estas líneas:
      // const respuesta: any = await api.get('/inventario/resumen');
      // setDatos(respuesta);

      // Simulamos que hay 2 productos con stock bajo para que veas el diseño
      setDatos({
        valor_total: 0,
        cantidad_productos: 0,
        bajo_stock: 2,
      });
    } catch (error) {
      console.error("Error cargando resumen de inventario:", error);
    } finally {
      setCargando(false);
    }
  };

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
        contentContainerStyle={estilos.scrollContent}
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
                  {formatearMoneda(datos.valor_total)}
                </Text>
              )}
            </View>
            <FontAwesome5
              name="dollar-sign"
              size={80}
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
                <Text style={estilos.valorTarjetaNeon}>
                  {datos.cantidad_productos}
                </Text>
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

        {/* ALERTA DE STOCK BAJO */}
        {datos.bajo_stock > 0 && (
          <View style={estilos.alertaContainer}>
            <View style={estilos.alertaHeader}>
              <FontAwesome5
                name="exclamation-triangle"
                size={16}
                color={COLORES.error}
              />
              <Text style={estilos.alertaTitulo}>
                {datos.bajo_stock} producto{datos.bajo_stock > 1 ? "s" : ""} con
                stock bajo
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
            style={[estilos.botonLista, !esAdmin() && { opacity: 0.5 }]}
            activeOpacity={!esAdmin() ? 1 : 0.7}
            onPress={manejarGestionarProductos}
          >
            <View style={estilos.iconoContenedor}>
              <FontAwesome5
                name="cog"
                size={20}
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORES.fondoOscuro,
  },
  tituloPantalla: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },

  filaTarjetas: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tarjetaNeon: {
    width: "48%",
    backgroundColor: COLORES.primario,
    padding: 20,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  tituloTarjetaNeon: {
    fontSize: 13,
    color: COLORES.textoOscuro,
    marginBottom: 5,
  },
  valorTarjetaNeon: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
  },
  marcaAgua: { position: "absolute", right: -15, bottom: -15 },

  alertaContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 15,
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
    fontSize: 14,
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
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  iconoContenedor: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
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
