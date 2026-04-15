import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

// --- TEMA HARDCODEADO ---
const COLORES = {
  fondoOscuro: '#1C1C1E',
  fondoTarjeta: '#2C2C2E',
  primario: '#D4FF00', // El verde neón de tus capturas
  textoBlanco: '#FFFFFF',
  textoGris: '#8E8E93',
  textoOscuro: '#1C1C1E',
  borde: '#38383A',
  exito: '#34C759',
  error: '#FF3B30'
};

// --- INTERFACES LOCALES ---
interface ProductoMock {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}
interface ItemCarrito {
  producto: ProductoMock;
  cantidad: number;
  subtotal: number;
}

export default function PantallaNuevaVenta() {
  const router = useRouter();
  
  // Estados Principales
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados del Modal de Pago
  const [modalVisible, setModalVisible] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [faseModal, setFaseModal] = useState<'pago' | 'confirmacion' | 'exito'>('pago');
  const animacionEscala = React.useRef(new Animated.Value(0)).current;

  // Utilidades
  const formatearMoneda = (monto: number) => `$ ${monto.toFixed(2)}`;
  const calcularTotal = () => carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // Funciones del Carrito (Mocks temporales)
  const abrirModalPago = () => {
    if (carrito.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos al carrito para continuar');
      return;
    }
    setFaseModal('pago');
    setModalVisible(true);
  };

  const solicitarConfirmacion = () => setFaseModal('confirmacion');

  const procesarVenta = () => {
    setCargando(true);
    // Simulamos la llamada a la API
    setTimeout(() => {
      setCargando(false);
      setFaseModal('exito');
      Animated.spring(animacionEscala, {
        toValue: 1, friction: 8, tension: 30, useNativeDriver: true,
      }).start();
      setCarrito([]); // Limpiamos el carrito
    }, 1500);
  };

  const cerrarModalYVolver = () => {
    setModalVisible(false);
    // router.push('/(tabs)'); // Si quieres que vuelva al inicio
  };

  // --- RENDER DEL MODAL ---
  const renderContenidoModal = () => {
    if (faseModal === 'exito') {
      return (
        <View style={estilos.contenedorExito}>
          <Animated.View style={[estilos.iconoExito, { transform: [{ scale: animacionEscala }] }]}>
            <FontAwesome5 name="check" size={60} color={COLORES.primario} />
          </Animated.View>
          <Text style={estilos.tituloExito}>¡Venta Exitosa!</Text>
          <Text style={estilos.subtituloExito}>La transacción se ha registrado correctamente.</Text>
          <TouchableOpacity style={estilos.botonPrimario} onPress={cerrarModalYVolver}>
            <Text style={estilos.textoBotonPrimario}>Nueva Venta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (faseModal === 'confirmacion') {
      return (
        <View style={estilos.contenedorConfirmacion}>
          <FontAwesome5 name="exclamation-circle" size={60} color={COLORES.primario} />
          <Text style={estilos.tituloConfirmacion}>¿Confirmar Venta?</Text>
          
          <View style={estilos.resumenConfirmacion}>
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumen}>Artículos:</Text>
              <Text style={estilos.valorResumen}>{carrito.length}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumen}>Método:</Text>
              <Text style={estilos.valorResumen}>{metodoPago.toUpperCase()}</Text>
            </View>
            <View style={estilos.divisor} />
            <View style={estilos.filaResumen}>
              <Text style={estilos.labelResumenTotal}>TOTAL A PAGAR:</Text>
              <Text style={estilos.valorResumenTotal}>{formatearMoneda(calcularTotal())}</Text>
            </View>
          </View>

          <View style={estilos.botonesConfirmacion}>
            <TouchableOpacity style={[estilos.botonSecundario, { flex: 1 }]} onPress={() => setFaseModal('pago')}>
              <Text style={estilos.textoBotonSecundario}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.botonPrimario, { flex: 1 }]} onPress={procesarVenta} disabled={cargando}>
              {cargando ? <ActivityIndicator color={COLORES.textoOscuro} /> : <Text style={estilos.textoBotonPrimario}>Confirmar</Text>}
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
          <Text style={estilos.totalValue}>{formatearMoneda(calcularTotal())}</Text>
        </View>

        <Text style={estilos.seccionTitulo}>Método de Pago</Text>
        <View style={estilos.gridPagos}>
          {['efectivo', 'tarjeta', 'pago_movil'].map((metodo) => (
            <TouchableOpacity 
              key={metodo}
              style={[estilos.opcionPago, metodoPago === metodo && estilos.opcionPagoActivo]}
              onPress={() => setMetodoPago(metodo)}
            >
              <FontAwesome5 
                name={metodo === 'efectivo' ? 'dollar-sign' : metodo === 'tarjeta' ? 'credit-card' : 'mobile-alt'} 
                size={24} 
                color={metodoPago === metodo ? COLORES.primario : COLORES.textoGris} 
              />
              <Text style={[estilos.textoPago, metodoPago === metodo && estilos.textoPagoActivo]}>
                {metodo.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {metodoPago === 'efectivo' && (
          <View style={{ marginTop: 20 }}>
            <Text style={estilos.labelInput}>Dinero Recibido</Text>
            <TextInput
              style={estilos.inputGrande}
              placeholder="$ 0.00"
              placeholderTextColor={COLORES.textoGris}
              keyboardType="numeric"
              value={montoRecibido}
              onChangeText={setMontoRecibido}
            />
          </View>
        )}

        <TouchableOpacity style={[estilos.botonPrimario, { marginTop: 30 }]} onPress={solicitarConfirmacion}>
          <Text style={estilos.textoBotonPrimario}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // --- RENDER PRINCIPAL PANTALLA VENDER ---
  return (
    <View style={estilos.contenedor}>
      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Nueva Venta</Text>
        <TouchableOpacity style={estilos.botonEscanear} onPress={() => router.push('/productos/escaner')}>
          <FontAwesome5 name="camera" size={16} color={COLORES.textoOscuro} />
          <Text style={estilos.textoBotonEscanear}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={estilos.barraBusqueda}>
        <FontAwesome5 name="search" size={18} color={COLORES.textoGris} />
        <TextInput
          style={estilos.inputBusqueda}
          placeholder="Buscar producto..."
          placeholderTextColor={COLORES.textoGris}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Título Carrito */}
      <Text style={estilos.tituloCarrito}>Carrito ({carrito.length})</Text>

      {/* Lista del Carrito */}
      <FlatList
        data={carrito}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={estilos.itemCarrito}>
            <View style={estilos.iconoProducto}><FontAwesome5 name="box" size={20} color={COLORES.textoGris}/></View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombreItem}>{item.producto.nombre}</Text>
              <Text style={estilos.precioItem}>{formatearMoneda(item.producto.precio)} c/u</Text>
            </View>
            <Text style={estilos.subtotalItem}>{item.cantidad} x {formatearMoneda(item.subtotal)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={estilos.carritoVacio}>
            <FontAwesome5 name="shopping-cart" size={80} color={COLORES.borde} />
            <Text style={estilos.textoCarritoVacio}>El carrito está vacío</Text>
          </View>
        }
      />

      {/* Footer Total */}
      <View style={estilos.footer}>
        <View style={estilos.totalContenedor}>
          <Text style={estilos.textoTotal}>TOTAL</Text>
          <Text style={estilos.montoTotal}>{formatearMoneda(calcularTotal())}</Text>
        </View>
        <TouchableOpacity 
          style={[estilos.botonPrimario, carrito.length === 0 && { opacity: 0.5 }]} 
          onPress={abrirModalPago}
          disabled={carrito.length === 0}
        >
          <Text style={estilos.textoBotonPrimario}>Procesar Venta</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Multi-paso */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={estilos.modalContainer}>
          <View style={estilos.modalContent}>
            {faseModal !== 'exito' && (
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitulo}>{faseModal === 'confirmacion' ? 'Confirmar' : 'Completar Venta'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome5 name="times" size={24} color={COLORES.textoGris} />
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
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: COLORES.textoBlanco },
  
  botonEscanear: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.primario, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, gap: 8 },
  textoBotonEscanear: { fontSize: 14, fontWeight: 'bold', color: COLORES.textoOscuro },
  
  barraBusqueda: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.fondoTarjeta, marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORES.borde, marginBottom: 20 },
  inputBusqueda: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 16, color: COLORES.textoBlanco },
  
  tituloCarrito: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoBlanco, marginHorizontal: 20, marginBottom: 15 },
  
  carritoVacio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50, gap: 20 },
  textoCarritoVacio: { fontSize: 18, color: COLORES.textoGris },
  
  itemCarrito: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.fondoTarjeta, padding: 15, borderRadius: 12, marginBottom: 10, gap: 15 },
  iconoProducto: { width: 45, height: 45, backgroundColor: COLORES.fondoOscuro, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  nombreItem: { fontSize: 16, color: COLORES.textoBlanco, fontWeight: 'bold' },
  precioItem: { fontSize: 14, color: COLORES.textoGris },
  subtotalItem: { fontSize: 16, color: COLORES.primario, fontWeight: 'bold' },
  
  footer: { backgroundColor: COLORES.fondoTarjeta, padding: 20, borderTopWidth: 1, borderTopColor: COLORES.borde, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  totalContenedor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  textoTotal: { fontSize: 18, color: COLORES.textoGris, fontWeight: 'bold' },
  montoTotal: { fontSize: 32, color: COLORES.primario, fontWeight: '900' },
  
  botonPrimario: { backgroundColor: COLORES.primario, padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  textoBotonPrimario: { color: COLORES.textoOscuro, fontSize: 18, fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORES.textoGris },
  textoBotonSecundario: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: COLORES.fondoOscuro, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: COLORES.textoBlanco },
  
  totalDisplay: { alignItems: 'center', padding: 20, backgroundColor: COLORES.fondoTarjeta, borderRadius: 15, borderWidth: 1, borderColor: COLORES.primario, marginBottom: 25 },
  totalLabel: { color: COLORES.textoGris, fontSize: 16, marginBottom: 5 },
  totalValue: { color: COLORES.primario, fontSize: 36, fontWeight: '900' },
  
  seccionTitulo: { fontSize: 18, color: COLORES.textoBlanco, fontWeight: 'bold', marginBottom: 15 },
  gridPagos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  opcionPago: { width: '48%', padding: 20, backgroundColor: COLORES.fondoTarjeta, borderRadius: 12, alignItems: 'center', gap: 10, borderWidth: 2, borderColor: 'transparent' },
  opcionPagoActivo: { borderColor: COLORES.primario },
  textoPago: { color: COLORES.textoGris, fontWeight: 'bold' },
  textoPagoActivo: { color: COLORES.primario },
  
  labelInput: { color: COLORES.textoBlanco, marginBottom: 10, fontSize: 16 },
  inputGrande: { backgroundColor: COLORES.fondoTarjeta, color: COLORES.textoBlanco, fontSize: 24, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORES.primario, textAlign: 'center' },
  
  contenedorConfirmacion: { alignItems: 'center', paddingVertical: 20 },
  tituloConfirmacion: { fontSize: 24, color: COLORES.textoBlanco, fontWeight: 'bold', marginVertical: 15 },
  resumenConfirmacion: { width: '100%', backgroundColor: COLORES.fondoTarjeta, padding: 20, borderRadius: 15, marginBottom: 25 },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  labelResumen: { color: COLORES.textoGris, fontSize: 16 },
  valorResumen: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold' },
  divisor: { height: 1, backgroundColor: COLORES.borde, marginVertical: 15 },
  labelResumenTotal: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: 'bold' },
  valorResumenTotal: { color: COLORES.primario, fontSize: 24, fontWeight: '900' },
  botonesConfirmacion: { flexDirection: 'row', gap: 15, width: '100%' },
  
  contenedorExito: { alignItems: 'center', paddingVertical: 40 },
  iconoExito: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(212, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  tituloExito: { fontSize: 28, color: COLORES.textoBlanco, fontWeight: 'bold', marginBottom: 10 },
  subtituloExito: { fontSize: 16, color: COLORES.textoGris, textAlign: 'center', marginBottom: 40 }
});