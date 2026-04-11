// ============== AUTENTICACIÓN ==============
export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface TokenData {
  token: string;
  expiresAt?: string;
}

// ============== PRODUCTOS ==============
export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioVenta?: number;
  stock: number;
  categoriaId: string;
  categoria?: Categoria;
  fechaCreacion?: string;
  activo: boolean;
}

export interface ProductoFormData {
  nombre: string;
  descripcion?: string;
  precio: number;
  precioVenta?: number;
  stock: number;
  categoriaId: string;
}

// ============== CATEGORÍAS ==============
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface CategoriaFormData {
  nombre: string;
  descripcion?: string;
}

// ============== CLIENTES ==============
export interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  cedula?: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface ClienteFormData {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  cedula?: string;
}

// ============== VENTAS ==============
export interface Venta {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  total: number;
  subtotal: number;
  impuesto: number;
  descuento: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
  items: VentaItem[];
  fechaCreacion?: string;
  observaciones?: string;
}

export interface VentaItem {
  id?: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaFormData {
  clienteId: string;
  items: VentaItem[];
  descuento?: number;
  observaciones?: string;
}

// ============== CAJA ==============
export interface Caja {
  id: string;
  montoInicial: number;
  montoActual: number;
  movimientos: MovimientoCaja[];
  estado: 'abierta' | 'cerrada';
  fechaApertura?: string;
  fechaCierre?: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'entrada' | 'salida';
  monto: number;
  concepto: string;
  referencia?: string;
  fecha?: string;
}

// ============== CONFIGURACIÓN ==============
export interface Configuracion {
  nombreEmpresa?: string;
  logo?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  pais?: string;
  moneda?: string;
  idioma?: string;
  [key: string]: any;
}

// ============== REPORTES ==============
export interface ReporteVentas {
  totalVentas: number;
  cantidadVentas: number;
  ventaPromedio: number;
  productoMasVendido?: Producto;
  clienteFrecuente?: Cliente;
  periodo?: string;
}

export interface ReporteInventario {
  totalProductos: number;
  valorTotal: number;
  productosConBajoStock: Producto[];
  productosSinStock: Producto[];
  categoriasMasVendidas?: Categoria[];
}

// ============== DASHBOARD ==============
export interface DashboardData {
  ventasHoy: number;
  productosVendidos: number;
  clientesNuevos: number;
  cajaActual: number;
  ventasUltimasSemana: number[];
  productosTopVentas: Producto[];
  clientesTopCompras: Cliente[];
}

// ============== RESPUESTA GENÉRICA ==============
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  detalles?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// ============== ERRORES ==============
export interface ApiError {
  error: string;
  message?: string;
  detalles?: any[];
  status?: number;
}
