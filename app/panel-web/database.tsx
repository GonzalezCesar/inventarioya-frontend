import { useFocusEffect } from "expo-router";
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
import api from "../../services/api";

// 🔥 Añadidas todas las tablas del sistema
type TablaDisponibles =
  | "usuarios"
  | "productos"
  | "ventas"
  | "categorias"
  | "clientes"
  | "proveedores"
  | "venta_items"
  | "movimientos_inventario"
  | "caja"
  | "movimientos_caja"
  | "configuraciones"
  | "configuraciones_empresas"
  | "planes";

export default function DatabaseExplorerWeb() {
  const [cargando, setCargando] = useState(false);
  const [tablaActual, setTablaActual] = useState<TablaDisponibles>("usuarios");
  const [datosTabla, setDatosTabla] = useState<any[]>([]);

  // 🔥 Lista completa actualizada según el README de la API
  const tablas: { id: TablaDisponibles; label: string }[] = [
    { id: "usuarios", label: "Usuarios / Claves" },
    { id: "productos", label: "Productos" },
    { id: "ventas", label: "Ventas" },
    { id: "venta_items", label: "Ventas (Items)" },
    { id: "categorias", label: "Categorías" },
    { id: "clientes", label: "Clientes" },
    { id: "proveedores", label: "Proveedores" },
    { id: "movimientos_inventario", label: "Kardex / Mov. Inv." },
    { id: "caja", label: "Cierres de Caja" },
    { id: "movimientos_caja", label: "Mov. Caja" },
    { id: "planes", label: "Planes SaaS" },
    { id: "configuraciones", label: "Config. Globales" },
    { id: "configuraciones_empresas", label: "Config. de Negocios" },
  ];

  useFocusEffect(
    useCallback(() => {
      cargarTabla(tablaActual);
    }, [tablaActual]),
  );

  const cargarTabla = async (tabla: TablaDisponibles) => {
    try {
      setCargando(true);
      const res: any = await api.get(`/superadmin?table=${tabla}`);
      setDatosTabla(res || []);
    } catch (error) {
      console.error(`Error cargando la tabla ${tabla}:`, error);
      Alert.alert("Error", `No se pudo cargar la tabla ${tabla}`);
    } finally {
      setCargando(false);
    }
  };

  const renderizarCelda = (key: string, valor: any) => {
    if (valor === null || valor === undefined) return "-";

    // Si es la contraseña, la acortamos y le damos estilo de "código"
    if (key === "password_hash") {
      return (
        <View style={estilos.codigoBadge}>
          <Text style={estilos.codigoTexto}>
            {String(valor).substring(0, 15)}...
          </Text>
        </View>
      );
    }

    // Si es un total o monto, lo ponemos en verde
    if (
      key === "total" ||
      key === "precio" ||
      key === "costo" ||
      key === "monto_pagado" ||
      key === "monto_restante" ||
      key === "monto_inicial" ||
      key === "monto_final_declarado"
    ) {
      return (
        <Text style={{ color: "#c6ff00", fontWeight: "bold" }}>${valor}</Text>
      );
    }

    return (
      <Text style={estilos.tdText} numberOfLines={2}>
        {String(valor)}
      </Text>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Explorador de Datos (Developer)</Text>
          <Text style={estilos.subtitulo}>
            Auditoría completa de todas las tablas del sistema.
          </Text>
        </View>
      </View>

      {/* PESTAÑAS DE TABLAS - Scroll Horizontal para las 13 tablas */}
      <View style={estilos.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ gap: 15, paddingBottom: 15 }}
        >
          {tablas.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                estilos.tabBtn,
                tablaActual === tab.id && estilos.tabBtnActive,
              ]}
              onPress={() => setTablaActual(tab.id)}
            >
              <Text
                style={[
                  estilos.tabText,
                  tablaActual === tab.id && estilos.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENEDOR DE LA TABLA */}
      <View style={estilos.tableContainer}>
        {cargando ? (
          <View style={{ padding: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#c6ff00" />
            <Text style={{ color: "#8a8a8a", marginTop: 10 }}>
              Consultando base de datos...
            </Text>
          </View>
        ) : datosTabla.length === 0 ? (
          <View style={{ padding: 50, alignItems: "center" }}>
            <Text style={{ color: "#8a8a8a", fontSize: 16 }}>
              No hay datos en la tabla "{tablaActual}".
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={{ flex: 1 }}
          >
            <View>
              {/* CABECERAS DINÁMICAS */}
              <View style={estilos.tableHead}>
                {Object.keys(datosTabla[0]).map((key, index) => (
                  <View key={index} style={estilos.thCell}>
                    <Text style={estilos.thText}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* FILAS DINÁMICAS */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: "70vh" }}
              >
                {datosTabla.map((row, rowIndex) => (
                  <View key={rowIndex} style={estilos.tableRow}>
                    {Object.keys(datosTabla[0]).map((key, colIndex) => (
                      <View key={colIndex} style={estilos.tdCell}>
                        {renderizarCelda(key, row[key])}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#0d110d",
    padding: 30,
  },
  header: {
    marginBottom: 30,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitulo: {
    fontSize: 15,
    color: "#8a8a8a",
    marginTop: 5,
  },
  tabsContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 255, 0, 0.1)",
    paddingBottom: 5,
  },
  tabBtn: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  tabBtnActive: {
    backgroundColor: "#c6ff00",
    borderColor: "#c6ff00",
  },
  tabText: {
    color: "#8a8a8a",
    fontWeight: "bold",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#000000",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  thCell: {
    width: 220, 
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "center",
  },
  thText: {
    color: "#8a8a8a",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  tdCell: {
    width: 220, 
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "center",
  },
  tdText: {
    color: "#e0e0e0",
    fontSize: 13,
  },
  codigoBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.3)",
    alignSelf: "flex-start",
  },
  codigoTexto: {
    color: "#c6ff00",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});