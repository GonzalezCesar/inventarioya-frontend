import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../contexts/ContextAuth";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";

export default function PantallaSuperadmin() {
  const { user } = useAuth();
  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [datosGlobales, setDatosGlobales] = useState<any>(null);

  const cargarDatos = async () => {
    try {
      const respuesta: any = await api.get("/admin/dashboard");
      setDatosGlobales(respuesta);
    } catch (error) {
      console.error("Error cargando panel de superadmin:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
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
          <Text style={estilos.tituloPrincipal}>Panel Global</Text>
          <Text style={estilos.subtituloPrincipal}>
            Estadísticas de la plataforma
          </Text>
        </View>

        {/* METRICAS PRINCIPALES */}
        <View style={estilos.gridAcciones}>
          <View
            style={[estilos.tarjetaPequena, { width: "47%", marginBottom: 15 }]}
          >
            <Text style={estilos.tituloTarjetaPequena}>CLIENTES TOTALES</Text>
            <Text style={[estilos.valorTarjetaPequena, { fontSize: 32 }]}>
              {datosGlobales?.total_clientes || 0}
            </Text>
          </View>

          <View
            style={[estilos.tarjetaPequena, { width: "47%", marginBottom: 15 }]}
          >
            <Text style={estilos.tituloTarjetaPequena}>ACTIVOS HOY</Text>
            <Text style={[estilos.valorTarjetaPequena, { fontSize: 32 }]}>
              {datosGlobales?.activos_hoy || 0}
            </Text>
          </View>

          <View
            style={[
              estilos.tarjetaPequena,
              { width: "47%", borderColor: colores.primario },
            ]}
          >
            <Text style={estilos.tituloTarjetaPequena}>VENTAS DEL MES</Text>
            <Text
              style={[
                estilos.valorTarjetaPequena,
                { fontSize: 22, color: colores.subtitulos },
              ]}
              numberOfLines={1}
            >
              {formatearMoneda(datosGlobales?.ventas_plataforma)}
            </Text>
          </View>

          <View
            style={[
              estilos.tarjetaPequena,
              {
                width: "47%",
                borderColor:
                  datosGlobales?.suspendidos > 0
                    ? colores.error
                    : colores.primario,
              },
            ]}
          >
            <Text
              style={[
                estilos.tituloTarjetaPequena,
                datosGlobales?.suspendidos > 0 && { color: colores.error },
              ]}
            >
              SUSPENDIDOS
            </Text>
            <Text
              style={[
                estilos.valorTarjetaPequena,
                { fontSize: 32 },
                datosGlobales?.suspendidos > 0 && { color: colores.error },
              ]}
            >
              {datosGlobales?.suspendidos || 0}
            </Text>
          </View>
        </View>

        {/* ACTIVIDAD RECIENTE GLOBAL */}
        <View style={[estilos.seccion, { marginTop: 30 }]}>
          <Text style={estilos.tituloSeccion}>
            Actividad Reciente (Toda la app)
          </Text>

          {datosGlobales?.recientes && datosGlobales.recientes.length > 0 ? (
            datosGlobales.recientes.map((item: any, index: number) => (
              <View key={index} style={estilos.itemActividad}>
                <View style={estilos.iconoActividad}>
                  <FontAwesome5
                    name={
                      item.accion === "Conexión" ? "user-clock" : "dollar-sign"
                    }
                    size={16}
                    color={colores.textoResaltado}
                  />
                </View>
                <View style={estilos.infoActividad}>
                  <Text style={estilos.textoActividad} numberOfLines={1}>
                    {item.accion} • {item.nombre || item.email}
                  </Text>
                  <Text style={estilos.subtextoActividad}>
                    {new Date(item.fecha).toLocaleDateString()} -{" "}
                    {new Date(item.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={estilos.textoVacio}>No hay actividad reciente.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Estilos base (puedes ajustarlos a tu gusto)
const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    encabezado: { marginTop: 30, marginBottom: 25 },
    tituloPrincipal: {
      fontSize: 28,
      fontWeight: "bold",
      color: c.primario,
      marginBottom: 4,
    },
    subtituloPrincipal: { fontSize: 16, color: c.textoGris },
    seccion: { marginBottom: 30 },
    tituloSeccion: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.textoBlanco,
      marginBottom: 15,
    },
    tarjetaPequena: {
      backgroundColor: c.fondoTarjeta,
      padding: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: c.primario,
      minHeight: 110,
      justifyContent: "center",
    },
    tituloTarjetaPequena: {
      fontSize: 12,
      fontWeight: "bold",
      color: c.textoResaltado,
      letterSpacing: 1,
      marginBottom: 8,
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
    textoVacio: {
      color: c.textoGris,
      textAlign: "center",
      padding: 20,
      fontSize: 16,
    },
  });
