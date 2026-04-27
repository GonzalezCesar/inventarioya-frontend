import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useTheme } from "../../contexts/ContextTheme";
import { useTasa } from "../../contexts/ContextTasa"; // 🔥 Importamos el contexto de la tasa
import api from "../../services/api";

export default function PantallaDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores } = useTheme();

  // 🔥 Extraemos la tasa y la función de actualizar. Le ponemos el alias 'cargandoTasa'
  const { tasaBCV, cargando: cargandoTasa, actualizarTasa } = useTasa();

  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [datos, setDatos] = useState<any>(null);

  const esSuperAdmin = user?.rol?.toLowerCase() === "superadmin";

  const cargarDatos = async () => {
    try {
      const respuesta: any = await api.get("/dashboard");
      setDatos(respuesta);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [user]),
  );

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarDatos();
    actualizarTasa(); // 🔥 Si el usuario jala la pantalla hacia abajo, también refresca la tasa
  }, [user, actualizarTasa]);

  const formatearMoneda = (monto: any) => {
    const num = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$ ${(num || 0).toFixed(2)}`;
  };

  const accionesRapidas = [
    { titulo: "Nueva Venta", icono: "dollar-sign", ruta: "/(tabs)/vender" },
    { titulo: "Escanear", icono: "camera", ruta: "/productos/escaner" },
    { titulo: "Productos", icono: "cube", ruta: "/(tabs)/inventario" },
    { titulo: "Reportes", icono: "chart-bar", ruta: "/(tabs)/reportes" },
  ];

  if (cargando && !refrescando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Platform.OS === "android" ? 120 : 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={colores.primario}
          />
        }
      >
        <View style={estilos.encabezado}>
          <Text style={estilos.saludo}>Hola, {user?.nombre || "Usuario"}</Text>
          <Text style={estilos.rol}>
            {esSuperAdmin
              ? "Superadmin"
              : user?.rol?.toLowerCase() === "administrador" ||
                  user?.rol?.toLowerCase() === "admin"
                ? "Administrador"
                : "Vendedor"}
          </Text>
        </View>

        {/* RESUMEN DE MI TIENDA */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Resumen</Text>
          <View style={estilos.tarjetaPrincipal}>
            <FontAwesome5
              name="dollar-sign"
              size={120}
              color="rgba(0,0,0,0.1)"
              style={estilos.marcaAguaPrincipal}
            />
            <View style={{ zIndex: 1 }}>
              {/* 🔥 Cambiamos a VENTAS DEL MES según el nuevo backend */}
              <Text style={estilos.tituloTarjetaPrincipal}>VENTAS DEL MES</Text>
              <Text style={estilos.valorTarjetaPrincipal}>
                {formatearMoneda(datos?.ventas_plataforma)}
              </Text>
              <Text style={estilos.subtituloTarjetaPrincipal}>
                {datos?.ventas_por_dia?.length || 0} días con ventas este mes
              </Text>
            </View>
          </View>

          <View style={estilos.fila}>
            {/* 🔥 Cambiamos "Por Cobrar" a "Clientes" */}
            <TouchableOpacity
              style={estilos.tarjetaPequena}
              onPress={() => router.push("/(tabs)/reportes")} // O a donde quieras llevarlos
            >
              <View style={estilos.encabezadoTarjetaPequena}>
                <Text style={estilos.tituloTarjetaPequena}>CLIENTES</Text>
              </View>
              <Text style={estilos.valorTarjetaPequena}>
                {datos?.total_clientes || 0}
              </Text>
            </TouchableOpacity>

            {/* 🔥 Adaptamos Stock Bajo para leer el tamaño del nuevo array */}
            <View
              style={[
                estilos.tarjetaPequena,
                {
                  borderColor:
                    (datos?.productos_low_stock?.length || 0) > 0 ? colores.error : colores.primario,
                },
              ]}
            >
              <View style={estilos.encabezadoTarjetaPequena}>
                <Text
                  style={[
                    estilos.tituloTarjetaPequena,
                    (datos?.productos_low_stock?.length || 0) > 0 && { color: colores.error },
                  ]}
                >
                  STOCK BAJO
                </Text>
              </View>
              <Text
                style={[
                  estilos.valorTarjetaPequena,
                  (datos?.productos_low_stock?.length || 0) > 0 && { color: colores.error },
                ]}
              >
                {datos?.productos_low_stock?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* 🔥 TARJETA DE TASA DE CAMBIO */}
        <View style={estilos.tarjetaTasa}>
          <View style={estilos.infoTasa}>
            <Text style={estilos.tituloTasa}>TASA OFICIAL BCV</Text>
            <Text style={estilos.valorTasa}>
              {cargandoTasa ? "Cargando..." : `Bs. ${tasaBCV.toFixed(2)}`}
            </Text>
          </View>
          <TouchableOpacity
            style={estilos.botonRefrescarTasa}
            onPress={actualizarTasa}
            disabled={cargandoTasa}
          >
            <FontAwesome5
              name="sync-alt"
              size={22}
              color={colores.textoOscuro}
              style={cargandoTasa ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>

        {/* ACCIONES RÁPIDAS */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Acciones Rápidas</Text>
          <View style={estilos.gridAcciones}>
            {accionesRapidas.map((accion, index) => (
              <TouchableOpacity
                key={index}
                style={estilos.tarjetaAccion}
                onPress={() => router.push(accion.ruta as any)}
              >
                <View style={estilos.marcaAguaAccion}>
                  <FontAwesome5
                    name={accion.icono}
                    size={100}
                    color="rgba(0,0,0,0.08)"
                  />
                </View>
                <View style={estilos.contenidoAccion}>
                  <FontAwesome5
                    name={accion.icono}
                    size={38}
                    color={colores.textoOscuro}
                  />
                  <Text style={estilos.tituloAccion}>{accion.titulo}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ACTIVIDAD RECIENTE DE LA TIENDA */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Actividad Reciente</Text>
          {datos?.recientes && datos.recientes.length > 0 ? (
            datos.recientes.map((item: any, index: number) => (
              <View key={index} style={estilos.itemActividad}>
                <View style={estilos.iconoActividad}>
                  <FontAwesome5
                    name="dollar-sign"
                    size={16}
                    color={colores.textoResaltado}
                  />
                </View>
                <View style={estilos.infoActividad}>
                  {/* 🔥 Quitamos el ID porque el nuevo backend no lo manda */}
                  <Text style={estilos.textoActividad} numberOfLines={1}>
                    {item.tipo || "Venta registrada"}
                  </Text>
                  <Text style={estilos.subtextoActividad}>
                    {new Date(item.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <Text style={estilos.montoActividad}>
                  {formatearMoneda(item.monto)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={estilos.textoVacio}>No hay ventas recientes.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    encabezado: { marginTop: 30, marginBottom: 20 },
    saludo: {
      fontSize: 28,
      fontWeight: "bold",
      color: c.textoBlanco,
      marginBottom: 4,
    },
    rol: { fontSize: 16, color: c.textoResaltado, textTransform: "capitalize" },
    seccion: { marginBottom: 30 },
    tituloSeccion: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.textoBlanco,
      marginBottom: 15,
    },
    tarjetaPrincipal: {
      backgroundColor: c.primario,
      padding: 25,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 15,
      minHeight: 140,
      justifyContent: "center",
    },
    marcaAguaPrincipal: {
      position: "absolute",
      right: -10,
      bottom: -20,
      transform: [{ rotate: "-15deg" }],
    },
    tituloTarjetaPrincipal: {
      fontSize: 12,
      fontWeight: "bold",
      color: c.textoOscuro,
      letterSpacing: 1,
      marginBottom: 8,
    },
    valorTarjetaPrincipal: {
      fontSize: 48,
      fontWeight: "900",
      color: c.textoOscuro,
      marginBottom: 4,
    },
    subtituloTarjetaPrincipal: { fontSize: 14, color: c.textoOscuro },
    fila: { flexDirection: "row", justifyContent: "space-between", gap: 15 },
    tarjetaPequena: {
      flex: 1,
      backgroundColor: c.fondoTarjeta,
      padding: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: c.primario,
      minHeight: 110,
      justifyContent: "center",
    },
    encabezadoTarjetaPequena: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 6,
    },
    tituloTarjetaPequena: {
      fontSize: 12,
      fontWeight: "bold",
      color: c.textoResaltado,
      letterSpacing: 1,
    },
    valorTarjetaPequena: {
      fontSize: 36,
      fontWeight: "900",
      color: c.textoResaltado,
    },

    // 🔥 Estilos de la Tasa
    tarjetaTasa: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(198, 255, 0, 0.2)",
      marginBottom: 30,
    },
    infoTasa: { flex: 1 },
    tituloTasa: {
      fontSize: 12,
      fontWeight: "bold",
      color: c.textoGris,
      letterSpacing: 1,
      marginBottom: 5,
    },
    valorTasa: { fontSize: 28, fontWeight: "900", color: c.textoBlanco },
    botonRefrescarTasa: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: c.primario,
      justifyContent: "center",
      alignItems: "center",
    },

    gridAcciones: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 15,
    },
    tarjetaAccion: {
      width: "47%",
      backgroundColor: c.primario,
      borderRadius: 20,
      height: 120,
      overflow: "hidden",
    },
    contenidoAccion: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      gap: 10,
      zIndex: 1,
    },
    tituloAccion: {
      fontSize: 16,
      fontWeight: "bold",
      color: c.textoOscuro,
      textAlign: "center",
    },
    marcaAguaAccion: {
      position: "absolute",
      right: -25,
      bottom: -25,
      transform: [{ rotate: "-15deg" }],
    },
    itemActividad: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
    },
    iconoActividad: {
      width: 45,
      height: 45,
      borderRadius: 12,
      backgroundColor: "rgba(212, 255, 0, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    infoActividad: { flex: 1 },
    textoActividad: {
      color: c.textoBlanco,
      fontWeight: "bold",
      fontSize: 15,
      marginBottom: 2,
    },
    subtextoActividad: { color: c.textoGris, fontSize: 13 },
    montoActividad: {
      color: c.textoResaltado,
      fontWeight: "900",
      fontSize: 18,
    },
    textoVacio: {
      color: c.textoGris,
      textAlign: "center",
      padding: 20,
      fontSize: 16,
    },
  });
