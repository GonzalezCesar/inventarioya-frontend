// 🔥 Cambia esta IP por la de tu Tailscale o tu WiFi local cuando te muevas
const IP_SERVIDOR = "192.168.1.101"; 
const PUERTO = "8000";

// Exportamos las rutas maestras para que toda la app las use
export const API_URL = `http://${IP_SERVIDOR}:${PUERTO}/api`;
export const API_URL_UPLOADS = `http://${IP_SERVIDOR}:${PUERTO}/uploads/`;

// import { Platform } from 'react-native';

// // Cambiar esta IP por la de tu computadora local mientras desarrollas
// // Ejemplo: 'http://192.168.1.15:3001/api'
// // En producción será: 'https://tuservidor.com/api'

// // URL de la API (Cambia a DEV_API_URL si estás usando un servidor local)
// const DEV_API_URL = 'http://192.168.1.15:3001/api'; // Cambia esto por tu IP local y puerto
// const PROD_API_URL = 'https://agenciaancla.com/inventarioya/backend/api';

// // Para desarrollo local, cambia a DEV_API_URL. Para producción, usa PROD_API_URL
// export const API_URL = PROD_API_URL;

// export const ENDPOINTS = {
//   LOGIN: '/auth/login',
//   REGISTER: '/auth/register',
//   ME: '/auth/me',
//   VALIDATE_TOKEN: '/auth/validate_token',
//   HEARTBEAT: '/auth/heartbeat',
//   USUARIOS: '/usuarios',
//   PRODUCTOS: '/productos',
//   CATEGORIAS: '/categorias',
//   CLIENTES: '/clientes',
//   VENTAS: '/ventas',
//   CAJA: '/caja',
//   DASHBOARD: '/dashboard',
//   CONFIGURACION: '/configuracion',
// };
