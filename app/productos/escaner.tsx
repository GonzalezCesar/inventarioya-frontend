import { useTheme } from "../../contexts/ContextTheme";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  DeviceEventEmitter,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router"; // 🔥 Importamos useLocalSearchParams
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function PantallaEscaner() {
  const router = useRouter();
  // 🔥 Leemos de dónde venimos
  const { origen } = useLocalSearchParams();

  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const scannerLock = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setCameraReady(true), 500);
    return () => {
      clearTimeout(timeout);
      setTorch(false);
    };
  }, []);

  const manejarEscaneo = ({ data }: { data: string }) => {
    if (escaneado || scannerLock.current) return;

    scannerLock.current = true;
    setEscaneado(true);

    // 🔥 Si venimos de la pantalla de VENTAS, agregamos instantáneamente sin preguntar
    if (origen === "ventas") {
      DeviceEventEmitter.emit("onCodigoEscaneado", data);
      router.back();
      return;
    }

    // Si venimos de crear/editar un producto, mostramos la alerta por seguridad
    Alert.alert("Código Escaneado", `Código: ${data}`, [
      {
        text: "Escanear Otro",
        onPress: () => {
          scannerLock.current = false;
          setEscaneado(false);
        },
      },
      {
        text: "Usar este código",
        onPress: () => {
          DeviceEventEmitter.emit("onCodigoEscaneado", data);
          router.back();
        },
      },
    ]);
  };

  const toggleTorch = () => setTorch((prev) => !prev);
  const changeZoom = (delta: number) =>
    setZoom((prev) => Math.min(Math.max(prev + delta, 0), 1));

  if (!permission) {
    return (
      <View style={estilos.contenedorCarga}>
        <Text style={estilos.textoCarga}>Cargando cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={estilos.contenedorPermiso}>
        <FontAwesome5
          name="camera"
          size={50}
          color={colores.textoGris}
          style={{ marginBottom: 20 }}
        />
        <Text style={estilos.textoPermiso}>
          Se requiere acceso a la cámara para escanear productos.
        </Text>
        <TouchableOpacity
          style={estilos.botonPermiso}
          onPress={requestPermission}
        >
          <Text style={estilos.textoBotonPermiso}>Conceder Permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.botonCancelar}
          onPress={() => router.back()}
        >
          <Text style={estilos.textoCancelar}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      {cameraReady ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          zoom={zoom}
          enableTorch={torch}
          onBarcodeScanned={escaneado ? undefined : manejarEscaneo}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "black" }]} />
      )}

      <View style={estilos.uiOverlay}>
        <View style={estilos.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={estilos.botonIcono}
          >
            <FontAwesome5 name="chevron-left" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={estilos.controlesSuperiores}>
            <TouchableOpacity
              onPress={() => changeZoom(-0.1)}
              style={estilos.botonIcono}
            >
              <FontAwesome5 name="minus" size={16} color="#FFF" />
            </TouchableOpacity>

            <View style={estilos.indicadorZoom}>
              <Text style={estilos.textoZoom}>{(zoom * 100).toFixed(0)}%</Text>
            </View>

            <TouchableOpacity
              onPress={() => changeZoom(0.1)}
              style={[estilos.botonIcono, { marginRight: 15 }]}
            >
              <FontAwesome5 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleTorch}
              style={[estilos.botonIcono, torch && estilos.botonIconoActivo]}
            >
              <FontAwesome5
                name="bolt"
                size={16}
                color={torch ? colores.textoOscuro : "#FFF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.centro}>
          <View style={estilos.marco} />
          <View style={estilos.instruccionContainer}>
            <Text style={estilos.instruccion}>
              Centra el código de barras en el recuadro
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: "black" },
    contenedorCarga: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.fondoOscuro,
    },
    textoCarga: { color: c.textoBlanco },
    contenedorPermiso: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.fondoOscuro,
      padding: 20,
    },
    textoPermiso: {
      color: c.textoBlanco,
      textAlign: "center",
      marginBottom: 30,
      fontSize: 16,
    },
    botonPermiso: {
      backgroundColor: c.primario,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 12,
      marginBottom: 20,
    },
    textoBotonPermiso: {
      color: c.textoOscuro,
      fontWeight: "bold",
      fontSize: 16,
    },
    botonCancelar: { padding: 15 },
    textoCancelar: { color: c.textoGris, fontSize: 16 },
    uiOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "space-between",
      paddingVertical: 50,
      zIndex: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      alignItems: "center",
      paddingTop: 20,
    },
    botonIcono: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 5,
    },
    botonIconoActivo: { backgroundColor: c.primario },
    controlesSuperiores: { flexDirection: "row", alignItems: "center" },
    indicadorZoom: {
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    textoZoom: { color: "white", fontSize: 12, fontWeight: "bold" },
    centro: { alignItems: "center", justifyContent: "center", flex: 1 },
    marco: {
      width: width * 0.7,
      height: width * 0.7,
      borderWidth: 3,
      borderColor: c.primario,
      borderRadius: 20,
      backgroundColor: "transparent",
    },
    instruccionContainer: {
      marginTop: 30,
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    instruccion: { color: "white", textAlign: "center", fontWeight: "bold" },
  });
