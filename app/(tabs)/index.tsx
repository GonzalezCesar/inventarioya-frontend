import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router"; // <-- IMPORTANTE: useFocusEffect
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
};

export default function PantallaDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // 🕵️ TRUCO DE DEBUGGING: Esto imprimirá en tu terminal los datos reales de tu usuario
  console.log("DATOS DEL USUARIO LOGUEADO:", user);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [datos, setDatos] = useState<any>(null);

  const cargarDatos = async () => {
    try {
      const esSuper = user?.rol?.toLowerCase() === "superadmin";
      const endpoint = esSuper ? "/admin/dashboard" : "/dashboard";

      const respuesta: any = await api.get(endpoint);
      setDatos(respuesta);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  // 🔥 MAGIA AQUÍ: useFocusEffect hace que se recargue CADA VEZ que entras a esta pestaña
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [user]), // Le pasamos 'user' por si cambia de sesión
  );

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarDatos();
  }, []);

  const formatearMoneda = (monto: any) => {
    const num = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$ ${(num || 0).toFixed(2)}`;
  };

  if (cargando && !refrescando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        // 🔥 SOLUCIÓN ANDROID: paddingBottom 100 para que nada quede debajo del TabBar
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Platform.OS === "android" ? 120 : 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={COLORES.primario}
          />
        }
      >
        {/* ENCABEZADO */}
        <View style={estilos.encabezado}>
          <Text style={estilos.saludo}>Hola, {user?.nombre || "Usuario"}</Text>
          {/* Mostramos el rol exacto que manda la BD */}
          <Text style={estilos.rol}>{user?.rol || "Sin Rol Definido"}</Text>
        </View>

        {/* RESUMEN DE HOY */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Resumen</Text>
          <View style={estilos.tarjetaPrincipal}>
            <View style={{ zIndex: 1 }}>
              <Text style={estilos.tituloTarjetaPrincipal}>VENTAS DE HOY</Text>
              <Text style={estilos.valorTarjetaPrincipal}>
                {formatearMoneda(datos?.ventas_hoy)}
              </Text>
              <Text style={estilos.subtituloTarjetaPrincipal}>
                {datos?.cantidad_ventas || 0} ventas realizadas
              </Text>
            </View>
            <FontAwesome5
              name="dollar-sign"
              size={100}
              color="rgba(0,0,0,0.1)"
              style={estilos.marcaAgua}
            />
          </View>

          <View style={estilos.fila}>
            <View style={estilos.tarjetaPequena}>
              <Text style={estilos.tituloTarjetaPequena}>POR COBRAR</Text>
              <Text style={estilos.valorTarjetaPequena}>
                {formatearMoneda(datos?.por_cobrar)}
              </Text>
            </View>
            <View
              style={[
                estilos.tarjetaPequena,
                {
                  borderColor:
                    datos?.stock_bajo > 0 ? "#FF3B30" : COLORES.borde,
                },
              ]}
            >
              <Text
                style={[
                  estilos.tituloTarjetaPequena,
                  datos?.stock_bajo > 0 && { color: "#FF3B30" },
                ]}
              >
                STOCK BAJO
              </Text>
              <Text
                style={[
                  estilos.valorTarjetaPequena,
                  datos?.stock_bajo > 0 && { color: "#FF3B30" },
                ]}
              >
                {datos?.stock_bajo || 0}
              </Text>
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
                size={24}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Nueva Venta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/productos/escaner")}
            >
              <FontAwesome5
                name="camera"
                size={24}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Escanear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/(tabs)/inventario")}
            >
              <FontAwesome5 name="box" size={24} color={COLORES.textoOscuro} />
              <Text style={estilos.tituloAccion}>Productos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.tarjetaAccion}
              onPress={() => router.push("/(tabs)/reportes")}
            >
              <FontAwesome5
                name="chart-bar"
                size={24}
                color={COLORES.textoOscuro}
              />
              <Text style={estilos.tituloAccion}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVIDAD RECIENTE */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Actividad Reciente</Text>
          {datos?.recientes && datos.recientes.length > 0 ? (
            datos.recientes.map((item: any, index: number) => (
              <View key={index} style={estilos.itemReciente}>
                <View style={estilos.iconoReciente}>
                  <FontAwesome5
                    name="shopping-cart"
                    size={16}
                    color={COLORES.primario}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={estilos.textoReciente}>
                    Venta #{item.id.substring(0, 8)}
                  </Text>
                  <Text style={estilos.fechaReciente}>
                    {new Date(item.fecha).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={estilos.montoReciente}>
                  {formatearMoneda(item.monto)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={estilos.textoVacio}>
              No hay ventas registradas hoy.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  encabezado: { marginTop: 40, marginBottom: 20 },
  saludo: { fontSize: 28, fontWeight: "bold", color: COLORES.textoBlanco },
  rol: { fontSize: 16, color: COLORES.primario, textTransform: "capitalize" },

  seccion: { marginBottom: 25 },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginBottom: 15,
  },

  tarjetaPrincipal: {
    backgroundColor: COLORES.primario,
    padding: 25,
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
  marcaAgua: { position: "absolute", right: -10, bottom: -20 },

  fila: { flexDirection: "row", justifyContent: "space-between" },
  tarjetaPequena: {
    width: "48%",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  tituloTarjetaPequena: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORES.primario,
    letterSpacing: 1,
    marginBottom: 5,
  },
  valorTarjetaPequena: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
  },

  gridAcciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  tarjetaAccion: {
    width: "48%",
    backgroundColor: COLORES.primario,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    marginBottom: 5,
  },
  tituloAccion: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
    marginTop: 10,
  },

  itemReciente: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  iconoReciente: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  textoReciente: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  fechaReciente: { color: COLORES.textoGris, fontSize: 12, marginTop: 2 },
  montoReciente: { color: COLORES.primario, fontWeight: "bold", fontSize: 18 },
  textoVacio: {
    color: COLORES.textoGris,
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
});
