import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../contexts/ContextTheme";
import api from "../../services/api";

export default function GestionPlanesWeb() {
  const { colores } = useTheme();
  const [planes, setPlanes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false); // 🔥 Nuevo estado para el botón
  const [modalVisible, setModalVisible] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);

  const estadoInicial = {
    nombre: "",
    descripcion: "",
    precio_mensual: "",
    limite_productos: "",
    limite_vendedores: "",
    limite_ventas_mes: "",
    limite_clientes: "",
    limite_proveedores: "",
    limite_categorias: "",
    usa_caja: 1,
    usa_movimientos_inventario: 1,
    usa_movimientos_caja: 1,
    permite_credito: 1,
    activo: 1,
  };

  const [formData, setFormData] = useState(estadoInicial);

  useFocusEffect(
    useCallback(() => {
      cargarPlanes();
    }, []),
  );

  const cargarPlanes = async () => {
    try {
      setCargando(true);
      const res: any = await api.get("/planes");
      setPlanes(res || []);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los planes");
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setIdEditando(null);
    setFormData(estadoInicial);
    setModalVisible(true);
  };

  const abrirModalEditar = (p: any) => {
    setIdEditando(p.id);
    setFormData({
      nombre: p.nombre || "",
      descripcion: p.descripcion || "",
      precio_mensual: p.precio_mensual?.toString() || "",
      limite_productos: p.limite_productos?.toString() || "",
      limite_vendedores: p.limite_vendedores?.toString() || "",
      limite_ventas_mes: p.limite_ventas_mes?.toString() || "",
      limite_clientes: p.limite_clientes?.toString() || "",
      limite_proveedores: p.limite_proveedores?.toString() || "",
      limite_categorias: p.limite_categorias?.toString() || "",
      usa_caja: parseInt(p.usa_caja) || 0,
      usa_movimientos_inventario: parseInt(p.usa_movimientos_inventario) || 0,
      usa_movimientos_caja: parseInt(p.usa_movimientos_caja) || 0,
      permite_credito: parseInt(p.permite_credito) || 0,
      activo: parseInt(p.activo) === 0 ? 0 : 1,
    });
    setModalVisible(true);
  };

  const guardarPlan = async () => {
    // 🔥 Protegemos con String() para evitar crasheos si es número
    if (
      !String(formData.nombre).trim() ||
      !String(formData.precio_mensual).trim()
    ) {
      return Alert.alert(
        "Error",
        "El nombre y el precio mensual son obligatorios",
      );
    }

    setGuardando(true);
    try {
      const payload: any = { ...formData };

      // Convertimos los vacíos a null para MySQL
      const camposNumericos = [
        "limite_productos",
        "limite_vendedores",
        "limite_ventas_mes",
        "limite_clientes",
        "limite_proveedores",
        "limite_categorias",
      ];

      camposNumericos.forEach((campo) => {
        if (
          payload[campo] === "" ||
          payload[campo] === null ||
          payload[campo] === undefined
        ) {
          payload[campo] = null;
        } else {
          payload[campo] = parseInt(payload[campo], 10);
        }
      });

      payload.precio_mensual = parseFloat(payload.precio_mensual) || 0;

      if (idEditando) {
        await api.put(`/planes/${idEditando}`, payload);
        Alert.alert("Éxito", "Plan actualizado correctamente");
      } else {
        await api.post("/planes", payload);
        Alert.alert("Éxito", "Plan creado correctamente");
      }
      setModalVisible(false);
      cargarPlanes();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "No se pudo guardar el plan",
      );
    } finally {
      setGuardando(false);
    }
  };

  const RenderizarSwitch = ({
    label,
    campo,
  }: {
    label: string;
    campo: keyof typeof formData;
  }) => (
    <View style={estilos.filaSwitch}>
      <Text style={estilos.textoSwitch}>{label}</Text>
      <Switch
        value={formData[campo] === 1}
        onValueChange={(val) =>
          setFormData({ ...formData, [campo]: val ? 1 : 0 })
        }
        trackColor={{ false: "rgba(255,255,255,0.1)", true: "#c6ff00" }}
        thumbColor={formData[campo] === 1 ? "#000" : "#8a8a8a"}
      />
    </View>
  );

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Gestión de Planes (SaaS)</Text>
          <Text style={estilos.subtitulo}>
            Crea y edita los planes de suscripción para tus clientes.
          </Text>
        </View>
        <TouchableOpacity
          style={estilos.btnPrincipal}
          onPress={abrirModalCrear}
        >
          <FontAwesome5 name="plus" size={14} color="#000" />
          <Text style={estilos.btnTexto}> Crear Nuevo Plan</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.grid}>
        {planes.map((p) => (
          <View
            key={p.id}
            style={[estilos.card, p.activo == 0 && { opacity: 0.5 }]}
          >
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text style={estilos.planNombre}>{p.nombre}</Text>
              {p.activo == 0 && (
                <Text style={estilos.badgeInactivo}>Inactivo</Text>
              )}
            </View>

            <Text style={estilos.planPrecio}>
              ${parseFloat(p.precio_mensual).toFixed(2)}
              <Text style={{ fontSize: 14, color: "#8a8a8a" }}>/mes</Text>
            </Text>

            <View style={estilos.listaLimites}>
              <Text style={estilos.itemLimite}>
                Ventas al mes: {p.limite_ventas_mes || "Ilimitadas"}
              </Text>
              <Text style={estilos.itemLimite}>
                Productos: {p.limite_productos || "Ilimitados"}
              </Text>
              <Text style={estilos.itemLimite}>
                Vendedores: {p.limite_vendedores || "Ilimitados"}
              </Text>
            </View>

            <TouchableOpacity
              style={estilos.btnEditar}
              onPress={() => abrirModalEditar(p)}
            >
              <FontAwesome5 name="edit" size={12} color="#c6ff00" />
              <Text style={{ color: "#c6ff00", fontWeight: "bold" }}>
                {" "}
                Editar Plan
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.tituloModal}>
                {idEditando ? "Editar Plan" : "Crear Nuevo Plan"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={estilos.seccionTitulo}>INFORMACIÓN GENERAL</Text>
              <View style={estilos.filaInputs}>
                <View style={{ flex: 2 }}>
                  <Text style={estilos.label}>Nombre del Plan *</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.nombre}
                    onChangeText={(t) =>
                      setFormData({ ...formData, nombre: t })
                    }
                    placeholder="Ej. Plan Pro"
                    placeholderTextColor="#555"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Precio Mensual ($) *</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.precio_mensual}
                    onChangeText={(t) =>
                      setFormData({ ...formData, precio_mensual: t })
                    }
                    keyboardType="decimal-pad"
                    placeholder="20.00"
                    placeholderTextColor="#555"
                  />
                </View>
              </View>

              <Text style={estilos.label}>Descripción</Text>
              <TextInput
                style={estilos.input}
                value={formData.descripcion}
                onChangeText={(t) =>
                  setFormData({ ...formData, descripcion: t })
                }
                placeholder="Detalles del plan..."
                placeholderTextColor="#555"
              />

              <Text style={[estilos.seccionTitulo, { marginTop: 25 }]}>
                LÍMITES (Dejar en blanco para ilimitado)
              </Text>
              <View style={estilos.filaInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Ventas al mes</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_ventas_mes}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_ventas_mes: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Productos</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_productos}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_productos: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Vendedores</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_vendedores}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_vendedores: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
              </View>

              <View style={estilos.filaInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Clientes</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_clientes}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_clientes: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Proveedores</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_proveedores}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_proveedores: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.label}>Categorías</Text>
                  <TextInput
                    style={estilos.input}
                    value={formData.limite_categorias}
                    onChangeText={(t) =>
                      setFormData({ ...formData, limite_categorias: t })
                    }
                    keyboardType="numeric"
                    placeholder="Ilimitado"
                    placeholderTextColor="#555"
                  />
                </View>
              </View>

              <Text style={[estilos.seccionTitulo, { marginTop: 25 }]}>
                MÓDULOS PERMITIDOS
              </Text>
              <View style={estilos.gridSwitches}>
                <RenderizarSwitch
                  label="Habilitar Caja Registradora"
                  campo="usa_caja"
                />
                <RenderizarSwitch
                  label="Ajustes Manuales de Inventario"
                  campo="usa_movimientos_inventario"
                />
                <RenderizarSwitch
                  label="Ingresos/Egresos Extra en Caja"
                  campo="usa_movimientos_caja"
                />
                <RenderizarSwitch
                  label="Ventas a Crédito (Por Cobrar)"
                  campo="permite_credito"
                />
                <View
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    marginVertical: 10,
                  }}
                />
                <RenderizarSwitch
                  label="PLAN ACTIVO (Visible)"
                  campo="activo"
                />
              </View>

              {/* 🔥 BOTONES MOVIDOS ADENTRO DEL SCROLLVIEW PARA ASEGURAR QUE SEAN CLICABLES */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 15,
                  marginTop: 30,
                  paddingBottom: 20,
                }}
              >
                <TouchableOpacity
                  style={[estilos.btn, { backgroundColor: "#2a2a2a" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    estilos.btn,
                    { backgroundColor: "#c6ff00" },
                    guardando && { opacity: 0.7 },
                  ]}
                  onPress={guardarPlan}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={{ color: "#000", fontWeight: "bold" }}>
                      Guardar Plan
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#0d110d" },
  contenido: { padding: 30, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  titulo: { color: "#FFF", fontSize: 28, fontWeight: "bold" },
  subtitulo: { color: "#8a8a8a", fontSize: 14, marginTop: 5 },
  btnPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c6ff00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnTexto: { color: "#000", fontWeight: "bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  card: {
    width: 280,
    backgroundColor: "#1a1a1a",
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  planNombre: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  badgeInactivo: {
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    color: "#ff4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "bold",
  },
  planPrecio: {
    color: "#c6ff00",
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 15,
  },
  listaLimites: { marginBottom: 20 },
  itemLimite: { color: "#e0e0e0", fontSize: 13, marginBottom: 5 },
  btnEditar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(198, 255, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 16,
    width: "100%",
    maxWidth: 700,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tituloModal: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
  seccionTitulo: {
    color: "#8a8a8a",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 5,
  },
  filaInputs: { flexDirection: "row", gap: 15, marginBottom: 10 },
  label: { color: "#8a8a8a", fontSize: 12, marginBottom: 5 },
  input: {
    backgroundColor: "#0d110d",
    color: "#FFF",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
  },
  gridSwitches: {
    backgroundColor: "#0d110d",
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  filaSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  textoSwitch: { color: "#FFF", fontSize: 14 },
  btn: { flex: 1, padding: 15, alignItems: "center", borderRadius: 10 },
});
