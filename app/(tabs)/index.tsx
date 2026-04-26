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
import api from "../../services/api";

export default function PantallaDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

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

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [user]),
  );

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarDatos();
  }, []);

  const formatearMoneda = (monto: any) => {
    const num = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$ ${(num || 0).toFixed(2)}`;
  };

  // Matriz de acciones rápidas para replicar el mapeo de tu app original
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
        {/* ENCABEZADO */}
        <View style={estilos.encabezado}>
          <Text style={estilos.saludo}>Hola, {user?.nombre || "Usuario"}</Text>
          <Text style={estilos.rol}>
            {user?.rol?.toLowerCase() === "superadmin"
              ? "Superadministrador"
              : user?.rol?.toLowerCase() === "administrador" || user?.rol?.toLowerCase() === "admin"
              ? "Administrador"
              : "Vendedor"}
          </Text>
        </View>

        {/* RESUMEN DE HOY */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Resumen</Text>

          <View style={estilos.tarjetaPrincipal}>
            {/* Marca de agua gigante de la tarjeta principal */}
            <FontAwesome5
              name="dollar-sign"
              size={120}
              color="rgba(0,0,0,0.1)"
              style={estilos.marcaAguaPrincipal}
            />
            <View style={{ zIndex: 1 }}>
              <Text style={estilos.tituloTarjetaPrincipal}>VENTAS DE HOY</Text>
              <Text style={estilos.valorTarjetaPrincipal}>
                {formatearMoneda(datos?.ventas_hoy)}
              </Text>
              <Text style={estilos.subtituloTarjetaPrincipal}>
                {datos?.cantidad_ventas || 0} ventas realizadas
              </Text>
            </View>
          </View>

          <View style={estilos.fila}>
            {/* Tarjeta Por Cobrar */}
            <TouchableOpacity
              style={estilos.tarjetaPequena}
              onPress={() => router.push("/(tabs)/reportes")}
              activeOpacity={0.8}
            >
              <View style={estilos.encabezadoTarjetaPequena}>
                <Text style={estilos.tituloTarjetaPequena}>POR COBRAR</Text>
              </View>
              <Text style={estilos.valorTarjetaPequena}>
                {formatearMoneda(datos?.por_cobrar)}
              </Text>
            </TouchableOpacity>

            {/* Tarjeta Stock Bajo */}
            <View
              style={[
                estilos.tarjetaPequena,
                {
                  borderColor:
                    datos?.stock_bajo > 0 ? colores.error : colores.primario,
                },
              ]}
            >
              <View style={estilos.encabezadoTarjetaPequena}>
                <Text
                  style={[
                    estilos.tituloTarjetaPequena,
                    datos?.stock_bajo > 0 && { color: colores.error },
                  ]}
                >
                  STOCK BAJO
                </Text>
              </View>
              <Text
                style={[
                  estilos.valorTarjetaPequena,
                  datos?.stock_bajo > 0 && { color: colores.error },
                ]}
              >
                {datos?.stock_bajo || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* ACCIONES RÁPIDAS (Restauradas al diseño original) */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Acciones Rápidas</Text>
          <View style={estilos.gridAcciones}>
            {accionesRapidas.map((accion, index) => (
              <TouchableOpacity
                key={index}
                style={estilos.tarjetaAccion}
                onPress={() => router.push(accion.ruta as any)}
                activeOpacity={0.8}
              >
                {/* 💧 Marca de agua (Restaurada de tu código original) */}
                <View style={estilos.marcaAguaAccion}>
                  <FontAwesome5
                    name={accion.icono}
                    size={100}
                    color="rgba(0,0,0,0.08)"
                  />
                </View>

                {/* Contenido Frontal */}
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

        {/* ACTIVIDAD RECIENTE */}
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Actividad Reciente</Text>
          {datos?.recientes && datos.recientes.length > 0 ? (
            datos.recientes.map((item: any, index: number) => (
              <View key={index} style={estilos.itemActividad}>
                <View style={estilos.iconoActividad}>
                  <FontAwesome5
                    name={item.accion === "Conexión" ? "user-clock" : "dollar-sign"}
                    size={16}
                    color={colores.textoResaltado}
                  />
                </View>
                <View style={estilos.infoActividad}>
                  <Text style={estilos.textoActividad} numberOfLines={1}>
                    {/* 🔥 Magia aquí: Si tiene ID, es una venta de tienda. Si no, es actividad de Superadmin */}
                    {item.id 
                      ? `Venta #${item.id.substring(0, 8)}` 
                      : `${item.accion} • ${item.nombre || item.email}`}
                  </Text>
                  <Text style={estilos.subtextoActividad}>
                    {new Date(item.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                
                {/* 🔥 Solo renderizamos el monto si realmente existe en el JSON */}
                {item.monto !== undefined && (
                  <Text style={estilos.montoActividad}>
                    {formatearMoneda(item.monto)}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={estilos.textoVacio}>
              No hay actividad reciente.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// 🔥 ESTILOS DINÁMICOS Y PIXEL PERFECT
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
    rol: { fontSize: 16, color: c.textoResaltado, textTransform: "capitalize" }, // Verde oscuro para el rol

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
      transform: [{ rotate: "-15deg" }], // Rotación original
    },
    tituloTarjetaPrincipal: {
      fontSize: 12,
      fontWeight: "bold",
      color: c.textoOscuro,
      letterSpacing: 1,
      marginBottom: 8,
    },
    valorTarjetaPrincipal: {
      fontSize: 48, // Un poco más grande para igualar la imagen
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
      borderWidth: 2, // Borde más grueso como en el original
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
      height: 120, // Altura original
      overflow: "hidden", // Crucial para que la marca de agua no se salga
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
      transform: [{ rotate: "-15deg" }], // Rotación original de la marca de agua
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
      backgroundColor: "rgba(212, 255, 0, 0.1)", // Secundario Claro
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    infoActividad: {
      flex: 1,
    },
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
