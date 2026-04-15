import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useAuth } from "../../contexts/ContextAuth";
import api from "../../services/api";

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: "#1C1C1E",
  fondoTarjeta: "#2C2C2E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#1C1C1E",
  borde: "#38383A",
  exito: "#34C759",
  error: "#FF3B30",
};

const API_URL_UPLOADS = "http://192.168.1.105:8000/uploads/";

// --- INTERFACES ---
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

export default function PantallaNuevaVenta() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados de Base de Datos
  const [productosBD, setProductosBD] = useState<Producto[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados Principales
  const [busqueda, setBusqueda] = useState("");
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados del Modal de Pago
  const [modalVisible, setModalVisible] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [faseModal, setFaseModal] = useState<"pago" | "confirmacion" | "exito">(
    "pago",
  );
  const animacionEscala = React.useRef(new Animated.Value(0)).current;

  // 1. Cargar Productos Reales al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resProds: any = await api.get("/productos");
        setProductosBD(resProds || []);
      } catch (error) {
        console.error("Error cargando productos para POS:", error);
      } finally {
        setCargandoInicial(false);
      }
    };
    cargarDatos();
  }, []);

  // Utilidades
  const formatearMoneda = (monto: number) => `$ ${(monto || 0).toFixed(2)}`;
  const calcularTotal = () =>
    carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const getImageSource = (imagen?: string) => {
    if (!imagen) return null;
    if (imagen.startsWith("http") || imagen.startsWith("data:"))
      return { uri: imagen };
    return { uri: `${API_URL_UPLOADS}${imagen}` };
  };

  // Buscador Dinámico
  const productosFiltrados = productosBD.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  // Funciones del Carrito
  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      Alert.alert("Agotado", "Este producto no tiene stock disponible.");
      return;
    }

    const itemExistente = carrito.find(
      (item) => item.producto.id === producto.id,
    );

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        Alert.alert(
          "Stock Máximo",
          `Solo hay ${producto.stock} unidades de este producto.`,
        );
        return;
      }
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
      setCarrito(carrito.filter((i) => i.producto.id !== id));
      return;
    }
    if (nuevaCantidad > item.producto.stock) {
      Alert.alert("Límite", `Solo hay ${item.producto.stock} en stock.`);
      return;
    }

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

  // Flujo de Venta
  const abrirModalPago = () => {
    if (carrito.length === 0) return;
    setFaseModal("pago");
    setMontoRecibido("");
    setMetodoPago("efectivo");
    setModalVisible(true);
  };

  const procesarVenta = async () => {
    const total = calcularTotal();
    if (
      metodoPago === "efectivo" &&
      montoRecibido &&
      parseFloat(montoRecibido) < total
    ) {
      Alert.alert(
        "Error",
        "El dinero recibido no alcanza para cubrir el total.",
      );
      return;
    }

    setCargando(true);
    try {
      // Preparamos los datos exactos que tu VentaController espera
      const payload = {
        total: total,
        subtotal: total, // Si no hay impuestos aún, es lo mismo
        metodo_pago: metodoPago,
        monto_recibido: parseFloat(montoRecibido) || total,
        estado_pago: "completo",
        items: carrito.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

      // Mandamos la venta a la base de datos
      await api.post("/ventas", payload);

      setFaseModal("exito");
      Animated.spring(animacionEscala, {
        toValue: 1,
        friction: 8,
        tension: 30,
        useNativeDriver: true,
      }).start();
      setCarrito([]);

      // Refrescamos el stock silenciosamente en segundo plano
      api.get("/productos").then((res: any) => setProductosBD(res || []));
    } catch (error: any) {
      Alert.alert(
        "Error procesando venta",
        error.message || "Error desconocido.",
      );
    } finally {
      setCargando(false);
    }
  };

  const cerrarModalYVolver = () => {
    setModalVisible(false);
  };

  // --- RENDER DEL MODAL ---
  const renderContenidoModal = () => {
    if (faseModal === "exito") {
      return (
        <View style={estilos.contenedorExito}>
          <Animated.View
            style={[
              estilos.iconoExito,
              { transform: [{ scale: animacionEscala }] },
            ]}
          >
            <FontAwesome5 name="check" size={60} color={COLORES.primario} />
          </Animated.View>
          <Text style={estilos.tituloExito}>¡Venta Exitosa!</Text>
          <Text style={estilos.subtituloExito}>
            El inventario se ha actualizado y el ingreso registrado.
          </Text>
          <TouchableOpacity
            style={estilos.botonPrimario}
            onPress={cerrarModalYVolver}
          >
            <Text style={estilos.textoBotonPrimario}>Nueva Venta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (faseModal === "confirmacion") {
      return (
        <View style={estilos.contenedorConfirmacion}>
          <FontAwesome5
            name="exclamation-circle"
            size={60}
            color={COLORES.primario}
          />
          <Text style={estilos.tituloConfirmacion}>¿Confirmar Venta?</Text>

          <View style={estilos.resumenConfirmacion}>
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumen}>Artículos:</Text>
              <Text style={estilos.valorResumen}>{carrito.length}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumen}>Método:</Text>
              <Text style={estilos.valorResumen}>
                {metodoPago.toUpperCase()}
              </Text>
            </View>
            <View style={estilos.divisor} />
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumenTotal}>TOTAL A PAGAR:</Text>
              <Text style={estilos.valorResumenTotal}>
                {formatearMoneda(calcularTotal())}
              </Text>
            </View>
            {metodoPago === "efectivo" && montoRecibido ? (
              <View style={estilos.filaResumen}>
                <Text style={estilos.labelResumen}>Cambio:</Text>
                <Text style={[estilos.valorResumen, { color: COLORES.exito }]}>
                  {formatearMoneda(parseFloat(montoRecibido) - calcularTotal())}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={estilos.botonesConfirmacion}>
            <TouchableOpacity
              style={[estilos.botonSecundario, { flex: 1 }]}
              onPress={() => setFaseModal("pago")}
            >
              <Text style={estilos.textoBotonSecundario}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonPrimario, { flex: 1 }]}
              onPress={procesarVenta}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color={COLORES.textoOscuro} />
              ) : (
                <Text style={estilos.textoBotonPrimario}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Fase: PAGO
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={estilos.totalDisplay}>
          <Text style={estilos.totalLabel}>Total a Pagar</Text>
          <Text style={estilos.totalValue}>
            {formatearMoneda(calcularTotal())}
          </Text>
        </View>

        <Text style={estilos.seccionTitulo}>Método de Pago</Text>
        <View style={estilos.gridPagos}>
          {["efectivo", "tarjeta", "pago_movil"].map((metodo) => (
            <TouchableOpacity
              key={metodo}
              style={[
                estilos.opcionPago,
                metodoPago === metodo && estilos.opcionPagoActivo,
              ]}
              onPress={() => setMetodoPago(metodo)}
            >
              <FontAwesome5
                name={
                  metodo === "efectivo"
                    ? "dollar-sign"
                    : metodo === "tarjeta"
                      ? "credit-card"
                      : "mobile-alt"
                }
                size={24}
                color={
                  metodoPago === metodo ? COLORES.primario : COLORES.textoGris
                }
              />
              <Text
                style={[
                  estilos.textoPago,
                  metodoPago === metodo && estilos.textoPagoActivo,
                ]}
              >
                {metodo.replace("_", " ").toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {metodoPago === "efectivo" && (
          <View style={{ marginTop: 20 }}>
            <Text style={estilos.labelInput}>Dinero Recibido</Text>
            <TextInput
              style={estilos.inputGrande}
              placeholder="$ 0.00"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="decimal-pad"
              value={montoRecibido}
              onChangeText={setMontoRecibido}
            />
          </View>
        )}

        <TouchableOpacity
          style={[estilos.botonPrimario, { marginTop: 30 }]}
          onPress={() => setFaseModal("confirmacion")}
        >
          <Text style={estilos.textoBotonPrimario}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // --- RENDER PRINCIPAL PANTALLA VENDER ---
  return (
    <View style={estilos.contenedor}>
      {cargandoInicial && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(28,28,30,0.8)",
              zIndex: 100,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <ActivityIndicator size="large" color={COLORES.primario} />
        </View>
      )}

      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Nueva Venta</Text>
        <TouchableOpacity
          style={estilos.botonEscanear}
          onPress={() => router.push("/productos/escaner")}
        >
          <FontAwesome5 name="camera" size={16} color={COLORES.textoOscuro} />
          <Text style={estilos.textoBotonEscanear}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={estilos.barraBusqueda}>
        <FontAwesome5 name="search" size={18} color={COLORES.textoGris} />
        <TextInput
          style={estilos.inputBusqueda}
          placeholder="Buscar producto por nombre o SKU..."
          placeholderTextColor={COLORES.textoGris}
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            setMostrarProductos(text.length > 0);
          }}
        />
      </View>

      {/* Lista Desplegable de Resultados */}
      {mostrarProductos && busqueda.length > 0 && (
        <View style={estilos.listaProductos}>
          <FlatList
            data={productosFiltrados}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const source = getImageSource(item.imagen);
              return (
                <TouchableOpacity
                  style={estilos.itemProducto}
                  onPress={() => agregarAlCarrito(item)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 15,
                      flex: 1,
                    }}
                  >
                    {source ? (
                      <Image source={source} style={estilos.imagenBusqueda} />
                    ) : (
                      <View style={estilos.placeholderBusqueda}>
                        <FontAwesome5
                          name="box"
                          size={16}
                          color={COLORES.textoGris}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.nombreProducto} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={estilos.skuProducto}>
                        SKU: {item.sku} | Stock: {item.stock}
                      </Text>
                    </View>
                  </View>
                  <Text style={estilos.precioProducto}>
                    {formatearMoneda(item.precio)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={estilos.textoVacio}>
                No se encontraron productos en stock
              </Text>
            }
          />
        </View>
      )}

      {/* Título Carrito */}
      <Text style={estilos.tituloCarrito}>Carrito ({carrito.length})</Text>

      {/* Lista del Carrito */}
      <FlatList
        data={carrito}
        keyExtractor={(item) => item.producto.id}
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
                    color={COLORES.textoGris}
                  />
                </View>
              )}

              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={estilos.nombreItem} numberOfLines={2}>
                  {item.producto.nombre}
                </Text>
                <Text style={estilos.precioItem}>
                  {formatearMoneda(item.producto.precio)} c/u
                </Text>
              </View>

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

              <Text style={estilos.subtotalItem}>
                {formatearMoneda(item.subtotal)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={estilos.carritoVacio}>
            <FontAwesome5
              name="shopping-cart"
              size={60}
              color={COLORES.borde}
            />
            <Text style={estilos.textoCarritoVacio}>El carrito está vacío</Text>
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

      {/* Modal Multi-paso */}
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
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome5
                    name="times"
                    size={24}
                    color={COLORES.textoGris}
                  />
                </TouchableOpacity>
              </View>
            )}
            {renderContenidoModal()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  titulo: { fontSize: 28, fontWeight: "bold", color: COLORES.textoBlanco },

  botonEscanear: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.primario,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  textoBotonEscanear: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORES.textoOscuro,
  },

  barraBusqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 20,
  },
  inputBusqueda: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORES.textoBlanco,
  },

  listaProductos: {
    position: "absolute",
    top: 165,
    left: 20,
    right: 20,
    maxHeight: 250,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    zIndex: 100,
    elevation: 5,
  },
  itemProducto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  imagenBusqueda: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORES.fondoOscuro,
  },
  placeholderBusqueda: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORES.fondoOscuro,
    justifyContent: "center",
    alignItems: "center",
  },
  nombreProducto: {
    fontSize: 14,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
  },
  skuProducto: { fontSize: 12, color: COLORES.textoGris, marginTop: 4 },
  precioProducto: { fontSize: 16, color: COLORES.primario, fontWeight: "bold" },
  textoVacio: {
    fontSize: 14,
    color: COLORES.textoGris,
    textAlign: "center",
    padding: 20,
  },

  tituloCarrito: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginHorizontal: 20,
    marginBottom: 15,
  },

  carritoVacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    gap: 20,
  },
  textoCarritoVacio: { fontSize: 16, color: COLORES.textoGris },

  itemCarrito: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  iconoProducto: {
    width: 45,
    height: 45,
    backgroundColor: COLORES.fondoOscuro,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nombreItem: { fontSize: 14, color: COLORES.textoBlanco, fontWeight: "bold" },
  precioItem: { fontSize: 12, color: COLORES.textoGris, marginTop: 4 },
  subtotalItem: {
    width: 70,
    textAlign: "right",
    fontSize: 16,
    color: COLORES.primario,
    fontWeight: "bold",
  },

  controlesCarrito: { flexDirection: "row", alignItems: "center" },
  btnCant: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  txtCant: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: "bold" },
  numeroCant: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    width: 35,
    textAlign: "center",
  },

  footer: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  totalContenedor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  textoTotal: { fontSize: 16, color: COLORES.textoGris, fontWeight: "bold" },
  montoTotal: { fontSize: 32, color: COLORES.primario, fontWeight: "900" },

  botonPrimario: {
    backgroundColor: COLORES.primario,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  textoBotonPrimario: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonSecundario: {
    backgroundColor: "transparent",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORES.textoGris,
  },
  textoBotonSecundario: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: COLORES.fondoOscuro,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitulo: { fontSize: 20, fontWeight: "bold", color: COLORES.textoBlanco },

  totalDisplay: {
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORES.primario,
    marginBottom: 25,
  },
  totalLabel: { color: COLORES.textoGris, fontSize: 14, marginBottom: 5 },
  totalValue: { color: COLORES.primario, fontSize: 36, fontWeight: "900" },

  seccionTitulo: {
    fontSize: 16,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    marginBottom: 15,
  },
  gridPagos: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  opcionPago: {
    width: "31%",
    padding: 15,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 12,
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  opcionPagoActivo: { borderColor: COLORES.primario },
  textoPago: { color: COLORES.textoGris, fontWeight: "bold", fontSize: 12 },
  textoPagoActivo: { color: COLORES.primario },

  labelInput: { color: COLORES.textoBlanco, marginBottom: 10, fontSize: 14 },
  inputGrande: {
    backgroundColor: COLORES.fondoTarjeta,
    color: COLORES.textoBlanco,
    fontSize: 24,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    textAlign: "center",
  },

  contenedorConfirmacion: { alignItems: "center", paddingVertical: 20 },
  tituloConfirmacion: {
    fontSize: 24,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    marginVertical: 15,
  },
  resumenConfirmacion: {
    width: "100%",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  labelResumen: { color: COLORES.textoGris, fontSize: 14 },
  valorResumen: {
    color: COLORES.textoBlanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  divisor: { height: 1, backgroundColor: COLORES.borde, marginVertical: 15 },
  labelResumenTotal: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  valorResumenTotal: {
    color: COLORES.primario,
    fontSize: 24,
    fontWeight: "900",
  },
  botonesConfirmacion: { flexDirection: "row", gap: 15, width: "100%" },

  contenedorExito: { alignItems: "center", paddingVertical: 40 },
  iconoExito: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(212, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  tituloExito: {
    fontSize: 24,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtituloExito: {
    fontSize: 14,
    color: COLORES.textoGris,
    textAlign: "center",
    marginBottom: 40,
  },
});
