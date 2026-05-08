import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api";
import { API_URL_UPLOADS } from "../../config/env";

export default function ClientesSaaSWeb() {
  const [cargando, setCargando] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    suspendidos: 0,
    activosHoy: 0,
    ingresos: 0,
  });

  // Modales
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [modalPagoVisible, setModalPagoVisible] = useState(false);

  // Estado del Formulario
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre_negocio: "",
    nombre: "",
    email: "",
    telefono: "",
    contrasena: "",
    fecha_vencimiento: "",
    rol: "administrador",
  });

  // Estado Ver Pago
  const [pagoViendo, setPagoViendo] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, []),
  );

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res: any = await api.get("/usuarios?superadmin=true");

      const filtrados = (res || []).filter((u: any) => {
        const emailSafe = u.email ? u.email.toLowerCase() : "";
        return (
          emailSafe !== "litoramirez2005@gmail.com" &&
          u.id !== "admin_init_001" &&
          u.id !== "admin_001"
        );
      });

      setUsuarios(filtrados);
      calcularStats(filtrados);
    } catch (error) {
      console.error("Error al cargar clientes SaaS:", error);
      Alert.alert("Error", "No se pudo cargar la lista de clientes.");
    } finally {
      setCargando(false);
    }
  };

  const calcularStats = (lista: any[]) => {
    const total = lista.length;
    const suspendidos = lista.filter(
      (u) => u.activo == 0 || u.activo === false,
    ).length;
    const hoyStr = new Date().toISOString().split("T")[0];
    const activosHoy = lista.filter(
      (u) => u.ultima_conexion && u.ultima_conexion.startsWith(hoyStr),
    ).length;

    // Estimación de ingresos (clientes validados * $20)
    const validados = lista.filter((u) => u.estado_pago === "validado").length;
    const ingresos = validados * 20;

    setStats({ total, suspendidos, activosHoy, ingresos });
  };

  // --- ACCIONES RÁPIDAS ---
  const suspenderUsuario = async (u: any) => {
    const nuevoEstado = u.activo == 1 || u.activo === true ? 0 : 1;
    const msj =
      nuevoEstado === 0
        ? "¿Deseas suspender el acceso a este cliente? No podrá entrar a la App."
        : "¿Deseas reactivar el acceso del cliente?";

    if (confirm(msj)) {
      try {
        await api.put(`/usuarios/${u.id}`, { id: u.id, activo: nuevoEstado });
        cargarUsuarios();
      } catch (error) {
        Alert.alert("Error", "No se pudo cambiar el estado del usuario.");
      }
    }
  };

  const borrarUsuario = async (u: any) => {
    if (
      confirm(
        `¡Atención!\n¿Estás seguro de borrar a "${u.nombre_negocio || u.nombre}" permanentemente? Esta acción NO se puede deshacer.`,
      )
    ) {
      try {
        await api.delete(`/usuarios/${u.id}`);
        cargarUsuarios();
      } catch (error) {
        Alert.alert("Error", "No se pudo eliminar el usuario.");
      }
    }
  };

  // --- FORMULARIO ---
  const abrirFormulario = (u: any = null) => {
    if (u) {
      setIdEditando(u.id);
      setFormData({
        nombre_negocio: u.nombre_negocio || "",
        nombre: u.nombre || "",
        email: u.email || "",
        telefono: u.telefono || "",
        contrasena: "",
        fecha_vencimiento: u.fecha_vencimiento
          ? u.fecha_vencimiento.split(" ")[0]
          : "",
        rol: u.rol || "administrador",
      });
    } else {
      setIdEditando(null);
      setFormData({
        nombre_negocio: "",
        nombre: "",
        email: "",
        telefono: "",
        contrasena: "",
        fecha_vencimiento: "",
        rol: "administrador",
      });
    }
    setModalFormVisible(true);
  };

  const guardarUsuario = async () => {
    try {
      if (idEditando) {
        const payload: any = { ...formData, id: idEditando };
        if (!formData.contrasena) delete payload.contrasena;
        await api.put(`/usuarios/${idEditando}`, payload);
        Alert.alert("Éxito", "Cliente actualizado.");
      } else {
        if (!formData.contrasena)
          return Alert.alert("Error", "La contraseña es obligatoria.");
        await api.post("/superadmin", formData);
        Alert.alert("Éxito", "Cliente registrado.");
      }
      setModalFormVisible(false);
      cargarUsuarios();
    } catch (error: any) {
      const mensajeServidor =
        error.response?.data?.error ||
        error.message ||
        "Hubo un problema al guardar.";
      Alert.alert("Error del Servidor", mensajeServidor);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-ES");
  };

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      {/* HEADER */}
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Gestión de Clientes (SaaS)</Text>
          <Text style={estilos.subtitulo}>
            Aquí das de alta a los dueños de negocios y controlas sus accesos.
          </Text>
        </View>
        <TouchableOpacity
          style={estilos.btnPrincipal}
          onPress={() => abrirFormulario()}
        >
          <FontAwesome5 name="plus" size={14} color="#000" />
          <Text style={estilos.btnTexto}> Registrar Nuevo Cliente</Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={estilos.statsGrid}>
        <View style={[estilos.card, estilos.cardFeatured]}>
          <Text style={[estilos.cardTitle, { color: "#000" }]}>
            CLIENTES TOTALES HOY
          </Text>
          <Text style={[estilos.cardValue, { color: "#000" }]}>
            {stats.total}
          </Text>
        </View>
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>CONEXIÓN HOY</Text>
          <Text style={[estilos.cardValue, { color: "#c6ff00" }]}>
            {stats.activosHoy}
          </Text>
        </View>
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>INGRESOS MENSUALES</Text>
          <Text style={estilos.cardValue}>${stats.ingresos.toFixed(2)}</Text>
        </View>
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>PLANES SUSPENDIDOS</Text>
          <Text style={[estilos.cardValue, { color: "#ff4444" }]}>
            {stats.suspendidos}
          </Text>
        </View>
      </View>

      {/* TABLA PRINCIPAL */}
      <View style={estilos.tableContainer}>
        <View style={estilos.tableHead}>
          <Text style={[estilos.th, { flex: 2.5 }]}>CLIENTE / NEGOCIO</Text>
          <Text style={[estilos.th, { flex: 2 }]}>EMAIL / TELÉFONO</Text>
          <Text style={[estilos.th, { flex: 1.5 }]}>ROL</Text>
          <Text style={[estilos.th, { flex: 1, textAlign: "center" }]}>
            ESTADO APP
          </Text>
          <Text style={[estilos.th, { flex: 1, textAlign: "center" }]}>
            ESTADO PAGO
          </Text>
          <Text style={[estilos.th, { flex: 1.5, textAlign: "center" }]}>
            COMPROBANTE
          </Text>
          <Text style={[estilos.th, { flex: 1.5, textAlign: "center" }]}>
            VENCIMIENTO
          </Text>
          <Text style={[estilos.th, { flex: 1, textAlign: "right" }]}>
            ACCIONES
          </Text>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#c6ff00"
            style={{ padding: 40 }}
          />
        ) : (
          usuarios.map((u, i) => {
            const activo = u.activo == 1 || u.activo === true;
            const pagoValido = u.estado_pago === "validado";
            const pagoPendiente =
              u.estado_pago === "pendiente" ||
              u.estado_pago === "en_validacion";

            return (
              <View key={i} style={estilos.tableRow}>
                {/* Cliente / Negocio */}
                <View
                  style={{
                    flex: 2.5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={estilos.avatar}>
                    <Text style={estilos.avatarTxt}>
                      {(u.nombre_negocio || u.nombre || "N")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      {u.nombre_negocio || "N/A"}
                    </Text>
                    <Text style={{ color: "#8a8a8a", fontSize: 12 }}>
                      {u.nombre}
                    </Text>
                  </View>
                </View>

                {/* Email / Teléfono */}
                <View style={{ flex: 2 }}>
                  <Text style={{ color: "#FFF" }}>{u.email}</Text>
                  <Text style={{ color: "#8a8a8a", fontSize: 12 }}>
                    {u.telefono || "-"}
                  </Text>
                </View>

                {/* Rol */}
                <View style={{ flex: 1.5 }}>
                  <Text style={{ color: "#d97706", fontSize: 12 }}>
                    {u.rol?.toUpperCase() || "ADMINISTRADOR"}
                  </Text>
                </View>

                {/* Estado APP */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: activo ? "#10b981" : "#ef4444",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {activo ? "Activa" : "Suspendida"}
                  </Text>
                </View>

                {/* Estado Pago */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: pagoValido
                        ? "#10b981"
                        : pagoPendiente
                          ? "#f59e0b"
                          : "#8a8a8a",
                      fontSize: 12,
                    }}
                  >
                    {pagoValido
                      ? "Pagado"
                      : pagoPendiente
                        ? "Pendiente"
                        : "Sin registrar"}
                  </Text>
                </View>

                {/* Comprobante */}
                <View style={{ flex: 1.5, alignItems: "center" }}>
                  {u.pago_adjunto ? (
                    <TouchableOpacity
                      style={estilos.btnDetalle}
                      onPress={() => {
                        setPagoViendo(u);
                        setModalPagoVisible(true);
                      }}
                    >
                      <Text style={{ color: "#c6ff00", fontSize: 11 }}>
                        Ver detalle
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: "#ef4444", fontSize: 12 }}>
                      sin comprobante
                    </Text>
                  )}
                </View>

                {/* Vencimiento */}
                <View style={{ flex: 1.5, alignItems: "center" }}>
                  <Text style={{ color: "#8a8a8a", fontSize: 12 }}>
                    {formatearFecha(u.fecha_vencimiento)}
                  </Text>
                </View>

                {/* Acciones */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 15,
                  }}
                >
                  <TouchableOpacity onPress={() => abrirFormulario(u)}>
                    <FontAwesome5 name="edit" size={14} color="#8a8a8a" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => suspenderUsuario(u)}>
                    <FontAwesome5
                      name={activo ? "user-slash" : "user-check"}
                      size={14}
                      color={activo ? "#ef4444" : "#10b981"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => borrarUsuario(u)}>
                    <FontAwesome5 name="trash" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ========================================================= */}
      {/* MODAL: VER DETALLES DEL PAGO (Replicando diseño de imagen) */}
      {/* ========================================================= */}
      <Modal visible={modalPagoVisible} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View
            style={[
              estilos.modalContent,
              { maxWidth: 600, padding: 0, overflow: "hidden" },
            ]}
          >
            {/* Header del Modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 20,
                backgroundColor: "#222",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
                Detalles del Pago #{pagoViendo?.pago_referencia || "N/A"}
              </Text>
              <TouchableOpacity onPress={() => setModalPagoVisible(false)}>
                <FontAwesome5 name="times" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {pagoViendo && (
              <ScrollView
                style={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Info Cliente (Azul) */}
                <View
                  style={[
                    estilos.cajaDetalle,
                    { backgroundColor: "#1e3a8a", borderColor: "#3b82f6" },
                  ]}
                >
                  <Text style={estilos.tituloDetalle}>
                    <FontAwesome5 name="user" /> Información del Cliente
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Nombre:{" "}
                        <Text style={estilos.txtData}>
                          {pagoViendo.nombre_negocio}
                        </Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Usuario:{" "}
                        <Text style={estilos.txtData}>{pagoViendo.nombre}</Text>
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Email:{" "}
                        <Text style={estilos.txtData}>{pagoViendo.email}</Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Teléfono:{" "}
                        <Text style={estilos.txtData}>
                          {pagoViendo.telefono}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Datos del Pago (Naranja/Dorado) */}
                <View
                  style={[
                    estilos.cajaDetalle,
                    { backgroundColor: "#92400e", borderColor: "#d97706" },
                  ]}
                >
                  <Text style={estilos.tituloDetalle}>
                    <FontAwesome5 name="file-invoice-dollar" /> Datos del Pago
                    Realizado por el Cliente
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Teléfono usado:{" "}
                        <Text style={estilos.txtData}>
                          {pagoViendo.pago_telefono}
                        </Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Referencia:{" "}
                        <Text style={[estilos.txtData, { color: "#ef4444" }]}>
                          {pagoViendo.pago_referencia}
                        </Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Monto:{" "}
                        <Text style={[estilos.txtData, { color: "#c6ff00" }]}>
                          $20.00
                        </Text>
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Fecha:{" "}
                        <Text style={estilos.txtData}>
                          {pagoViendo.pago_fecha}
                        </Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Banco emisor:{" "}
                        <Text style={[estilos.txtData, { color: "#c6ff00" }]}>
                          {pagoViendo.pago_banco}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Datos Tu Cuenta (Verde) */}
                <View
                  style={[
                    estilos.cajaDetalle,
                    { backgroundColor: "#065f46", borderColor: "#10b981" },
                  ]}
                >
                  <Text style={estilos.tituloDetalle}>
                    <FontAwesome5 name="university" /> Datos de Tu Cuenta (Donde
                    Recibiste el Pago)
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Banco: <Text style={estilos.txtData}>BNC</Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Teléfono:{" "}
                        <Text style={estilos.txtData}>0414-1914478</Text>
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.txtLabel}>
                        Cédula: <Text style={estilos.txtData}>31.385.211</Text>
                      </Text>
                      <Text style={estilos.txtLabel}>
                        Monto esperado:{" "}
                        <Text style={estilos.txtData}>$20.00</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Comprobante (Cian) */}
                <View
                  style={[
                    estilos.cajaDetalle,
                    { backgroundColor: "#0891b2", borderColor: "#06b6d4" },
                  ]}
                >
                  <Text style={estilos.tituloDetalle}>
                    <FontAwesome5 name="image" /> Comprobante Subido por el
                    Cliente
                  </Text>
                  <View
                    style={{
                      width: "100%",
                      height: 300,
                      backgroundColor: "#000",
                      borderRadius: 8,
                      marginTop: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{
                        uri: `${API_URL_UPLOADS}pagos/${pagoViendo.pago_adjunto}`,
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        resizeMode: "contain",
                      }}
                    />
                  </View>
                </View>

                {/* Botones Aprobar/Rechazar */}
                <View
                  style={{ flexDirection: "row", gap: 15, paddingBottom: 20 }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: "#ef4444",
                      padding: 15,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      if (confirm("¿Rechazar este pago?")) {
                        await api.put(`/usuarios/${pagoViendo.id}`, {
                          id: pagoViendo.id,
                          estado_pago: "pendiente",
                          pago_adjunto: "",
                        });
                        setModalPagoVisible(false);
                        cargarUsuarios();
                      }
                    }}
                  >
                    <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
                      Rechazar Pago
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#c6ff00",
                      padding: 15,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      if (confirm("¿Aprobar pago y activar cliente por 30 días?")) {
                        try {
                          // Llamamos a la lógica nativa de tu PagoController
                          await api.post('/pagos/validar', {
                            id: pagoViendo.id,
                            action: 'validar'
                          });
                          
                          // Activamos al usuario por seguridad
                          await api.put(`/usuarios/${pagoViendo.id}`, { 
                            id: pagoViendo.id, 
                            activo: 1 
                          });

                          setModalPagoVisible(false);
                          cargarUsuarios();
                        } catch (e) {
                          Alert.alert("Error", "Hubo un problema al validar el pago.");
                        }
                      }
                    }}
                  >
                    <Text style={{ color: "#000", fontWeight: "bold" }}>
                      Aprobar y Activar
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL FORMULARIO (Crear/Editar) */}
      <Modal visible={modalFormVisible} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <Text style={estilos.modalTitulo}>
              {idEditando ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </Text>

            <Text style={estilos.label}>Nombre del Negocio</Text>
            <TextInput
              style={estilos.input}
              value={formData.nombre_negocio}
              onChangeText={(t) =>
                setFormData({ ...formData, nombre_negocio: t })
              }
              placeholderTextColor="#8a8a8a"
              placeholder="Ej. Ferretería El Sol"
            />

            <Text style={estilos.label}>Nombre del Dueño</Text>
            <TextInput
              style={estilos.input}
              value={formData.nombre}
              onChangeText={(t) => setFormData({ ...formData, nombre: t })}
              placeholderTextColor="#8a8a8a"
            />

            <Text style={estilos.label}>Correo (Login)</Text>
            <TextInput
              style={[estilos.input, idEditando ? { opacity: 0.5 } : {}]}
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              editable={!idEditando}
              placeholderTextColor="#8a8a8a"
            />

            <Text style={estilos.label}>
              Contraseña {idEditando && "(Opcional)"}
            </Text>
            <TextInput
              style={estilos.input}
              value={formData.contrasena}
              onChangeText={(t) => setFormData({ ...formData, contrasena: t })}
              secureTextEntry
              placeholderTextColor="#8a8a8a"
            />

            <Text style={estilos.label}>Vencimiento</Text>
            <TextInput
              style={estilos.input}
              value={formData.fecha_vencimiento}
              onChangeText={(t) =>
                setFormData({ ...formData, fecha_vencimiento: t })
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a8a8a"
            />

            <View style={{ flexDirection: "row", gap: 15, marginTop: 25 }}>
              <TouchableOpacity
                style={[
                  estilos.btnPrincipal,
                  { flex: 1, backgroundColor: "#2a2a2a" },
                ]}
                onPress={() => setModalFormVisible(false)}
              >
                <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.btnPrincipal, { flex: 1 }]}
                onPress={guardarUsuario}
              >
                <Text style={estilos.btnTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 40,
  },
  titulo: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF" },
  subtitulo: { fontSize: 15, color: "#8a8a8a", marginTop: 5 },
  btnPrincipal: {
    flexDirection: "row",
    backgroundColor: "#c6ff00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTexto: { color: "#000", fontWeight: "bold", fontSize: 14 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    padding: 24,
    borderRadius: 20,
  },
  cardFeatured: { backgroundColor: "#c6ff00", borderColor: "#c6ff00" },
  cardTitle: {
    color: "#8a8a8a",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 15,
  },
  cardValue: { color: "#FFFFFF", fontSize: 36, fontWeight: "900" },

  tableContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  th: { color: "#8a8a8a", fontSize: 11, fontWeight: "bold", letterSpacing: 1 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(198, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { color: "#c6ff00", fontWeight: "bold", fontSize: 16 },

  btnDetalle: {
    borderWidth: 1,
    borderColor: "#c6ff00",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    width: "100%",
    maxWidth: 500,
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  modalTitulo: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: { color: "#8a8a8a", fontSize: 12, marginBottom: 5, marginTop: 15 },
  input: {
    backgroundColor: "#0d110d",
    color: "#FFF",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  // Estilos del Modal de Detalles del Pago
  cajaDetalle: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
  },
  tituloDetalle: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 8,
    borderRadius: 5,
  },
  txtLabel: { color: "#e2e8f0", fontSize: 12, marginBottom: 4 },
  txtData: { fontWeight: "bold", color: "#FFF" },
});
