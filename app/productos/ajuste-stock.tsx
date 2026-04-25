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
import { useTheme } from "../../contexts/ContextTheme"; // 🔥 Importamos el tema global
import api from "../../services/api";

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
}

export default function PantallaAjusteStock() {
  const router = useRouter();
  const { user } = useAuth();

  // 🔥 Conectamos al Tema Global
  const { colores, isDark } = useTheme();
  const estilos = useMemo(
    () => crearEstilos(colores, isDark),
    [colores, isDark],
  );

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
      setMovimientos([]);
    }
  }, [productoId]);

  const cargarKardexDelProducto = async (id: string) => {
    setCargandoKardex(true);
    try {
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
        (p.sku && p.sku.toLowerCase().includes(busquedaProducto.toLowerCase())),
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
      const payload = {
        productoId: productoId,
        cantidad: tipo === "ajuste_entrada" ? cant : -cant,
        tipo: tipo,
        motivo: motivo,
      };

      const respuestaBackend: any = await api.post(
        "/productos/ajustar",
        payload,
      );

      if (respuestaBackend && respuestaBackend.success) {
        Alert.alert("Éxito", "Movimiento registrado correctamente");
        setCantidad("");
        setMotivo("");
        setDesplegableAbierto(false);

        await cargarProductos();
        await cargarKardexDelProducto(productoId);
      } else {
        throw new Error(respuestaBackend?.error || "Error desconocido");
      }
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

  // Restauramos los colores originales para los badges
  const obtenerDetallesMovimiento = (tipoMov: string, cant: number) => {
    switch (tipoMov) {
      case "venta":
        return { icono: "shopping-cart", color: "#00D1FF", texto: "Venta" };
      case "compra":
        return { icono: "truck", color: colores.primario, texto: "Compra" };
      case "ajuste_entrada":
        return {
          icono: "plus-circle",
          color: colores.primario,
          texto: "Ajuste (+)",
        };
      case "ajuste_salida":
        return {
          icono: "minus-circle",
          color: colores.error,
          texto: "Ajuste (-)",
        };
      case "devolucion":
        return {
          icono: "undo-alt",
          color: colores.primario,
          texto: "Devolución",
        };
      case "inicial":
        return { icono: "flag", color: colores.textoBlanco, texto: "Inicial" };
      default:
        return {
          icono: "exchange-alt",
          color: cant > 0 ? colores.primario : colores.error,
          texto: "Movimiento",
        };
    }
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
            color={colores.textoBlanco}
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
        <View style={estilos.cardFormulario}>
          <Text style={estilos.tituloSeccion}>REGISTRAR AJUSTE MANUAL</Text>

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
            <FontAwesome5
              name={desplegableAbierto ? "chevron-up" : "chevron-down"}
              size={16}
              color={colores.textoGris}
            />
          </TouchableOpacity>

          {/* DESPLEGABLE DE PRODUCTOS */}
          {desplegableAbierto && (
            <View style={estilos.dropdown}>
              <TextInput
                style={estilos.inputBusqueda}
                placeholder="Buscar producto..."
                placeholderTextColor={colores.textoGris}
                value={busquedaProducto}
                onChangeText={setBusquedaProducto}
              />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {cargando ? (
                  <ActivityIndicator
                    color={colores.primario}
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
              <Text style={{ fontWeight: "bold", color: colores.primario }}>
                {productoSeleccionado.stock}
              </Text>
            </Text>
          )}

          {/* TIPO Y CANTIDAD (Estilo Switch Integrado Original) */}
          <View style={estilos.filaInputs}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.label}>Tipo</Text>
              <View style={estilos.switchTipo}>
                <TouchableOpacity
                  style={[
                    estilos.opcionTipo,
                    tipo === "ajuste_entrada" && estilos.tipoEntradaActivo,
                    { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
                  ]}
                  onPress={() => setTipo("ajuste_entrada")}
                >
                  <Text
                    style={[
                      estilos.textoTipo,
                      tipo === "ajuste_entrada"
                        ? { color: colores.textoOscuro }
                        : { color: colores.textoGris },
                    ]}
                  >
                    Entrada
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    estilos.opcionTipo,
                    tipo === "ajuste_salida" && estilos.tipoSalidaActivo,
                    { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
                  ]}
                  onPress={() => setTipo("ajuste_salida")}
                >
                  <Text
                    style={[
                      estilos.textoTipo,
                      tipo === "ajuste_salida"
                        ? { color: colores.textoBlanco }
                        : { color: colores.textoGris },
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
                placeholderTextColor={colores.textoGris}
              />
            </View>
          </View>

          <Text style={estilos.label}>Motivo / Razón</Text>
          <TextInput
            style={estilos.input}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ej. Compra, Merma, Error..."
            placeholderTextColor={colores.textoGris}
          />

          <TouchableOpacity
            style={[
              estilos.botonRegistrar,
              tipo === "ajuste_entrada"
                ? { backgroundColor: colores.primario }
                : { backgroundColor: colores.error },
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
                    ? colores.textoOscuro
                    : colores.textoBlanco
                }
              />
            ) : (
              <Text
                style={[
                  estilos.textoBotonRegistrar,
                  tipo === "ajuste_entrada"
                    ? { color: colores.textoOscuro }
                    : { color: colores.textoBlanco },
                ]}
              >
                REGISTRAR MOVIMIENTO
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- HISTORIAL / KARDEX --- */}
        <View style={estilos.headerHistorial}>
          <Text style={[estilos.tituloSeccion, { marginBottom: 0 }]}>
            KARDEX / HISTORIAL
          </Text>
        </View>

        {/* Banner verde al estilo viejo */}
        {productoSeleccionado && (
          <View style={estilos.bannerFiltro}>
            <Text style={estilos.textoBannerFiltro}>
              Viendo historial de: {productoSeleccionado.nombre}
            </Text>
          </View>
        )}

        {!productoId ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={estilos.vacio}>
              Selecciona un producto para ver su historial
            </Text>
          </View>
        ) : cargandoKardex ? (
          <ActivityIndicator
            size="large"
            color={colores.primario}
            style={{ marginTop: 20 }}
          />
        ) : movimientos.length > 0 ? (
          movimientos.map((item, index) => {
            const cantNum = parseFloat(item.cantidad);
            const esEntrada = cantNum > 0;
            const detalles = obtenerDetallesMovimiento(item.tipo, cantNum);

            return (
              <View key={index} style={estilos.itemMovimiento}>
                <View style={estilos.colImagen}>
                  <FontAwesome5
                    name={detalles.icono}
                    size={20}
                    color={colores.textoGris}
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
                    <Text style={[estilos.movTipo, { color: detalles.color }]}>
                      {detalles.texto}
                    </Text>
                    <Text style={estilos.movFecha}>
                      {" "}
                      • {formatearFechaHora(item.fecha)}
                    </Text>
                  </View>
                  {item.motivo ? (
                    <Text style={estilos.movMotivo}>"{item.motivo}"</Text>
                  ) : null}
                  {item.usuario_nombre && (
                    <Text
                      style={{
                        color: colores.textoGris,
                        fontSize: 10,
                        marginTop: 2,
                      }}
                    >
                      Por: {item.usuario_nombre}
                    </Text>
                  )}
                </View>
                <View style={estilos.colCantidades}>
                  <Text
                    style={[
                      estilos.movCantidadGrande,
                      { color: esEntrada ? colores.primario : colores.error },
                    ]}
                  >
                    {esEntrada ? "+" : ""}
                    {cantNum}
                  </Text>
                  <Text style={estilos.movStockSaldo}>
                    {item.stock_anterior ?? "-"} → {item.stock_nuevo ?? "-"}
                  </Text>
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

// 🔥 ESTILOS DINÁMICOS
const crearEstilos = (c: any, isDark: boolean) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondoOscuro },
    encabezado: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    botonVolver: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    titulo: { fontSize: 20, fontWeight: "bold", color: c.textoBlanco },
    contenido: { padding: 20 },

    cardFormulario: {
      backgroundColor: c.fondoTarjeta,
      padding: 15,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.borde,
    },
    tituloSeccion: {
      color: c.textoGris,
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 10,
      letterSpacing: 1,
    },
    label: { color: c.textoGris, fontSize: 12, marginBottom: 5, marginTop: 10 },

    selector: {
      backgroundColor: c.fondoOscuro,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    textoSelector: { color: c.textoBlanco, fontSize: 15 },
    placeholderSelector: { color: c.textoGris, fontSize: 15 },
    infoStock: {
      color: c.textoGris,
      fontSize: 12,
      marginTop: 8,
      textAlign: "right",
    },

    dropdown: {
      backgroundColor: c.fondoOscuro,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 12,
      marginTop: 5,
      overflow: "hidden",
    },
    inputBusqueda: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      color: c.textoBlanco,
      fontSize: 15,
    },
    itemDropdown: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    textoItemDropdown: { color: c.textoBlanco, fontSize: 15 },
    stockItemDropdown: { color: c.primario, fontWeight: "bold" },

    filaInputs: { flexDirection: "row", gap: 15, marginTop: 5 },
    input: {
      backgroundColor: c.fondoOscuro,
      color: c.textoBlanco,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borde,
      fontSize: 16,
    },

    // Switch de Entrada/Salida
    switchTipo: {
      flexDirection: "row",
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.fondoOscuro,
    },
    opcionTipo: { flex: 1, justifyContent: "center", alignItems: "center" },
    tipoEntradaActivo: { backgroundColor: c.primario },
    tipoSalidaActivo: { backgroundColor: c.error },
    textoTipo: { fontWeight: "bold", fontSize: 14 },

    botonRegistrar: {
      padding: 18,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 25,
    },
    textoBotonRegistrar: { fontSize: 16, fontWeight: "900" },

    headerHistorial: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      marginTop: 10,
    },

    bannerFiltro: {
      backgroundColor: isDark ? "rgba(212, 255, 0, 0.1)" : c.primario,
      padding: 12,
      borderRadius: 10,
      marginBottom: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoBannerFiltro: {
      color: isDark ? c.primario : c.textoOscuro,
      fontWeight: "bold",
      fontSize: 13,
    },

    itemMovimiento: {
      flexDirection: "row",
      backgroundColor: c.fondoTarjeta,
      padding: 15,
      borderRadius: 16,
      marginBottom: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borde,
    },
    colImagen: {
      width: 45,
      height: 45,
      borderRadius: 12,
      backgroundColor: c.fondoOscuro,
      justifyContent: "center",
      alignItems: "center",
    },
    colInfo: { flex: 1, paddingHorizontal: 15 },
    movProductoNombre: {
      color: c.textoBlanco,
      fontWeight: "bold",
      fontSize: 15,
    },
    movTipo: { fontSize: 11, fontWeight: "bold" },
    movFecha: { color: c.textoGris, fontSize: 11 },
    movMotivo: {
      color: c.textoGris,
      fontSize: 13,
      fontStyle: "italic",
      marginTop: 4,
    },

    colCantidades: { alignItems: "flex-end" },
    movCantidadGrande: { fontWeight: "900", fontSize: 18 },
    movStockSaldo: { color: c.textoGris, fontSize: 11, marginTop: 2 },

    vacio: { color: c.textoGris, textAlign: "center", marginTop: 20 },
  });
