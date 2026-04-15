import { FontAwesome5 } from "@expo/vector-icons"; // Iconos estándar de Expo
import { useRouter } from "expo-router"; // Usamos el router de Expo
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth"; // Tu nuevo contexto de autenticación
import api from "../../services/api"; // Tu conexión al backend PHP

// --- TEMA HARDCODEADO (Para que funcione al instante con tu diseño) ---
const COLORES = {
  fondoOscuro: "#1C1C1E", // Fondo principal
  fondoTarjeta: "#2C2C2E", // Gris oscuro de las tarjetas
  primario: "#D4FF00", // Tu Verde Neón espectacular
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
};

// --- INTERFAZ DE DATOS DEL BACKEND ---
interface DatosDashboard {
  ventas_hoy: number;
  cantidad_ventas: number;
  por_cobrar: number;
  stock_bajo: number;
  recientes: any[];
}

export default function PantallaDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);

  // Estado local para los datos que ahora vienen de PHP
  const [datos, setDatos] = useState<DatosDashboard>({
    ventas_hoy: 0,
    cantidad_ventas: 0,
    por_cobrar: 0,
    stock_bajo: 0,
    recientes: [],
  });

  useEffect(() => {
    cargarDatosDesdePHP();
  }, []);

  const cargarDatosDesdePHP = async () => {
    try {
      setCargando(true);
      // Aquí golpeamos a tu backend: localhost:8000/api/admin/dashboard
      const respuesta: any = await api.get("/dashboard");

      // Mapeamos los datos reales desde PHP
      if (respuesta) {
        setDatos(respuesta);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setCargando(false);
    }
  };

  const formatearMoneda = (monto: number) => `$ ${(monto || 0).toFixed(2)}`;

  if (cargando) {
    return (
      <View
        style={[
          estilos.contenedor,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        style={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}
        <View style={estilos.encabezado}>
          <Text style={estilos.saludo}>
            Hola, {user?.nombre || "Administrador"}
          </Text>
          <Text style={estilos.rol}>
            {user?.rol === "admin" ? "Administrador Principal" : "Vendedor"}
          </Text>
        </View>

        {/* RESUMEN */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Resumen</Text>

          {/* Tarjeta Principal (Neón) */}
          <View style={estilos.tarjetaPrincipal}>
            <View style={{ zIndex: 1 }}>
              <Text style={estilos.tituloTarjetaPrincipal}>VENTAS DE HOY</Text>
              <Text style={estilos.valorTarjetaPrincipal}>
                {formatearMoneda(datos.ventas_hoy)}
              </Text>
              <Text style={estilos.subtituloTarjetaPrincipal}>
                {datos.cantidad_ventas} ventas realizadas
              </Text>
            </View>
            <FontAwesome5
              name="dollar-sign"
              size={100}
              color="rgba(0,0,0,0.1)"
              style={estilos.marcaAgua}
            />
          </View>

          {/* Tarjetas Pequeñas */}
          <View style={estilos.fila}>
            <View style={estilos.tarjetaPequena}>
              <Text style={estilos.tituloTarjetaPequena}>POR COBRAR</Text>
              <Text style={estilos.valorTarjetaPequena}>
                {formatearMoneda(datos.por_cobrar)}
              </Text>
              <FontAwesome5
                name="clock"
                size={60}
                color="rgba(212, 255, 0, 0.05)"
                style={estilos.marcaAgua}
              />
            </View>

            <View style={estilos.tarjetaPequena}>
              <Text style={estilos.tituloTarjetaPequena}>STOCK BAJO</Text>
              <Text style={estilos.valorTarjetaPequena}>
                {datos.stock_bajo}
              </Text>
              <FontAwesome5
                name="exclamation-triangle"
                size={60}
                color="rgba(212, 255, 0, 0.05)"
                style={estilos.marcaAgua}
              />
            </View>
          </View>
        </View>

        {/* ACCIONES RÁPIDAS */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Acciones Rápidas</Text>
          <View style={estilos.gridAcciones}>
            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/(tabs)/vender")}
            >
              <FontAwesome5
                name="dollar-sign"
                size={30}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Nueva Venta</Text>
              <FontAwesome5
                name="dollar-sign"
                size={80}
                color="rgba(0,0,0,0.1)"
                style={estilos.marcaAgua}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/productos/escaner")}
            >
              <FontAwesome5
                name="camera"
                size={30}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Escanear</Text>
              <FontAwesome5
                name="camera"
                size={80}
                color="rgba(0,0,0,0.1)"
                style={estilos.marcaAgua}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/(tabs)/inventario")}
            >
              <FontAwesome5 name="box" size={30} color={COLORES.textoOscuro} />
              <Text style={estilos.tituloAccion}>Productos</Text>
              <FontAwesome5
                name="box"
                size={80}
                color="rgba(0,0,0,0.1)"
                style={estilos.marcaAgua}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/(tabs)/reportes")}
            >
              <FontAwesome5
                name="chart-bar"
                size={30}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Reportes</Text>
              <FontAwesome5
                name="chart-bar"
                size={80}
                color="rgba(0,0,0,0.1)"
                style={estilos.marcaAgua}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVIDAD RECIENTE */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Actividad Reciente</Text>
          {datos.recientes.length > 0 ? (
            /* Aquí iría el map de recientes */
            <View></View>
          ) : (
            <Text style={estilos.textoVacio}>No hay ventas hoy</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  contenido: { flex: 1, padding: 20 },
  encabezado: { marginTop: 20, marginBottom: 30 },
  saludo: { fontSize: 28, fontWeight: "bold", color: COLORES.textoBlanco },
  rol: { fontSize: 16, color: COLORES.primario, marginTop: 5 },
  seccion: { marginBottom: 30 },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 15,
  },

  // Tarjetas
  tarjetaPrincipal: {
    backgroundColor: COLORES.primario,
    padding: 20,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 15,
  },
  tituloTarjetaPrincipal: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
    letterSpacing: 1,
  },
  valorTarjetaPrincipal: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
    marginVertical: 5,
  },
  subtituloTarjetaPrincipal: { fontSize: 14, color: COLORES.textoOscuro },

  fila: { flexDirection: "row", justifyContent: "space-between" },
  tarjetaPequena: {
    width: "48%",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.primario,
    overflow: "hidden",
  },
  tituloTarjetaPequena: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORES.primario,
    letterSpacing: 1,
  },
  valorTarjetaPequena: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORES.primario,
    marginVertical: 5,
  },

  // Acciones
  gridAcciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tarjetaAccion: {
    width: "48%",
    backgroundColor: COLORES.primario,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    height: 120,
    overflow: "hidden",
  },
  tituloAccion: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
    marginTop: 10,
  },

  textoVacio: {
    color: COLORES.textoGris,
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  marcaAgua: { position: "absolute", right: -20, bottom: -20 },
});
