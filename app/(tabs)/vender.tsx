import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL_UPLOADS } from "../../config/env";
import { useAuth } from "../../contexts/ContextAuth";
import { useTasa } from "../../contexts/ContextTasa"; // 🔥 Importamos la Tasa
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";
import { generarYCompartirRecibo } from "../../utils/generadorRecibos";

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
  imagen?: string;
}
interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
interface Cliente {
  id: string;
  nombre: string;
  cedula?: string;
  telefono?: string;
}

export default function PantallaNuevaVenta() {
  const router = useRouter();
  const { user } = useAuth();
  const { colores } = useTheme();

  // 🔥 Sacamos la tasa del contexto
  const { tasaBCV } = useTasa();

  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [productosBD, setProductosBD] = useState<Producto[]>([]);
  const [clientesBD, setClientesBD] = useState<Cliente[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  const [configImpuestos, setConfigImpuestos] = useState({
    cobrarIVA: false,
    tasaIVA: 16,
    cobrarIGTF: false,
    tasaIGTF: 3,
  });

  const [busqueda, setBusqueda] = useState("");
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(
    null,
  );
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");
  const [cedulaCliente, setCedulaCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return [];
    const query = busquedaCliente.toLowerCase();
    return clientesBD.filter(
      (c) =>
        (c.nombre && c.nombre.toLowerCase().includes(query)) ||
        (c.cedula && c.cedula.toLowerCase().includes(query)),
    );
  }, [clientesBD, busquedaCliente]);

  const [modalVisible, setModalVisible] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [montoCreditoInicial, setMontoCreditoInicial] = useState("");

  const [fotoComprobante, setFotoComprobante] = useState<string | null>(null);
  const [faseModal, setFaseModal] = useState<"pago" | "confirmacion" | "exito">(
    "pago",
  );
  const animacionEscala = React.useRef(new Animated.Value(0)).current;
  const [ventaRealizada, setVentaRealizada] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, []),
  );

  useEffect(() => {
    const suscripcion = DeviceEventEmitter.addListener(
      "onCodigoEscaneado",
      (codigo) => {
        const productoEncontrado = productosBD.find(
          (p: any) => p.codigo_barras === codigo || p.sku === codigo,
        );
        if (productoEncontrado) {
          agregarAlCarrito(productoEncontrado);
        } else {
          Alert.alert(
            "No encontrado",
            `No existe ningún producto con el código: ${codigo}`,
          );
        }
      },
    );
    return () => suscripcion.remove();
  }, [productosBD]);

  const cargarDatos = async () => {
    try {
      const [resProds, resClis, resConf]: any = await Promise.all([
        api.get("/productos"),
        api.get("/clientes"),
        api.get("/configuracion").catch(() => ({})),
      ]);
      setProductosBD(resProds || []);
      setClientesBD(resClis || []);

      if (resConf) {
        setConfigImpuestos({
          cobrarIVA:
            resConf.impuestos_habilitados === "1" ||
            resConf.impuestos_habilitados === true,
          tasaIVA: resConf.tasa_iva ? parseFloat(resConf.tasa_iva) : 16,
          cobrarIGTF:
            resConf.igtf_habilitado === "1" || resConf.igtf_habilitado === true,
          tasaIGTF: resConf.tasa_igtf ? parseFloat(resConf.tasa_igtf) : 3,
        });
      }
    } catch (error) {
      console.error("Error cargando DB para POS:", error);
    } finally {
      setCargandoInicial(false);
    }
  };

  const formatearMoneda = (monto: number) =>
    `$ ${Math.abs(monto || 0).toFixed(2)}`;

  // 🔥 FUNCIÓN PARA FORMATEAR BOLÍVARES
  const formatearBs = (montoDolares: number) =>
    `Bs. ${(Math.abs(montoDolares || 0) * tasaBCV).toFixed(2)}`;

  const calcularMontos = () => {
    const subtotalBase = carrito.reduce((sum, item) => sum + item.subtotal, 0);
    const montoIVA = configImpuestos.cobrarIVA
      ? subtotalBase * (configImpuestos.tasaIVA / 100)
      : 0;
    const totalConIVA = subtotalBase + montoIVA;
    const aplicaIGTF = configImpuestos.cobrarIGTF && metodoPago === "efectivo";
    const montoIGTF = aplicaIGTF
      ? totalConIVA * (configImpuestos.tasaIGTF / 100)
      : 0;
    const granTotal = totalConIVA + montoIGTF;
    return { subtotalBase, montoIVA, montoIGTF, granTotal };
  };

  const getImageSource = (imagen?: string) => {
    if (!imagen) return null;
    if (imagen.startsWith("http") || imagen.startsWith("data:"))
      return { uri: imagen };
    return { uri: `${API_URL_UPLOADS}${imagen}` };
  };

  const productosFiltrados = productosBD.filter(
    (p) =>
      (p.nombre?.toLowerCase() || "").includes(busqueda.toLowerCase()) ||
      (p.sku?.toLowerCase() || "").includes(busqueda.toLowerCase()),
  );

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0)
      return Alert.alert("Agotado", "Este producto no tiene stock disponible.");

    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find(
        (item) => item.producto.id === producto.id,
      );

      if (itemExistente) {
        if (itemExistente.cantidad >= producto.stock) {
          Alert.alert("Stock Máximo", `Solo hay ${producto.stock} en stock.`);
          return prevCarrito;
        }
        return prevCarrito.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.producto.precio,
              }
            : item,
        );
      } else {
        return [
          ...prevCarrito,
          { producto, cantidad: 1, subtotal: producto.precio },
        ];
      }
    });

    setBusqueda("");
    setMostrarProductos(false);
  };

  const modificarCantidad = (id: string, delta: number) => {
    const item = carrito.find((i) => i.producto.id === id);
    if (!item) return;
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }
    if (nuevaCantidad > item.producto.stock)
      return Alert.alert("Límite", `Solo hay ${item.producto.stock} en stock.`);

    setCarrito(
      carrito.map((i) =>
        i.producto.id === id
          ? {
              ...i,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * i.producto.precio,
            }
          : i,
      ),
    );
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter((item) => item.producto.id !== id));
  };

  const seleccionarImagen = async () => {
    Alert.alert(
      "Adjuntar Comprobante",
      "¿De dónde quieres obtener la imagen?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Tomar Foto",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted")
              return Alert.alert(
                "Permiso denegado",
                "Necesitamos acceso a tu cámara.",
              );
            const resultado = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
              base64: true,
            });
            if (!resultado.canceled && resultado.assets[0].base64) {
              setFotoComprobante(
                `data:image/jpeg;base64,${resultado.assets[0].base64}`,
              );
            }
          },
        },
        {
          text: "Elegir de Galería",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted")
              return Alert.alert(
                "Permiso denegado",
                "Necesitamos acceso a tu galería.",
              );
            const resultado = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
              base64: true,
            });
            if (!resultado.canceled && resultado.assets[0].base64) {
              setFotoComprobante(
                `data:image/jpeg;base64,${resultado.assets[0].base64}`,
              );
            }
          },
        },
      ],
    );
  };

  const abrirModalPago = () => {
    if (carrito.length === 0) return;
    setFaseModal("pago");
    setMontoRecibido("");
    setMontoCreditoInicial("");
    setFotoComprobante(null);
    setMetodoPago("efectivo");
    setMostrarNuevoCliente(false);
    setBusquedaCliente("");
    setModalVisible(true);
  };

  const crearClienteRapido = async () => {
    if (!nombreCliente.trim()) {
      Alert.alert("Error", "El nombre del cliente es obligatorio");
      return;
    }

    const cedulaLimpia = cedulaCliente.trim();

    // 1. Validar que no esté vacía
    if (!cedulaLimpia) {
      Alert.alert(
        "Cédula Requerida",
        "Por favor ingresa la Cédula de Identidad (C.I.) para registrar al cliente.",
      );
      return;
    }

    // 🔥 2. NUEVA VALIDACIÓN: Mínimo 8 dígitos
    if (cedulaLimpia.length < 8) {
      Alert.alert(
        "Cédula Inválida",
        "La Cédula de Identidad debe tener al menos 8 dígitos.",
      );
      return;
    }

    setCargando(true);
    try {
      const payload = {
        nombre: nombreCliente.trim(),
        cedula: cedulaLimpia,
        telefono: telefonoCliente.trim() || undefined,
      };

      const response: any = await api.post("/clientes", payload);

      await cargarDatos();

      if (response && response.id) {
        setClienteSeleccionado(response.id);
      }

      setMostrarNuevoCliente(false);
      setNombreCliente("");
      setCedulaCliente("");
      setTelefonoCliente("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear el cliente");
    } finally {
      setCargando(false);
    }
  };

  const procesarVenta = async () => {
    const { subtotalBase, montoIVA, montoIGTF, granTotal } = calcularMontos();
    const recibidoFloat =
      parseFloat(montoRecibido.replace(",", ".")) || granTotal;

    if (
      metodoPago === "efectivo" &&
      montoRecibido &&
      recibidoFloat < granTotal
    ) {
      return Alert.alert(
        "Error",
        "El dinero recibido no alcanza para cubrir el total.",
      );
    }

    setCargando(true);
    try {
      const tzOffset = new Date().getTimezoneOffset() * 60000;
      const fechaLocalMySQL = new Date(Date.now() - tzOffset)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const payload: any = {
        fecha: fechaLocalMySQL,
        clienteId: clienteSeleccionado,
        total: granTotal,
        subtotal: subtotalBase,
        montoIVA: montoIVA,
        montoIGTF: montoIGTF,
        metodoPago: metodoPago,
        montoPagado:
          metodoPago === "credito"
            ? parseFloat(montoCreditoInicial) || 0
            : recibidoFloat,
        estadoPago: metodoPago === "credito" ? "pendiente" : "completo",
        items: carrito.map((item) => ({
          productoId: item.producto.id,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

      if (metodoPago === "pago_movil" && fotoComprobante) {
        payload.fotoComprobante = fotoComprobante;
      }

      const response: any = await api.post("/ventas", payload);

      setVentaRealizada({
        ...payload,
        id: response?.id || Date.now().toString(),
        clienteNombre: clienteSeleccionado
          ? clientesBD.find((c) => c.id === clienteSeleccionado)?.nombre
          : "Mostrador",
      });

      setFaseModal("exito");
      Animated.spring(animacionEscala, {
        toValue: 1,
        friction: 8,
        tension: 30,
        useNativeDriver: true,
      }).start();

      setCarrito([]);
      setClienteSeleccionado(null);
      cargarDatos();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error procesando venta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      {cargandoInicial && (
        <View style={estilos.loadingOverlay}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      )}

      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Nueva Venta</Text>
        <TouchableOpacity
          style={estilos.botonEscanear}
          onPress={() =>
            router.push({
              pathname: "/productos/escaner",
              params: { origen: "ventas" },
            })
          }
        >
          <FontAwesome5 name="camera" size={16} color={colores.textoOscuro} />
          <Text style={estilos.textoBotonEscanear}>Escanear</Text>
        </TouchableOpacity>
      </View>

      <View style={{ zIndex: 999 }}>
        <View style={estilos.barraBusqueda}>
          <FontAwesome5 name="search" size={18} color={colores.textoGris} />
          <TextInput
            style={estilos.inputBusqueda}
            placeholder="Buscar producto..."
            placeholderTextColor={colores.textoGris}
            value={busqueda}
            onChangeText={(text) => {
              setBusqueda(text);
              setMostrarProductos(text.length > 0);
            }}
          />
        </View>

        {mostrarProductos && busqueda.length > 0 && (
          <View style={estilos.listaProductos}>
            <FlatList
              data={productosFiltrados}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const source = getImageSource(item.imagen);
                return (
                  <TouchableOpacity
                    style={estilos.itemProductoBusqueda}
                    onPress={() => agregarAlCarrito(item)}
                  >
                    {source ? (
                      <Image source={source} style={estilos.imagenBusqueda} />
                    ) : (
                      <View style={estilos.placeholderBusqueda}>
                        <FontAwesome5 name="box" color={colores.textoGris} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={estilos.nombreProductoBusqueda}>
                        {item.nombre}
                      </Text>
                      <Text style={estilos.skuProductoBusqueda}>
                        SKU: {item.sku} | Stock: {item.stock}
                      </Text>
                    </View>
                    <Text style={estilos.precioProductoBusqueda}>
                      {formatearMoneda(item.precio)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={estilos.textoVacio}>No hay resultados</Text>
              }
            />
          </View>
        )}
      </View>

      <Text style={estilos.tituloCarrito}>Carrito ({carrito.length})</Text>

      <FlatList
        data={carrito}
        keyExtractor={(item) => item.producto.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
        renderItem={({ item }) => {
          const source = getImageSource(item.producto.imagen);
          return (
            <View style={estilos.itemCarrito}>
              {source ? (
                <Image source={source} style={estilos.iconoProducto} />
              ) : (
                <View style={estilos.iconoProducto}>
                  <FontAwesome5
                    name="box"
                    size={20}
                    color={colores.textoGris}
                  />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={estilos.nombreItem} numberOfLines={2}>
                  {item.producto.nombre}
                </Text>
                <Text style={estilos.precioItem}>
                  {formatearMoneda(item.producto.precio)}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <View style={estilos.controlesCarrito}>
                    <TouchableOpacity
                      style={estilos.btnCant}
                      onPress={() => modificarCantidad(item.producto.id, -1)}
                    >
                      <Text style={estilos.txtCant}>-</Text>
                    </TouchableOpacity>
                    <Text style={estilos.numeroCant}>{item.cantidad}</Text>
                    <TouchableOpacity
                      style={estilos.btnCant}
                      onPress={() => modificarCantidad(item.producto.id, 1)}
                    >
                      <Text style={estilos.txtCant}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 15,
                    }}
                  >
                    <Text style={estilos.subtotalItem}>
                      {formatearMoneda(item.subtotal)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => eliminarDelCarrito(item.producto.id)}
                    >
                      <FontAwesome5
                        name="trash-alt"
                        size={18}
                        color={colores.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 50,
            }}
          >
            <FontAwesome5
              name="shopping-cart"
              size={80}
              color={colores.textoGris}
              style={{ opacity: 0.5 }}
            />
            <Text
              style={{ color: colores.textoGris, marginTop: 20, fontSize: 16 }}
            >
              El carrito está vacío
            </Text>
          </View>
        }
      />

      <View style={estilos.footer}>
        {configImpuestos.cobrarIVA && carrito.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 15,
              marginBottom: 5,
            }}
          >
            <Text style={{ color: colores.textoGris, fontSize: 12 }}>
              Sub: {formatearMoneda(calcularMontos().subtotalBase)}
            </Text>
            <Text style={{ color: colores.textoGris, fontSize: 12 }}>
              IVA: {formatearMoneda(calcularMontos().montoIVA)}
            </Text>
          </View>
        )}

        {/* 🔥 MOSTRAR BOLÍVARES EN EL TOTAL DEL CARRITO */}
        <View style={estilos.totalContenedor}>
          <View>
            <Text style={estilos.textoTotal}>TOTAL</Text>
            {tasaBCV > 0 && (
              <Text
                style={{
                  color: colores.textoGris,
                  fontSize: 14,
                  marginTop: 2,
                  fontWeight: "bold",
                }}
              >
                {formatearBs(calcularMontos().granTotal)}
              </Text>
            )}
          </View>
          <Text style={estilos.montoTotal}>
            {formatearMoneda(calcularMontos().granTotal)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            estilos.botonPrimario,
            carrito.length === 0 && { opacity: 0.5 },
          ]}
          onPress={abrirModalPago}
          disabled={carrito.length === 0}
        >
          <Text style={estilos.textoBotonPrimario}>Procesar Venta</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={estilos.modalContainer}
        >
          <View style={estilos.modalContent}>
            {faseModal !== "exito" && (
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitulo}>
                  {faseModal === "confirmacion"
                    ? "Confirmar"
                    : "Completar Venta"}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ padding: 5 }}
                >
                  <FontAwesome5
                    name="times"
                    size={20}
                    color={colores.textoGris}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* --- FASE 1: COMPLETAR VENTA --- */}
            {faseModal === "pago" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 🔥 MOSTRAR BOLÍVARES EN EL MODAL DE PAGO */}
                <View style={estilos.totalDisplay}>
                  <Text style={estilos.totalLabel}>Total a Pagar</Text>
                  <Text style={estilos.totalValue}>
                    {formatearMoneda(calcularMontos().granTotal)}
                  </Text>

                  {tasaBCV > 0 && (
                    <Text
                      style={{
                        color: colores.textoBlanco,
                        fontSize: 20,
                        fontWeight: "bold",
                        marginTop: 5,
                      }}
                    >
                      {formatearBs(calcularMontos().granTotal)}
                    </Text>
                  )}

                  {(configImpuestos.cobrarIVA ||
                    configImpuestos.cobrarIGTF) && (
                    <View style={{ marginTop: 10, alignItems: "center" }}>
                      {configImpuestos.cobrarIVA && (
                        <>
                          <Text
                            style={{ color: colores.textoGris, fontSize: 12 }}
                          >
                            Subtotal:{" "}
                            {formatearMoneda(calcularMontos().subtotalBase)}
                          </Text>
                          <Text
                            style={{ color: colores.textoGris, fontSize: 12 }}
                          >
                            IVA ({configImpuestos.tasaIVA}%):{" "}
                            {formatearMoneda(calcularMontos().montoIVA)}
                          </Text>
                        </>
                      )}
                      {configImpuestos.cobrarIGTF &&
                        metodoPago === "efectivo" && (
                          <Text
                            style={{
                              color: colores.primario,
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            + IGTF ({configImpuestos.tasaIGTF}%):{" "}
                            {formatearMoneda(calcularMontos().montoIGTF)}
                          </Text>
                        )}
                    </View>
                  )}
                </View>

                {/* SECCIÓN CLIENTE */}
                <View style={estilos.seccion}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 15,
                    }}
                  >
                    <Text style={estilos.seccionTitulo}>Cliente *</Text>
                    {!mostrarNuevoCliente && !clienteSeleccionado && (
                      <TouchableOpacity
                        onPress={() => setMostrarNuevoCliente(true)}
                      >
                        <Text
                          style={{
                            color: colores.primario,
                            fontWeight: "bold",
                            fontSize: 14,
                          }}
                        >
                          + Nuevo Cliente
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {mostrarNuevoCliente ? (
                    <View style={estilos.formNuevoCliente}>
                      <TextInput
                        style={estilos.inputFormCliente}
                        placeholder="Nombre del cliente"
                        placeholderTextColor={colores.textoGris}
                        value={nombreCliente}
                        onChangeText={setNombreCliente}
                      />
                      <TextInput
                        style={estilos.inputFormCliente}
                        placeholder="Cédula (Obligatoria) *" // 🔥 Le avisamos al usuario
                        placeholderTextColor={colores.textoGris}
                        value={cedulaCliente}
                        onChangeText={setCedulaCliente}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={estilos.inputFormCliente}
                        placeholder="Teléfono (opcional)"
                        placeholderTextColor={colores.textoGris}
                        value={telefonoCliente}
                        onChangeText={setTelefonoCliente}
                        keyboardType="phone-pad"
                      />
                      <View style={estilos.filaBotonesForm}>
                        <TouchableOpacity
                          onPress={() => setMostrarNuevoCliente(false)}
                          style={{ padding: 15 }}
                        >
                          <Text
                            style={{
                              color: colores.textoBlanco,
                              fontWeight: "bold",
                            }}
                          >
                            Cancelar
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={crearClienteRapido}
                          style={estilos.botonGuardarCliente}
                        >
                          {cargando ? (
                            <ActivityIndicator color={colores.textoOscuro} />
                          ) : (
                            <Text
                              style={{
                                color: colores.textoOscuro,
                                fontWeight: "bold",
                              }}
                            >
                              Guardar Cliente
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : clienteSeleccionado ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 15,
                      }}
                    >
                      <View
                        style={[
                          estilos.chipCliente,
                          estilos.chipClienteActivo,
                          {
                            flex: 1,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 16,
                            paddingHorizontal: 20,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <FontAwesome5
                            name="user-check"
                            size={16}
                            color={colores.textoOscuro}
                          />
                          <Text
                            style={{
                              color: colores.textoOscuro,
                              fontWeight: "bold",
                              fontSize: 16,
                            }}
                          >
                            {
                              clientesBD.find(
                                (c) => c.id === clienteSeleccionado,
                              )?.nombre
                            }
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setClienteSeleccionado(null)}
                          style={{ padding: 5 }}
                        >
                          <FontAwesome5
                            name="times-circle"
                            size={20}
                            color={colores.textoOscuro}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={estilos.buscadorClientes}>
                        <FontAwesome5
                          name="search"
                          size={14}
                          color={colores.textoGris}
                        />
                        <TextInput
                          style={estilos.inputBuscadorMod}
                          placeholder="Buscar por nombre o cédula..."
                          placeholderTextColor={colores.textoGris}
                          value={busquedaCliente}
                          onChangeText={setBusquedaCliente}
                        />
                        {busquedaCliente.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setBusquedaCliente("")}
                            style={{ padding: 5 }}
                          >
                            <FontAwesome5
                              name="times-circle"
                              size={14}
                              color={colores.textoGris}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      {busquedaCliente.trim().length > 0 && (
                        <View style={estilos.contenedorListaClientes}>
                          <ScrollView
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={true}
                          >
                            {clientesFiltrados.map((c) => (
                              <TouchableOpacity
                                key={c.id}
                                style={estilos.itemClienteList}
                                onPress={() => {
                                  setClienteSeleccionado(c.id);
                                  setBusquedaCliente("");
                                }}
                              >
                                <View style={estilos.iconoClienteAvatar}>
                                  <FontAwesome5
                                    name="user"
                                    size={14}
                                    color={colores.textoGris}
                                  />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      estilos.textoItemCliente,
                                      { fontWeight: "bold" },
                                    ]}
                                  >
                                    {c.nombre}
                                  </Text>
                                  {c.cedula && (
                                    <Text
                                      style={{
                                        color: colores.textoGris,
                                        fontSize: 12,
                                      }}
                                    >
                                      C.I: {c.cedula}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            ))}
                            {clientesFiltrados.length === 0 && (
                              <Text
                                style={{
                                  color: colores.textoGris,
                                  textAlign: "center",
                                  padding: 15,
                                }}
                              >
                                No se encontraron clientes.
                              </Text>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* MÉTODOS DE PAGO */}
                <Text style={estilos.seccionTitulo}>Método de Pago</Text>
                <View style={estilos.gridPagos}>
                  {[
                    {
                      id: "efectivo",
                      nombre: "Efectivo",
                      icono: "dollar-sign",
                    },
                    { id: "tarjeta", nombre: "Tarjeta", icono: "credit-card" },
                    { id: "credito", nombre: "Crédito", icono: "chart-line" },
                    {
                      id: "pago_movil",
                      nombre: "Pago Móvil",
                      icono: "mobile-alt",
                    },
                  ].map((metodo) => (
                    <TouchableOpacity
                      key={metodo.id}
                      style={[
                        estilos.opcionPago,
                        metodoPago === metodo.id && estilos.opcionPagoActivo,
                      ]}
                      onPress={() => setMetodoPago(metodo.id)}
                    >
                      <FontAwesome5
                        name={metodo.icono}
                        size={24}
                        color={
                          metodoPago === metodo.id
                            ? colores.primario
                            : colores.textoGris
                        }
                      />
                      <Text
                        style={[
                          estilos.textoPago,
                          metodoPago === metodo.id && estilos.textoPagoActivo,
                        ]}
                      >
                        {metodo.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* INPUTS CONDICIONALES */}
                {metodoPago === "efectivo" && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={estilos.labelInput}>Dinero Recibido</Text>
                    <TextInput
                      style={estilos.inputDinero}
                      placeholder="$ 0.00"
                      placeholderTextColor={colores.textoGris}
                      keyboardType="decimal-pad"
                      value={montoRecibido}
                      onChangeText={setMontoRecibido}
                    />
                    {montoRecibido &&
                    parseFloat(montoRecibido) > calcularMontos().granTotal ? (
                      <Text style={estilos.textoCambio}>
                        Cambio:{" "}
                        {formatearMoneda(
                          parseFloat(montoRecibido) -
                            calcularMontos().granTotal,
                        )}
                      </Text>
                    ) : null}
                  </View>
                )}

                {metodoPago === "credito" && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={estilos.labelInput}>
                      Abono Inicial (Opcional)
                    </Text>
                    <TextInput
                      style={estilos.inputDinero}
                      placeholder="$ 0.00"
                      placeholderTextColor={colores.textoGris}
                      keyboardType="decimal-pad"
                      value={montoCreditoInicial}
                      onChangeText={setMontoCreditoInicial}
                    />
                    <Text style={estilos.textoDeuda}>
                      Saldo Pendiente:{" "}
                      {formatearMoneda(
                        calcularMontos().granTotal -
                          (parseFloat(montoCreditoInicial) || 0),
                      )}
                    </Text>
                  </View>
                )}

                {metodoPago === "pago_movil" && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={estilos.labelInput}>
                      Comprobante (Opcional)
                    </Text>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: fotoComprobante
                          ? colores.exito
                          : colores.fondoInput,
                        borderWidth: 1,
                        borderColor: fotoComprobante
                          ? colores.exito
                          : colores.primario,
                        padding: 16,
                        borderRadius: 12,
                        marginTop: 5,
                        gap: 10,
                      }}
                      onPress={seleccionarImagen}
                    >
                      <FontAwesome5
                        name={fotoComprobante ? "check" : "camera"}
                        size={18}
                        color={fotoComprobante ? "#FFF" : colores.textoBlanco}
                      />
                      <Text
                        style={{
                          color: fotoComprobante ? "#FFF" : colores.textoBlanco,
                          fontWeight: "bold",
                        }}
                      >
                        {fotoComprobante
                          ? "Comprobante Adjuntado ✓"
                          : "Adjuntar Comprobante"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[estilos.botonPrimario, { marginTop: 30 }]}
                  onPress={() => {
                    if (!clienteSeleccionado) {
                      Alert.alert(
                        "Cliente Requerido",
                        "Por favor, busque y seleccione un cliente para la venta.",
                      );
                      return;
                    }
                    setFaseModal("confirmacion");
                  }}
                >
                  <Text style={estilos.textoBotonPrimario}>Continuar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* --- FASE 2: CONFIRMAR VENTA --- */}
            {faseModal === "confirmacion" && (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <Text style={estilos.tituloConfirmacion}>
                  ¿Confirmar Venta?
                </Text>
                <View style={estilos.cuadroResumen}>
                  <View style={estilos.filaResumen}>
                    <Text style={estilos.labelResumen}>Cliente:</Text>
                    <Text style={estilos.valorResumen}>
                      {clienteSeleccionado
                        ? clientesBD.find((c) => c.id === clienteSeleccionado)
                            ?.nombre
                        : ""}
                    </Text>
                  </View>
                  <View style={estilos.filaResumen}>
                    <Text style={estilos.labelResumen}>Productos:</Text>
                    <Text style={estilos.valorResumen} numberOfLines={1}>
                      {carrito
                        .map(
                          (item) => `${item.cantidad}x ${item.producto.nombre}`,
                        )
                        .join(", ")}
                    </Text>
                  </View>
                  <View style={estilos.filaResumen}>
                    <Text style={estilos.labelResumen}>Método:</Text>
                    <Text style={estilos.valorResumen}>
                      {metodoPago.replace("_", " ")}
                    </Text>
                  </View>

                  {(configImpuestos.cobrarIVA ||
                    configImpuestos.cobrarIGTF) && (
                    <>
                      <View style={estilos.divisorResumen} />
                      <View style={estilos.filaResumen}>
                        <Text style={estilos.labelResumen}>Subtotal:</Text>
                        <Text style={estilos.valorResumen}>
                          {formatearMoneda(calcularMontos().subtotalBase)}
                        </Text>
                      </View>
                      {configImpuestos.cobrarIVA && (
                        <View style={estilos.filaResumen}>
                          <Text style={estilos.labelResumen}>
                            IVA ({configImpuestos.tasaIVA}%):
                          </Text>
                          <Text style={estilos.valorResumen}>
                            {formatearMoneda(calcularMontos().montoIVA)}
                          </Text>
                        </View>
                      )}
                      {configImpuestos.cobrarIGTF &&
                        metodoPago === "efectivo" && (
                          <View style={estilos.filaResumen}>
                            <Text style={estilos.labelResumen}>
                              IGTF ({configImpuestos.tasaIGTF}%):
                            </Text>
                            <Text style={estilos.valorResumen}>
                              {formatearMoneda(calcularMontos().montoIGTF)}
                            </Text>
                          </View>
                        )}
                    </>
                  )}

                  <View style={estilos.divisorResumen} />

                  {/* 🔥 MOSTRAR BOLÍVARES EN LA CONFIRMACIÓN FINAL */}
                  <View style={estilos.filaResumenTotal}>
                    <Text style={estilos.textoTotalResumen}>
                      TOTAL A PAGAR:
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={estilos.valorTotalResumen}>
                        {formatearMoneda(calcularMontos().granTotal)}
                      </Text>
                      {tasaBCV > 0 && (
                        <Text
                          style={{
                            color: colores.textoBlanco,
                            fontSize: 16,
                            fontWeight: "bold",
                          }}
                        >
                          {formatearBs(calcularMontos().granTotal)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={estilos.filaBotonesAccion}>
                  <TouchableOpacity
                    style={estilos.botonVolverAccion}
                    onPress={() => setFaseModal("pago")}
                  >
                    <Text style={estilos.textoBotonVolverAccion}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={estilos.botonConfirmarAccion}
                    onPress={procesarVenta}
                    disabled={cargando}
                  >
                    {cargando ? (
                      <ActivityIndicator color={colores.textoOscuro} />
                    ) : (
                      <Text style={estilos.textoBotonConfirmarAccion}>
                        Confirmar
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* --- FASE 3: ÉXITO --- */}
            {faseModal === "exito" && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Animated.View
                  style={[
                    estilos.circuloExito,
                    { transform: [{ scale: animacionEscala }] },
                  ]}
                >
                  <FontAwesome5
                    name="check"
                    size={60}
                    color={colores.primario}
                  />
                </Animated.View>
                <Text style={estilos.tituloExito}>¡Venta Exitosa!</Text>
                <Text style={estilos.subtituloExito}>
                  La transacción se ha registrado correctamente.
                </Text>

                <View style={estilos.filaBotonesExito}>
                  <TouchableOpacity
                    style={estilos.botonGenerarRecibo}
                    onPress={async () => {
                      try {
                        if (ventaRealizada)
                          await generarYCompartirRecibo(
                            ventaRealizada,
                            user?.nombre || "INVENTARIO YA",
                          );
                        else
                          Alert.alert(
                            "Error",
                            "No se encontraron los datos de la venta.",
                          );
                      } catch (error) {
                        Alert.alert(
                          "Error",
                          "No se pudo generar el recibo en este momento.",
                        );
                      }
                    }}
                  >
                    <Text style={estilos.textoBotonGenerarRecibo}>
                      Generar Recibo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={estilos.botonFinalizar}
                    onPress={() => {
                      setModalVisible(false);
                      setTimeout(() => router.replace("/(tabs)"), 500);
                    }}
                  >
                    <Text style={estilos.textoBotonFinalizar}>Finalizar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --- ESTILOS DINÁMICOS ---
const crearEstilos = (c: any) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.7)",
      zIndex: 1000,
      justifyContent: "center",
      alignItems: "center",
    },
    encabezado: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
    },
    titulo: { fontSize: 28, fontWeight: "bold", color: c.textoBlanco },
    botonEscanear: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.primario,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
    },
    textoBotonEscanear: {
      fontSize: 14,
      fontWeight: "bold",
      color: c.textoOscuro,
    },
    barraBusqueda: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      marginHorizontal: 20,
      paddingHorizontal: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 10,
    },
    inputBusqueda: {
      flex: 1,
      paddingVertical: 15,
      paddingHorizontal: 10,
      fontSize: 16,
      color: c.textoBlanco,
    },
    listaProductos: {
      position: "absolute",
      top: 65,
      left: 20,
      right: 20,
      maxHeight: 300,
      backgroundColor: c.fondoTarjeta,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      elevation: 10,
      zIndex: 999,
    },
    itemProductoBusqueda: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    imagenBusqueda: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.fondoOscuro,
    },
    placeholderBusqueda: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.fondoOscuro,
      justifyContent: "center",
      alignItems: "center",
    },
    nombreProductoBusqueda: {
      fontSize: 14,
      color: c.textoBlanco,
      fontWeight: "bold",
    },
    skuProductoBusqueda: { fontSize: 12, color: c.textoGris, marginTop: 2 },
    precioProductoBusqueda: {
      fontSize: 16,
      color: c.primario,
      fontWeight: "bold",
    },
    textoVacio: { color: c.textoGris, padding: 20, textAlign: "center" },
    tituloCarrito: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.textoBlanco,
      marginHorizontal: 20,
      marginVertical: 15,
    },
    itemCarrito: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoTarjeta,
      padding: 15,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.borde,
    },
    iconoProducto: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: c.fondoOscuro,
      justifyContent: "center",
      alignItems: "center",
    },
    nombreItem: {
      fontSize: 16,
      color: c.textoBlanco,
      fontWeight: "bold",
      marginBottom: 2,
    },
    precioItem: { fontSize: 14, color: c.textoGris },
    subtotalItem: { fontSize: 20, color: c.primario, fontWeight: "900" },
    controlesCarrito: { flexDirection: "row", alignItems: "center" },
    btnCant: {
      backgroundColor: c.fondoOscuro,
      width: 35,
      height: 35,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
    },
    txtCant: {
      color: c.primario,
      fontSize: 20,
      fontWeight: "bold",
      marginTop: -2,
    },
    numeroCant: {
      color: c.textoBlanco,
      fontSize: 18,
      fontWeight: "bold",
      width: 40,
      textAlign: "center",
    },
    footer: {
      backgroundColor: c.fondoOscuro,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: c.borde,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
    },
    totalContenedor: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    textoTotal: { fontSize: 16, color: c.textoGris, fontWeight: "bold" },
    montoTotal: { fontSize: 32, color: c.primario, fontWeight: "900" },
    botonPrimario: {
      backgroundColor: c.primario,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      width: "100%",
    },
    textoBotonPrimario: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.85)",
    },
    modalContent: {
      backgroundColor: c.fondoOscuro,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      padding: 25,
      maxHeight: "95%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    modalTitulo: { fontSize: 22, fontWeight: "bold", color: c.textoBlanco },
    totalDisplay: {
      alignItems: "center",
      paddingVertical: 25,
      backgroundColor: c.fondoInput,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.primario,
      marginBottom: 25,
    },
    totalLabel: { color: c.textoGris, fontSize: 16, marginBottom: 5 },
    totalValue: { color: c.primario, fontSize: 45, fontWeight: "900" },
    seccion: { marginBottom: 25 },
    seccionTitulo: {
      fontSize: 18,
      color: c.textoBlanco,
      fontWeight: "bold",
      marginBottom: 15,
    },
    buscadorClientes: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.fondoInput,
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 15,
    },
    inputBuscadorMod: {
      flex: 1,
      paddingVertical: 12,
      marginLeft: 10,
      color: c.textoBlanco,
    },
    contenedorListaClientes: {
      maxHeight: 180,
      backgroundColor: c.fondoTarjeta,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 15,
      overflow: "hidden",
    },
    itemClienteList: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    },
    itemClienteListActivo: { backgroundColor: c.primario },
    iconoClienteAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.05)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    textoItemCliente: { color: c.textoBlanco, fontSize: 14 },
    chipCliente: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.fondoInput,
      marginRight: 10,
    },
    chipClienteActivo: { backgroundColor: c.primario },
    textoChipCliente: { color: c.textoGris, fontWeight: "bold" },
    formNuevoCliente: {
      backgroundColor: c.fondoTarjeta,
      padding: 20,
      borderRadius: 16,
      gap: 15,
      borderWidth: 1,
      borderColor: c.borde,
    },
    inputFormCliente: {
      backgroundColor: c.fondoInput,
      color: c.textoBlanco,
      padding: 15,
      borderRadius: 10,
      fontSize: 14,
    },
    filaBotonesForm: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 5,
    },
    botonGuardarCliente: {
      backgroundColor: c.primario,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 10,
    },
    gridPagos: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
    },
    opcionPago: {
      width: "48%",
      paddingVertical: 20,
      backgroundColor: c.fondoInput,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "transparent",
      marginBottom: 5,
    },
    opcionPagoActivo: {
      borderColor: c.primario,
      borderWidth: 2,
      backgroundColor: c.fondoInput,
    },
    textoPago: { color: c.textoGris, fontSize: 14, marginTop: 10 },
    textoPagoActivo: { color: c.primario, fontWeight: "bold" },
    labelInput: { color: c.textoBlanco, marginBottom: 10, fontWeight: "bold" },
    inputDinero: {
      backgroundColor: c.fondoOscuro,
      color: c.textoBlanco,
      fontSize: 24,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoCambio: {
      color: c.exito,
      marginTop: 10,
      fontSize: 18,
      fontWeight: "bold",
    },
    textoDeuda: { color: c.error, marginTop: 10, fontSize: 16 },
    tituloConfirmacion: {
      fontSize: 26,
      color: c.textoBlanco,
      fontWeight: "bold",
      marginVertical: 20,
    },
    cuadroResumen: {
      width: "100%",
      backgroundColor: c.fondoTarjeta,
      padding: 25,
      borderRadius: 16,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: c.borde,
    },
    filaResumen: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    labelResumen: { color: c.textoGris, fontSize: 16 },
    valorResumen: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "bold",
      flex: 1,
      textAlign: "right",
      marginLeft: 10,
      textTransform: "capitalize",
    },
    divisorResumen: { height: 1, backgroundColor: c.borde, marginVertical: 15 },
    filaResumenTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 5,
    },
    textoTotalResumen: { color: c.textoGris, fontWeight: "bold", fontSize: 16 },
    valorTotalResumen: { color: c.primario, fontWeight: "900", fontSize: 26 },
    filaBotonesAccion: { flexDirection: "row", gap: 15, width: "100%" },
    botonVolverAccion: {
      flex: 1,
      backgroundColor: c.fondoTarjeta,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBotonVolverAccion: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "bold",
    },
    botonConfirmarAccion: {
      flex: 1,
      backgroundColor: c.primario,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
    },
    textoBotonConfirmarAccion: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
    circuloExito: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(212, 255, 0, 0.05)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 2,
      borderColor: c.primario,
    },
    tituloExito: {
      fontSize: 28,
      color: c.textoBlanco,
      fontWeight: "bold",
      marginBottom: 10,
    },
    subtituloExito: {
      fontSize: 16,
      color: c.textoGris,
      textAlign: "center",
      marginBottom: 40,
    },
    filaBotonesExito: { flexDirection: "row", gap: 15, width: "100%" },
    botonGenerarRecibo: {
      flex: 1,
      backgroundColor: c.fondoTarjeta,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBotonGenerarRecibo: {
      color: c.textoBlanco,
      fontSize: 16,
      fontWeight: "bold",
    },
    botonFinalizar: {
      flex: 1,
      backgroundColor: c.primario,
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
    },
    textoBotonFinalizar: {
      color: c.textoOscuro,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
