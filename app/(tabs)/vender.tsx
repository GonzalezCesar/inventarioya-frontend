import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // 🔥 Importación necesaria para el comprobante
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";

const API_URL_UPLOADS = "http://192.168.1.111:8000/uploads/";

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

  const { colores } = useTheme();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [productosBD, setProductosBD] = useState<Producto[]>([]);
  const [clientesBD, setClientesBD] = useState<Cliente[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(
    null,
  );
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
  });
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return clientesBD;
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

  // 🔥 Estado para el comprobante de Pago Móvil
  const [fotoComprobante, setFotoComprobante] = useState<string | null>(null);

  const [faseModal, setFaseModal] = useState<"pago" | "confirmacion" | "exito">(
    "pago",
  );
  const animacionEscala = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resProds, resClis]: any = await Promise.all([
        api.get("/productos"),
        api.get("/clientes"),
      ]);
      setProductosBD(resProds || []);
      setClientesBD(resClis || []);
    } catch (error) {
      console.error("Error cargando DB para POS:", error);
    } finally {
      setCargandoInicial(false);
    }
  };

  const formatearMoneda = (monto: number) =>
    `$ ${Math.abs(monto || 0).toFixed(2)}`;
  const calcularTotal = () =>
    carrito.reduce((sum, item) => sum + item.subtotal, 0);

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

    const itemExistente = carrito.find(
      (item) => item.producto.id === producto.id,
    );
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock)
        return Alert.alert(
          "Stock Máximo",
          `Solo hay ${producto.stock} en stock.`,
        );
      setCarrito(
        carrito.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.producto.precio,
              }
            : item,
        ),
      );
    } else {
      setCarrito([
        ...carrito,
        { producto, cantidad: 1, subtotal: producto.precio },
      ]);
    }
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

  // 🔥 Función para seleccionar la imagen del comprobante
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
    setFotoComprobante(null); // Resetear el comprobante
    setMetodoPago("efectivo");
    setModalVisible(true);
  };

  const procesarVenta = async () => {
    const total = calcularTotal();
    const recibidoFloat = parseFloat(montoRecibido.replace(",", ".")) || total;

    if (metodoPago === "efectivo" && montoRecibido && recibidoFloat < total) {
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
        total: total,
        subtotal: total,
        metodoPago: metodoPago,
        montoPagado:
          metodoPago === "credito"
            ? parseFloat(montoCreditoInicial) || 0
            : recibidoFloat,
        estadoPago: metodoPago === "credito" ? "pendiente" : "completo",
        items: carrito.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

      // Adjuntar foto solo si es pago móvil
      if (metodoPago === "pago_movil" && fotoComprobante) {
        payload.fotoComprobante = fotoComprobante;
      }

      await api.post("/ventas", payload);

      setFaseModal("exito");
      Animated.spring(animacionEscala, {
        toValue: 1,
        friction: 8,
        tension: 30,
        useNativeDriver: true,
      }).start();
      setCarrito([]);
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

      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Nueva Venta</Text>
        <TouchableOpacity
          style={estilos.botonEscanear}
          onPress={() => router.push("/productos/escaner")}
        >
          <FontAwesome5 name="camera" size={16} color={colores.textoOscuro} />
          <Text style={estilos.textoBotonEscanear}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
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

      {/* 🔥 Lista del Carrito Pixel Perfect */}
      <FlatList
        data={carrito}
        keyExtractor={(item) => item.producto.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
        renderItem={({ item }) => {
          const source = getImageSource(item.producto.imagen);
          return (
            <View style={estilos.itemCarrito}>
              {/* Izquierda: Icono/Imagen */}
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

              {/* Centro & Derecha */}
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={estilos.nombreItem} numberOfLines={2}>
                  {item.producto.nombre}
                </Text>
                <Text style={estilos.precioItem}>
                  {formatearMoneda(item.producto.precio)}
                </Text>

                {/* Fila Inferior: Controles y Totales */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  {/* Controles de Cantidad */}
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

                  {/* Subtotal y Papelera */}
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

      {/* Footer Total */}
      <View style={estilos.footer}>
        <View style={estilos.totalContenedor}>
          <Text style={estilos.textoTotal}>TOTAL</Text>
          <Text style={estilos.montoTotal}>
            {formatearMoneda(calcularTotal())}
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

      {/* MODAL DE PAGO / CONFIRMACIÓN */}
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
                {/* Cuadro del Total (Borde verde) */}
                <View style={estilos.totalDisplay}>
                  <Text style={estilos.totalLabel}>Total a Pagar</Text>
                  <Text style={estilos.totalValue}>
                    {formatearMoneda(calcularTotal())}
                  </Text>
                </View>

                {/* SECCIÓN CLIENTE */}
                <View style={estilos.seccion}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={estilos.seccionTitulo}>Cliente</Text>
                  </View>

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

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 15 }}
                  >
                    <TouchableOpacity
                      style={[
                        estilos.chipCliente,
                        clienteSeleccionado === null &&
                          estilos.chipClienteActivo,
                      ]}
                      onPress={() => setClienteSeleccionado(null)}
                    >
                      <Text
                        style={[
                          estilos.textoChipCliente,
                          clienteSeleccionado === null && {
                            color: colores.textoOscuro,
                          },
                        ]}
                      >
                        Mostrador
                      </Text>
                    </TouchableOpacity>

                    {clienteSeleccionado && (
                      <TouchableOpacity
                        style={[estilos.chipCliente, estilos.chipClienteActivo]}
                        onPress={() =>
                          setClienteSeleccionado(clienteSeleccionado)
                        }
                      >
                        <Text
                          style={{
                            color: colores.textoOscuro,
                            fontWeight: "bold",
                          }}
                        >
                          {
                            clientesBD.find((c) => c.id === clienteSeleccionado)
                              ?.nombre
                          }
                        </Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  {busquedaCliente.length > 0 && (
                    <View style={estilos.contenedorListaClientes}>
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                      >
                        {clientesFiltrados.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              estilos.itemClienteList,
                              clienteSeleccionado === c.id && {
                                backgroundColor: colores.fondoInput,
                              },
                            ]}
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
                      </ScrollView>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/cuenta")}
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
                            ? colores.subtitulos
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
                    parseFloat(montoRecibido) > calcularTotal() ? (
                      <Text style={estilos.textoCambio}>
                        Cambio:{" "}
                        {formatearMoneda(
                          parseFloat(montoRecibido) - calcularTotal(),
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
                        calcularTotal() -
                          (parseFloat(montoCreditoInicial) || 0),
                      )}
                    </Text>
                  </View>
                )}

                {/* 🔥 BOTÓN DE COMPROBANTE SOLO PARA PAGO MÓVIL */}
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
                  onPress={() => setFaseModal("confirmacion")}
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
                        : "Mostrador"}
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
                  <View style={estilos.divisorResumen} />
                  <View style={estilos.filaResumenTotal}>
                    <Text style={estilos.textoTotalResumen}>
                      TOTAL A PAGAR:
                    </Text>
                    <Text style={estilos.valorTotalResumen}>
                      {formatearMoneda(calcularTotal())}
                    </Text>
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
                    onPress={() =>
                      Alert.alert(
                        "Recibo",
                        "Generador de recibos en construcción",
                      )
                    }
                  >
                    <Text style={estilos.textoBotonGenerarRecibo}>
                      Generar Recibo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
  style={estilos.botonFinalizar}
  onPress={() => {
    // 1. Ocultamos el modal primero
    setModalVisible(false);
    
    // 2. Le damos medio segundo para que la animación de cierre termine por completo
    setTimeout(() => {
      // 3. Reemplazamos la ruta para forzar la recarga del layout
      router.replace("/(tabs)"); 
    }, 500); 
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

// 🔥 ESTILOS DINÁMICOS Y PIXEL PERFECT
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

    // Buscador Main
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

    // Carrito
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
    precioItem: { fontSize: 14, color: c.subtitulos },
    subtotalItem: { fontSize: 20, color: c.subtitulos, fontWeight: "900" },

    // Controles Carrito (Cantidad)
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
      color: c.subtitulos,
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

    // Footer
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
    montoTotal: { fontSize: 32, color: c.subtitulos, fontWeight: "900" },
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

    // Modal Global
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

    // Fase Pago
    totalDisplay: {
      alignItems: "center",
      paddingVertical: 25,
      backgroundColor: c.fondoOscuro,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.subtitulos,
      marginBottom: 25,
    },
    totalLabel: { color: c.textoGris, fontSize: 16, marginBottom: 5 },
    totalValue: { color: c.subtitulos, fontSize: 45, fontWeight: "900" },

    seccion: { marginBottom: 25 },
    seccionTitulo: {
      fontSize: 18,
      color: c.textoBlanco,
      fontWeight: "bold",
      marginBottom: 15,
    },

    // Buscador Clientes Modal
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

    // Grid Pagos
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
      borderColor: c.subtitulos,
      borderWidth: 2,
      backgroundColor: c.fondoInput,
    },
    textoPago: { color: c.textoGris, fontSize: 14, marginTop: 10 },
    textoPagoActivo: { color: c.subtitulos, fontWeight: "bold" },

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

    // Fase Confirmación
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
    valorTotalResumen: { color: c.subtitulos, fontWeight: "900", fontSize: 26 },

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

    // Fase Éxito
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
