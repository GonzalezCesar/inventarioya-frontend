import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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

const COLORES = {
  fondoOscuro: "#121212",
  fondoTarjeta: "#1E1E1E",
  fondoInput: "#1C1C1E",
  primario: "#D4FF00",
  textoBlanco: "#FFFFFF",
  textoGris: "#8E8E93",
  textoOscuro: "#121212",
  borde: "#2C2C2E",
  error: "#FF3B30",
};

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
}

export default function PantallaAjusteStock() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoKardex, setCargandoKardex] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState<"ajuste_entrada" | "ajuste_salida">(
    "ajuste_entrada",
  );
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");

  // UI
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);

  // 1. Cargar SOLO los productos al inicio
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const resProductos: any = await api.get("/productos");
      setProductos(resProductos || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setCargando(false);
    }
  };

  // 2. Cargar el KARDEX (Historial) SOLO cuando se selecciona un producto
  useEffect(() => {
    if (productoId) {
      cargarKardexDelProducto(productoId);
    } else {
      setMovimientos([]); // Limpiamos la lista si no hay producto
    }
  }, [productoId]);

  const cargarKardexDelProducto = async (id: string) => {
    setCargandoKardex(true);
    try {
      // Le enviamos el producto_id como lo exige tu backend
      const resMovimientos: any = await api.get(
        `/ventas/kardex?producto_id=${id}`,
      );
      setMovimientos(resMovimientos || []);
    } catch (error) {
      console.log("No se pudo cargar el historial del producto", error);
      setMovimientos([]);
    } finally {
      setCargandoKardex(false);
    }
  };

  // 3. Selectores y Filtros
  const productosSelector = useMemo(() => {
    if (!busquedaProducto) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.sku.toLowerCase().includes(busquedaProducto.toLowerCase()),
    );
  }, [productos, busquedaProducto]);

  const productoSeleccionado = productos.find(
    (p) => String(p.id) === String(productoId),
  );

  // 4. Registrar Movimiento
  const handleRegistrar = async () => {
    if (!productoId) return Alert.alert("Error", "Selecciona un producto");

    const cant = parseInt(cantidad);
    if (!cant || cant <= 0)
      return Alert.alert("Error", "Ingresa una cantidad válida mayor a 0");
    if (!motivo.trim())
      return Alert.alert("Error", "Ingresa el motivo del ajuste");

    if (
      tipo === "ajuste_salida" &&
      productoSeleccionado &&
      productoSeleccionado.stock < cant
    ) {
      Alert.alert(
        "Error",
        `Stock insuficiente. Solo tienes ${productoSeleccionado.stock} disponibles.`,
      );
      return;
    }

    setGuardando(true);
    try {
      await api.post("/productos/ajuste", {
        producto_id: productoId,
        cantidad: tipo === "ajuste_entrada" ? cant : -cant,
        tipo: tipo,
        motivo: motivo,
        usuario_id: user?.id,
      });

      Alert.alert("Éxito", "Movimiento registrado correctamente");
      setCantidad("");
      setMotivo("");

      // Actualizamos el stock global y el kardex de este producto
      await cargarProductos();
      await cargarKardexDelProducto(productoId);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo registrar el movimiento",
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatearFechaHora = (fechaString: string) => {
    if (!fechaString) return "";
    const date = new Date(fechaString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={estilos.contenedor}
    >
      <View style={estilos.encabezado}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => router.back()}
        >
          <FontAwesome5
            name="chevron-left"
            size={20}
            color={COLORES.textoBlanco}
          />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Movimientos de Inventario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- FORMULARIO AJUSTE --- */}
        <Text style={estilos.seccionTitulo}>REGISTRAR AJUSTE MANUAL</Text>

        <View style={estilos.tarjetaFormulario}>
          <Text style={estilos.label}>Producto</Text>
          <TouchableOpacity
            style={estilos.selector}
            onPress={() => setDesplegableAbierto(!desplegableAbierto)}
            activeOpacity={0.8}
          >
            <Text
              style={
                productoSeleccionado
                  ? estilos.textoSelector
                  : estilos.placeholderSelector
              }
            >
              {productoSeleccionado
                ? productoSeleccionado.nombre
                : "Seleccionar Producto..."}
            </Text>
          </TouchableOpacity>

          {/* DESPLEGABLE DE PRODUCTOS */}
          {desplegableAbierto && (
            <View style={estilos.dropdown}>
              <TextInput
                style={estilos.inputBusqueda}
                placeholder="Buscar producto..."
                placeholderTextColor={COLORES.textoGris}
                value={busquedaProducto}
                onChangeText={setBusquedaProducto}
              />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {cargando ? (
                  <ActivityIndicator
                    color={COLORES.primario}
                    style={{ padding: 20 }}
                  />
                ) : (
                  productosSelector.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={estilos.itemDropdown}
                      onPress={() => {
                        setProductoId(String(p.id));
                        setDesplegableAbierto(false);
                        setBusquedaProducto("");
                      }}
                    >
                      <Text style={estilos.textoItemDropdown}>{p.nombre}</Text>
                      <Text style={estilos.stockItemDropdown}>
                        Stock: {p.stock}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {productoSeleccionado && (
            <Text style={estilos.infoStock}>
              Stock Actual:{" "}
              <Text style={{ fontWeight: "bold", color: COLORES.primario }}>
                {productoSeleccionado.stock}
              </Text>
            </Text>
          )}

          {/* TIPO Y CANTIDAD */}
          <View style={estilos.filaInputs}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.label}>Tipo</Text>
              <View style={estilos.switchTipo}>
                <TouchableOpacity
                  style={[
                    estilos.opcionTipo,
                    tipo === "ajuste_entrada" && estilos.tipoEntradaActivo,
                    { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
                  ]}
                  onPress={() => setTipo("ajuste_entrada")}
                >
                  <Text
                    style={[
                      estilos.textoTipo,
                      tipo === "ajuste_entrada"
                        ? { color: COLORES.textoOscuro }
                        : { color: COLORES.textoGris },
                    ]}
                  >
                    Entrada
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    estilos.opcionTipo,
                    tipo === "ajuste_salida" && estilos.tipoSalidaActivo,
                    { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
                  ]}
                  onPress={() => setTipo("ajuste_salida")}
                >
                  <Text
                    style={[
                      estilos.textoTipo,
                      tipo === "ajuste_salida"
                        ? { color: COLORES.textoBlanco }
                        : { color: COLORES.textoGris },
                    ]}
                  >
                    Salida
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={estilos.label}>Cantidad</Text>
              <TextInput
                style={estilos.input}
                keyboardType="numeric"
                value={cantidad}
                onChangeText={setCantidad}
                placeholder="0"
                placeholderTextColor={COLORES.textoGris}
              />
            </View>
          </View>

          <Text style={estilos.label}>Motivo / Razón</Text>
          <TextInput
            style={estilos.input}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ej. Compra, Merma, Error..."
            placeholderTextColor={COLORES.textoGris}
          />

          <TouchableOpacity
            style={[
              estilos.botonRegistrar,
              tipo === "ajuste_entrada"
                ? { backgroundColor: COLORES.primario }
                : { backgroundColor: COLORES.error },
              guardando && { opacity: 0.7 },
            ]}
            onPress={handleRegistrar}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {guardando ? (
              <ActivityIndicator
                color={
                  tipo === "ajuste_entrada"
                    ? COLORES.textoOscuro
                    : COLORES.textoBlanco
                }
              />
            ) : (
              <Text
                style={[
                  estilos.textoBotonRegistrar,
                  tipo === "ajuste_entrada"
                    ? { color: COLORES.textoOscuro }
                    : { color: COLORES.textoBlanco },
                ]}
              >
                REGISTRAR MOVIMIENTO
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- HISTORIAL / KARDEX --- */}
        <View style={estilos.headerHistorial}>
          <Text style={[estilos.seccionTitulo, { marginBottom: 0 }]}>
            KARDEX DEL PRODUCTO
          </Text>
        </View>

        {!productoId ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={estilos.vacio}>
              Selecciona un producto para ver su historial
            </Text>
          </View>
        ) : cargandoKardex ? (
          <ActivityIndicator
            size="small"
            color={COLORES.primario}
            style={{ marginTop: 20 }}
          />
        ) : movimientos.length > 0 ? (
          movimientos.map((item, index) => {
            const esEntrada = parseFloat(item.cantidad) > 0;
            return (
              <View key={index} style={estilos.itemMovimiento}>
                <View style={estilos.colImagen}>
                  <FontAwesome5
                    name="box"
                    size={20}
                    color={COLORES.textoGris}
                  />
                </View>
                <View style={estilos.colInfo}>
                  <Text style={estilos.movProductoNombre}>
                    {item.producto_nombre ||
                      productoSeleccionado?.nombre ||
                      "Producto"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={[
                        estilos.movTipo,
                        { color: esEntrada ? COLORES.primario : COLORES.error },
                      ]}
                    >
                      {item.tipo
                        ? item.tipo.replace("_", " ").toUpperCase()
                        : "MOVIMIENTO"}
                    </Text>
                    <Text style={estilos.movFecha}>
                      {" "}
                      • {formatearFechaHora(item.fecha)}
                    </Text>
                  </View>
                  <Text style={estilos.movMotivo}>"{item.motivo}"</Text>
                </View>
                <View style={estilos.colCantidades}>
                  <Text
                    style={[
                      estilos.movCantidadGrande,
                      { color: esEntrada ? COLORES.primario : COLORES.error },
                    ]}
                  >
                    {esEntrada ? "+" : ""}
                    {item.cantidad}
                  </Text>
                  <Text style={estilos.movStockSaldo}>Stock</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={estilos.vacio}>
            Este producto aún no tiene movimientos.
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondoOscuro },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  botonVolver: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titulo: { fontSize: 20, fontWeight: "bold", color: COLORES.textoBlanco },
  contenido: { padding: 20 },

  seccionTitulo: {
    color: COLORES.textoGris,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },

  tarjetaFormulario: {
    marginBottom: 30,
  },
  label: {
    color: COLORES.textoGris,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },

  selector: {
    backgroundColor: COLORES.fondoTarjeta,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoSelector: { color: COLORES.textoBlanco, fontSize: 16 },
  placeholderSelector: { color: COLORES.textoGris, fontSize: 16 },
  infoStock: {
    color: COLORES.textoGris,
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },

  dropdown: {
    backgroundColor: COLORES.fondoTarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    marginTop: 5,
    overflow: "hidden",
  },
  inputBusqueda: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
    color: COLORES.textoBlanco,
    fontSize: 15,
  },
  itemDropdown: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoItemDropdown: { color: COLORES.textoBlanco, fontSize: 15 },
  stockItemDropdown: { color: COLORES.primario, fontWeight: "bold" },

  filaInputs: { flexDirection: "row", gap: 15, marginTop: 5 },
  input: {
    backgroundColor: COLORES.fondoTarjeta,
    color: COLORES.textoBlanco,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    fontSize: 16,
  },

  switchTipo: {
    flexDirection: "row",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.fondoTarjeta,
  },
  opcionTipo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tipoEntradaActivo: { backgroundColor: COLORES.primario },
  tipoSalidaActivo: { backgroundColor: COLORES.error },
  textoTipo: { fontWeight: "bold", fontSize: 15 },

  botonRegistrar: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },
  textoBotonRegistrar: {
    fontSize: 16,
    fontWeight: "900",
  },

  headerHistorial: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  itemMovimiento: {
    flexDirection: "row",
    backgroundColor: COLORES.fondoTarjeta,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  colImagen: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORES.fondoOscuro,
    justifyContent: "center",
    alignItems: "center",
  },
  colInfo: { flex: 1, paddingHorizontal: 15 },
  movProductoNombre: {
    color: COLORES.textoBlanco,
    fontWeight: "bold",
    fontSize: 15,
  },
  movTipo: { fontSize: 11, fontWeight: "bold" },
  movFecha: { color: COLORES.textoGris, fontSize: 11 },
  movMotivo: {
    color: COLORES.textoGris,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },

  colCantidades: { alignItems: "flex-end" },
  movCantidadGrande: { fontWeight: "900", fontSize: 18 },
  movStockSaldo: { color: COLORES.textoGris, fontSize: 11, marginTop: 2 },

  vacio: { color: COLORES.textoGris, textAlign: "center", marginTop: 20 },
});
