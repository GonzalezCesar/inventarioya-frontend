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
import api from "../../services/api";

// --- TEMA HARDCODEADO (Pixel Perfect) ---
const COLORES = {
  fondoOscuro: "#121212", // Negro profundo
  fondoTarjeta: "#1E1E1E", // Gris oscuro para tarjetas
  fondoInput: "#1A1A1A", // Gris aún más oscuro para inputs
  primario: "#D4FF00", // Verde Neón
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  exito: "#34C759",
  error: "#FF3B30",
};

const API_URL_UPLOADS = "http://192.168.1.111:8000/uploads/"; // Ajusta tu IP si es necesario

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

  // Estados de Base de Datos
  const [productosBD, setProductosBD] = useState<Producto[]>([]);
  const [clientesBD, setClientesBD] = useState<Cliente[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados Principales
  const [busqueda, setBusqueda] = useState("");
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Clientes
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(
    null,
  );
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
  });

  // Estados del Modal de Pago
  const [modalVisible, setModalVisible] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
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

  const formatearMoneda = (monto: number) => `$ ${(monto || 0).toFixed(2)}`;
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

  // --- LÓGICA DEL CARRITO ---
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
      setCarrito(carrito.filter((i) => i.producto.id !== id));
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

  // --- LÓGICA DE CLIENTES ---
  const crearClienteRapido = async () => {
    if (!nuevoCliente.nombre.trim())
      return Alert.alert("Error", "El nombre es obligatorio");

    setCargando(true);
    try {
      const res: any = await api.post("/clientes", nuevoCliente);
      const resClis: any = await api.get("/clientes");
      setClientesBD(resClis || []);
      setClienteSeleccionado(res.id);
      setMostrarNuevoCliente(false);
      setNuevoCliente({ nombre: "", cedula: "", telefono: "" });
      Alert.alert("Éxito", "Cliente guardado correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el cliente");
    } finally {
      setCargando(false);
    }
  };

  // --- FLUJO DE VENTA ---
  const abrirModalPago = () => {
    if (carrito.length === 0) return;
    setFaseModal("pago");
    setMontoRecibido("");
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
      const payload = {
        clienteId: clienteSeleccionado, // Corregido a CamelCase
        total: total,
        subtotal: total,
        metodoPago: metodoPago, // Corregido a CamelCase
        montoPagado: recibidoFloat, // Corregido a CamelCase (según tus types viejos)
        estadoPago: metodoPago === "credito" ? "pendiente" : "completo", // Corregido a CamelCase
        items: carrito.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          subtotal: item.subtotal,
        })),
      };

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
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(18,18,18,0.8)",
              zIndex: 1000,
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
      <View style={{ zIndex: 999 }}>
        <View style={estilos.barraBusqueda}>
          <FontAwesome5 name="search" size={18} color={COLORES.textoGris} />
          <TextInput
            style={estilos.inputBusqueda}
            placeholder="Buscar producto..."
            placeholderTextColor={COLORES.textoGris}
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
                        <FontAwesome5 name="box" color={COLORES.textoGris} />
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
                <Text
                  style={{
                    color: COLORES.textoGris,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  No hay resultados
                </Text>
              }
            />
          </View>
        )}
      </View>

      <Text style={estilos.tituloCarrito}>Carrito ({carrito.length})</Text>

      {/* Lista del Carrito */}
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
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <FontAwesome5
              name="shopping-cart"
              size={60}
              color={COLORES.borde}
            />
            <Text style={{ color: COLORES.textoGris, marginTop: 15 }}>
              El carrito está vacío
            </Text>
          </View>
        }
      />

      {/* Footer Total */}
      <View style={estilos.footer}>
        <View style={estilos.totalContenedor}>
          <Text
            style={{
              fontSize: 16,
              color: COLORES.textoGris,
              fontWeight: "bold",
            }}
          >
            TOTAL
          </Text>
          <Text
            style={{ fontSize: 32, color: COLORES.primario, fontWeight: "900" }}
          >
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
            {/* Header del Modal (Excepto Éxito) */}
            {faseModal !== "exito" && (
              <View style={estilos.modalHeader}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: COLORES.textoBlanco,
                  }}
                >
                  {faseModal === "confirmacion"
                    ? "Confirmar"
                    : "Completar Venta"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome5
                    name="times"
                    size={20}
                    color={COLORES.textoGris}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* --- FASE 1: COMPLETAR VENTA (Selección de Método) --- */}
            {faseModal === "pago" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Total a Cobrar (Estilo Neon) */}
                <View style={estilos.totalDisplay}>
                  <Text
                    style={{
                      color: COLORES.primario,
                      fontSize: 40,
                      fontWeight: "900",
                    }}
                  >
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
                    <TouchableOpacity
                      onPress={() =>
                        setMostrarNuevoCliente(!mostrarNuevoCliente)
                      }
                    >
                      <Text
                        style={{
                          color: COLORES.primario,
                          fontWeight: "bold",
                          fontSize: 13,
                        }}
                      >
                        {mostrarNuevoCliente ? "Cancelar" : "+ Nuevo Cliente"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {mostrarNuevoCliente ? (
                    <View style={estilos.formCliente}>
                      <TextInput
                        style={estilos.input}
                        placeholder="Nombre *"
                        placeholderTextColor={COLORES.textoGris}
                        value={nuevoCliente.nombre}
                        onChangeText={(t) =>
                          setNuevoCliente({ ...nuevoCliente, nombre: t })
                        }
                      />
                      <TextInput
                        style={estilos.input}
                        placeholder="Cédula"
                        placeholderTextColor={COLORES.textoGris}
                        value={nuevoCliente.cedula}
                        onChangeText={(t) =>
                          setNuevoCliente({ ...nuevoCliente, cedula: t })
                        }
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={estilos.input}
                        placeholder="Teléfono"
                        placeholderTextColor={COLORES.textoGris}
                        value={nuevoCliente.telefono}
                        onChangeText={(t) =>
                          setNuevoCliente({ ...nuevoCliente, telefono: t })
                        }
                        keyboardType="phone-pad"
                      />
                      <TouchableOpacity
                        style={[
                          estilos.botonPrimario,
                          { marginTop: 10, padding: 12 },
                        ]}
                        onPress={crearClienteRapido}
                        disabled={cargando}
                      >
                        {cargando ? (
                          <ActivityIndicator color={COLORES.textoOscuro} />
                        ) : (
                          <Text style={estilos.textoBotonPrimario}>
                            Guardar Cliente
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={estilos.buscadorClientes}>
                        <FontAwesome5
                          name="search"
                          size={14}
                          color={COLORES.textoGris}
                        />
                        <TextInput
                          style={estilos.inputBuscador}
                          placeholder="Buscar por nombre o cédula..."
                          placeholderTextColor={COLORES.textoGris}
                        />
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 10 }}
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
                                color: COLORES.textoOscuro,
                              },
                            ]}
                          >
                            Mostrador
                          </Text>
                        </TouchableOpacity>
                        {clientesBD.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              estilos.chipCliente,
                              clienteSeleccionado === c.id &&
                                estilos.chipClienteActivo,
                            ]}
                            onPress={() => setClienteSeleccionado(c.id)}
                          >
                            <Text
                              style={[
                                estilos.textoChipCliente,
                                clienteSeleccionado === c.id && {
                                  color: COLORES.textoOscuro,
                                },
                              ]}
                            >
                              {c.nombre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>

                {/* MÉTODOS DE PAGO (4 Opciones en Grid 2x2) */}
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
                        size={20}
                        color={
                          metodoPago === metodo.id
                            ? COLORES.primario
                            : COLORES.textoGris
                        }
                      />
                      <Text
                        style={{
                          color:
                            metodoPago === metodo.id
                              ? COLORES.primario
                              : COLORES.textoGris,
                          fontSize: 13,
                          fontWeight: "bold",
                          marginTop: 8,
                        }}
                      >
                        {metodo.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {metodoPago === "efectivo" && (
                  <View style={{ marginTop: 20 }}>
                    <Text
                      style={{ color: COLORES.textoBlanco, marginBottom: 10 }}
                    >
                      Dinero Recibido
                    </Text>
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
            )}

            {/* --- FASE 2: CONFIRMAR VENTA (IDÉNTICO A LA FOTO) --- */}
            {faseModal === "confirmacion" && (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <Text
                  style={{
                    fontSize: 24,
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    marginVertical: 20,
                  }}
                >
                  ¿Confirmar Venta?
                </Text>

                {/* Cuadro Oscuro de Resumen */}
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
                      {metodoPago.replace("_", " ").toUpperCase()}
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

                {/* Botones de Acción */}
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
                      <ActivityIndicator color={COLORES.textoOscuro} />
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
                  style={{
                    transform: [{ scale: animacionEscala }],
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "rgba(212, 255, 0, 0.1)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <FontAwesome5
                    name="check"
                    size={50}
                    color={COLORES.primario}
                  />
                </Animated.View>
                <Text
                  style={{
                    fontSize: 24,
                    color: COLORES.textoBlanco,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  ¡Venta Exitosa!
                </Text>
                <TouchableOpacity
                  style={[
                    estilos.botonPrimario,
                    { width: "100%", marginTop: 20 },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={estilos.textoBotonPrimario}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
    marginBottom: 10,
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
    top: 65,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  itemProductoBusqueda: {
    flexDirection: "row",
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
  nombreProductoBusqueda: {
    fontSize: 14,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
  },
  skuProductoBusqueda: { fontSize: 12, color: COLORES.textoGris, marginTop: 2 },
  precioProductoBusqueda: {
    fontSize: 16,
    color: COLORES.primario,
    fontWeight: "bold",
  },

  tituloCarrito: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORES.textoBlanco,
    marginHorizontal: 20,
    marginVertical: 15,
  },
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
    borderRadius: 8,
    backgroundColor: COLORES.fondoOscuro,
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

  // Total Neón del Modal de Completar
  totalDisplay: {
    alignItems: "center",
    paddingVertical: 25,
    backgroundColor: COLORES.fondoInput,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORES.primario,
    marginBottom: 25,
  },

  seccion: { marginBottom: 25 },
  seccionTitulo: {
    fontSize: 18,
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    marginBottom: 15,
  },

  buscadorClientes: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORES.fondoInput,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputBuscador: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    color: COLORES.textoBlanco,
  },

  chipCliente: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginRight: 10,
  },
  chipClienteActivo: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primario,
  },
  textoChipCliente: { color: COLORES.textoGris, fontWeight: "bold" },
  formCliente: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  input: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },

  // Grid 2x2 Métodos de Pago
  gridPagos: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  opcionPago: {
    width: "48%",
    paddingVertical: 20,
    backgroundColor: COLORES.fondoTarjeta,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 5,
  },
  opcionPagoActivo: {
    borderColor: COLORES.primario,
    backgroundColor: "rgba(212, 255, 0, 0.05)",
  },
  inputGrande: {
    backgroundColor: COLORES.fondoInput,
    color: COLORES.textoBlanco,
    fontSize: 24,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    textAlign: "center",
  },

  // --- NUEVOS ESTILOS FASE CONFIRMACIÓN ---
  cuadroResumen: {
    width: "100%",
    backgroundColor: COLORES.fondoInput,
    padding: 25,
    borderRadius: 16,
    marginBottom: 30,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  labelResumen: { color: COLORES.textoGris, fontSize: 16 },
  valorResumen: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },
  divisorResumen: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: 15,
  },
  filaResumenTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  textoTotalResumen: {
    color: COLORES.textoOscuro,
    backgroundColor: COLORES.fondoOscuro,
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  }, // Letras grises/oscuras en "TOTAL A PAGAR:"
  valorTotalResumen: {
    color: COLORES.primario,
    fontWeight: "900",
    fontSize: 24,
  },

  filaBotonesAccion: { flexDirection: "row", gap: 15, width: "100%" },
  botonVolverAccion: {
    flex: 1,
    backgroundColor: COLORES.fondoTarjeta,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  textoBotonVolverAccion: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: "bold",
  },
  botonConfirmarAccion: {
    flex: 1,
    backgroundColor: COLORES.primario,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  textoBotonConfirmarAccion: {
    color: COLORES.textoOscuro,
    fontSize: 16,
    fontWeight: "bold",
  },
});
