# InventarioYa - Backend API

API REST para el sistema de inventario y ventas InventarioYa.

## Descripción

Sistema de gestión de inventario, ventas y caja para pequeños negocios. Permite gestionar productos, categorías, clientes, ventas con múltiples methods de pago, control de caja y dashboard para análisis de datos.

## Características

- ✅ Autenticación con JWT + Legacy tokens
- ✅ Gestión de usuarios (superadmin, administradores, vendedores, beta testers)
- ✅ CRUD completo de productos con imágenes Base64
- ✅ Categorías personalizables
- ✅ Clientes con historial y búsqueda
- ✅ Proveedores para gestión de inventario
- ✅ Ventas con múltiples métodos de pago
- ✅ Pagos parciales y abonos con captura de comprobantes
- ✅ Control de inventario (stock automático)
- ✅ Sistema de caja con apertura/cierre y reportes Z
- ✅ Dashboard individual y global (superadmin)
- ✅ Sistema de pagos y suscripciones
- ✅ Sistema de planes con límites por recurso
- ✅ Límites mensuales y totales configurables por plan
- ✅ Feature flags por plan (caja, movimientos inventario, crédito, etc.)
- ✅ Bloqueo automático de creación al exceder límites
- ✅ Protección IDOR automática
- ✅ Control de roles por negocio
- ✅ Historial de tasas de cambio (Venezuela)
- ✅ Control de acceso por estado de pago

## Requisitos

- PHP 8.1+
- MySQL 8.0+ o MariaDB 10.4+
- Composer
- Extensiones PHP: `pdo`, `mbstring`, `json`, `openssl`

## Instalación

### 1. Clonar el proyecto
```bash
git clone <repo-url> inventarioya
cd inventarioya/backend
```

### 2. Instalar dependencias
```bash
composer install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con los datos de conexión:
```env
APP_NAME=InventarioYa
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventarioya
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=tu-secret-key-aqui
```

### 4. Importar base de datos
```bash
mysql -u root -p inventarioya < sql/init.sql
```

O desde phpMyAdmin:
1. Crear base de datos `inventarioya`
2. Importar `sql/init.sql`

### 5. Iniciar servidor
```bash
# Con PHP内置服务器
php -S localhost:8000 -t public

# O con XAMPP
# Acceder a http://localhost/backend/api
```

## Estructura del Proyecto

```
backend/
├── public/                    # Archivos públicos
│   ├── index.php            # Entry point
│   └── uploads/            # Archivos subidos
│       └── pagos/          # Comprobantes de pago
├── src/
│   ├── Config/
│   │   └── Database.php    # Conexión PDO
│   ├── Controllers/        # Lógica de negocio (14 archivos)
│   │   ├── AuthController.php
│   │   ├── ClienteController.php
│   │   ├── CajaController.php
│   │   ├── CategoriaController.php
│   │   ├── ConfiguracionController.php
│   │   ├── DashboardController.php
│   │   ├── AdminDashboardController.php
│   │   ├── PagoController.php
│   │   ├── ProductoController.php
│   │   ├── PlanController.php
│   │   ├── ProveedorController.php
│   │   ├── SuperadminController.php
│   │   ├── UsuarioController.php
│   │   └── VentaController.php
│   ├── Middleware/
│   │   └── Auth.php       # Autenticación y seguridad
│   ├── Models/           # Modelos (13 archivos)
│   │   ├── BaseModel.php
│   │   ├── Caja.php
│   │   ├── Cliente.php
│   │   ├── Configuracion.php
│   │   ├── MovimientoCaja.php
│   │   ├── MovimientoInventario.php
│   │   ├── Producto.php
│   │   ├── Plan.php
│   │   ├── Proveedor.php
│   │   ├── Usuario.php
│   │   ├── Venta.php
│   │   └── VentaItem.php
│   └── Routes/
│       └── api.php        # Definición de rutas
├── sql/
│   └── init.sql          # Schema de base de datos
├── .env                # Variables de entorno (no subir a git)
├── .env.example        # Plantilla de variables
└── composer.json
```

## Rutas API

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/login | Iniciar sesión |
| POST | /auth/register | Registrar nuevo usuario |
| GET | /auth/me | Datos del usuario actual |
| GET | /auth/validate_token | Validar token |
| GET | /auth/heartbeat | Mantener sesión activa |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /productos | Listar productos |
| POST | /productos | Crear producto |
| GET | /productos/{id} | Ver producto |
| PUT | /productos/{id} | Actualizar producto |
| DELETE | /productos/{id} | Eliminar producto |
| POST | /productos/ajustar | Ajustar stock (entrada/salida) |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /ventas | Listar ventas |
| POST | /ventas | Crear venta |
| GET | /ventas/{id} | Ver venta |
| POST | /ventas/registrar-pago | Registrar pago parcial |
| GET | /ventas/kardex | Historial de inventario |

### Categorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /categorias | Listar categorías |
| POST | /categorias | Crear categoría |
| GET | /categorias/{id} | Ver categoría |
| PUT | /categorias/{id} | Actualizar categoría |
| DELETE | /categorias/{id} | Eliminar categoría |

### Clientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /clientes | Listar clientes |
| POST | /clientes | Crear cliente |
| GET | /clientes/{id} | Ver cliente |
| PUT | /clientes/{id} | Actualizar cliente |
| DELETE | /clientes/{id} | Eliminar cliente |
| GET | /clientes/buscar?q=texto | Buscar por cédula o nombre |

### Proveedores
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /proveedores | Listar proveedores |
| POST | /proveedores | Crear proveedor |
| GET | /proveedores/{id} | Ver proveedor |
| PUT | /proveedores/{id} | Actualizar proveedor |
| DELETE | /proveedores/{id} | Eliminar proveedor |
| GET | /proveedores/buscar?q=texto | Buscar proveedor |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /usuarios | Listar usuarios |
| POST | /usuarios | Crear usuario |
| PUT | /usuarios/{id} | Actualizar usuario |
| DELETE | /usuarios/{id} | Eliminar usuario |
| GET | /usuarios?superadmin=true | Listar todos los usuarios (superadmin) |

### Caja
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /caja | Ver caja actual (sesión abierta + movimientos) |
| POST | /caja | Abrir/cerrar/movimiento |
| GET | /caja?action=historial | Historial de sesiones (límite 100) |
| GET | /caja/reporte?id=cj_xxx | Reporte Z por sesión (con ventas e items) |
| GET | /caja/reporte?fecha_inicio=2026-01-01&fecha_fin=2026-01-31 | Reporte Z por rango de fechas |

### Planes (solo superadmin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /planes | Listar todos los planes |
| POST | /planes | Crear un plan |
| PUT | /planes/{id} | Actualizar un plan |
| DELETE | /planes/{id} | Eliminar un plan |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /dashboard | Dashboard del negocio (vendedor ve sus ventas, admin ve todas) |
| GET | /admin/dashboard | Dashboard global (superadmin) — devuelve `total_clientes`, `activos_hoy`, `ventas_plataforma`, `suspendidos`, `ingresos_planes_mensual`, `recientes` |

### Superadmin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /superadmin?table=tabla | Ver datos globales (todas las tablas) |
| POST | /superadmin | Crear usuario desde superadmin |

### Configuración (Sistema de 2 tablas)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /configuracion | Ver configuraciones |
| POST | /configuracion | Guardar configuración |
| GET | /configuracion/tasa-cambio | Ver tasa actual |
| PUT | /configuracion/tasa-cambio | Actualizar tasa de cambio |

**Nota:** El sistema usa 2 tablas:
- `configuraciones`: Configuración global (beta_activa, tasa_iva, tasa_igtf)
- `configuraciones_empresas`: Configuración por empresa (iva, igtf, tasa_cambio)

### Pagos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /pagos/subir | Subir comprobante de pago |
| POST | /pagos/validar | Validar/rechazar pago (asigna `plan_id`) |
| GET | /pagos/ver | Ver comprobante |
| GET | /pagos/pendientes | Lista pagos pendientes |

## Cabeceras Requeridas

Todas las rutas (excepto login y register) requieren:

```
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

## CORS

El API permite conexiones desde cualquier dominio (CORS habilitado):

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `superadmin` | Admin de la plataforma (acceso total) |
| `administrador` | Dueño del negocio |
| `beta_tester` | Usuario de prueba |
| `vendedor` | Empleado estándar |
| `vendedor_beta` | Empleado de beta_tester |

### Superadmins del Sistema

Los siguientes usuarios tienen acceso completo:

| ID | Email |
|----|-------|
| `usr_admin-principal` | admin@inventarioya.com |
| - | litoramirez2005@gmail.com |

**Nota:** `admin_001` ya no existe, se usa `usr_admin-principal`.

Estos usuarios pueden acceder a:
- `/admin/dashboard` - Dashboard global (estadísticas de la plataforma)
- `/superadmin?table=xxx` - Ver datos de cualquier tabla (usuarios, productos, ventas, etc.)
- `/superadmin` POST - Crear nuevos usuarios administradores

### Registro Automático de Roles

Al registrarse:
- Email `@betatester.com` → rol `beta_tester`
- Otros emails → rol `administrador`
- `admin@inventarioya.com` y `litoramirez2005@gmail.com` → rol `superadmin`

## Sistema de Planes

Los planes permiten establecer límites por recurso y habilitar/deshabilitar funcionalidades por usuario.

### Tabla `planes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | varchar(50) | ID del plan (ej: `plan_xxx`) |
| `nombre` | varchar(100) | Nombre del plan |
| `descripcion` | text | Descripción |
| `precio_mensual` | decimal(10,2) | Precio mensual del plan |
| `limite_productos` | int \| null | Máximo de productos activos (`null` = ilimitado) |
| `limite_vendedores` | int \| null | Máximo de vendedores |
| `limite_ventas_mes` | int \| null | Máximo de ventas por mes |
| `limite_proveedores` | int \| null | Máximo de proveedores |
| `limite_clientes` | int \| null | Máximo de clientes |
| `limite_categorias` | int \| null | Máximo de categorías |
| `usa_caja` | tinyint(1) | 1 = permite usar caja registradora |
| `usa_movimientos_inventario` | tinyint(1) | 1 = permite ajustar stock |
| `usa_movimientos_caja` | tinyint(1) | 1 = permite movimientos de caja |
| `permite_credito` | tinyint(1) | 1 = permite ventas a crédito |
| `activo` | tinyint(1) | 1 = plan activo |

### Comportamiento de límites

- **Límites totales** (`limite_productos`, `limite_vendedores`, `limite_clientes`, `limite_proveedores`, `limite_categorias`): cuentan el total de registros activos del usuario. Si `plan_id = NULL` (sin plan asignado), no hay límite.
- **Límite mensual** (`limite_ventas_mes`): cuenta las ventas completadas del mes actual.
- **Feature flags** (`usa_caja`, `usa_movimientos_inventario`, `usa_movimientos_caja`, `permite_credito`): si el plan tiene `0` en el flag, el endpoint responde `403`.

### Flujo de estado de pago

| Paso | acción | `estado_pago` |
|------|--------|---------------|
| 1. Registro automático | — | `pendiente` |
| 2. Usuario sube comprobante | `POST /pagos/subir` | `pendiente` |
| 3. Superadmin valida | `POST /pagos/validar` `action=validar` + `plan_id` | `validado` |
| 4. Superadmin vence manual | `POST /pagos/validar` `action=vencer` | `vencido` |

### Modo beta vs Producción

La configuración `beta_activa` (tabla `configuraciones`) controla el bloqueo. Por defecto es `0` (producción).

- **`beta_activa = 1`**: todos los usuarios acceden sin restricciones.
- **`beta_activa = 0`**: solo usuarios con `estado_pago = 'validado'` pueden usar la app. Los estados `pendiente` y `vencido` reciben `403`.

### Herencia de plan para vendedores

Los vendedores (`vendedor` / `vendedor_beta`) heredan el plan de su administrador:

- **`Plan::findByUsuario()`**: si el usuario no tiene `plan_id` directo pero tiene un `admin_id` (distinto a su propio ID), resuelve recursivamente el plan del admin.
- **Límites compartidos**: al crear recursos, `usuario_id` se asigna al `admin_id` (vía `getOwnerId()`). Todas las consultas de conteo filtran por `usuario_id = ?`, por lo que suman recursos del admin y de todos sus vendedores en conjunto.
- **`estado_pago`**: al crear un vendedor, hereda el `estado_pago` de su admin automáticamente.
- **Login y `/auth/me`**: el objeto `plan` anidado se resuelve vía `findByUsuario()`, mostrando el plan heredado.

### Validaciones automáticas (dentro del try-catch para evitar respuestas vacías)

| Endpoint | Verifica | Respuesta si excede |
|----------|----------|---------------------|
| `POST /productos` | `limite_productos` (cuenta existentes + nuevos en bulk) | 403 |
| `POST /categorias` | `limite_categorias` | 403 |
| `POST /clientes` | `limite_clientes` | 403 |
| `POST /proveedores` | `limite_proveedores` | 403 |
| `POST /ventas` | `limite_ventas_mes` y `permite_credito` | 403 (con rollback) |
| `POST /usuarios` | `limite_vendedores` (solo rol vendedor) | 403 |
| `POST /productos/ajustar` | `usa_movimientos_inventario` | 403 |
| `POST /caja` (abrir) | `usa_caja` | 403 |
| `POST /caja` (movimiento) | `usa_movimientos_caja` | 403 |

### Todos los endpoints devuelven plan info

- **`POST /auth/login`**: el objeto `usuario` incluye `plan_id` y un objeto `plan` anidado con todos los límites.
- **`GET /auth/me`**: incluye `plan_id`, `estado_pago`, `fecha_vencimiento` y objeto `plan` anidado.
- **`POST /pagos/validar`**: acepta `plan_id` para asignar el plan al validar el pago.

## Formato de datos JSON

### Login
```json
{
  "email": "admin@inventarioya.com",
  "contrasena": "password"
}
```

### Crear Producto
```json
{
  "nombre": "Producto ejmplo",
  "descripcion": "Descripción",
  "categoriaId": "cat_xxx",
  "stock": 10,
  "stockMinimo": 5,
  "costo": 100.00,
  "precio": 150.00,
  "imagen": "data:image/jpeg;base64,..."
}
```

### Crear Venta
```json
{
  "items": [
    {
      "productoId": "prod_xxx",
      "cantidad": 2,
      "precioUnitario": 150.00,
      "costoUnitario": 100.00,
      "subtotal": 300.00
    }
  ],
  "subtotal": 300.00,
  "total": 300.00,
  "metodoPago": "efectivo",
  "clienteId": "cli_xxx"
}
```

### Validar Pago (Superadmin)
```json
{
  "id": "usr_xxx",
  "action": "validar",
  "plan_id": "plan_xxx",
  "fecha_vencimiento": "2026-06-12"
}
```
- `action: "validar"` — cambia estado a `validado`, asigna `plan_id` (requerido). `fecha_vencimiento` opcional (default +30 días desde hoy)
- `action: "vencer"` — cambia estado a `vencido` (no necesita `plan_id`)

### Registrar Abono a Venta
```json
{
  "id": "venta_xxx",
  "monto": 200,
  "metodo": "pago_movil",
  "referencia": "0123456",
  "fotoComprobante": "data:image/jpeg;base64,..."
}
```
- `metodo` puede ser: `efectivo`, `transferencia`, `pago_movil`, `punto`, `credito`, `otros`
- `referencia` y `fotoComprobante` son opcionales
- El backend recalcula automáticamente `monto_pagado`, `monto_restante` y `estado_pago`

### Subir Pago
```json
{
  "usuario_id": "usr_xxx",
  "referencia": "12345678",
  "telefono": "+584241234567",
  "banco": "Banco Venezuela",
  "fecha": "2026-04-18",
  "imagen": "data:image/jpeg;base64,..."
}
```

### Crear Usuario desde Superadmin
```json
{
  "email": "nuevo@test.com",
  "nombre": "Nuevo Admin",
  "rol": "administrador",
  "contrasena": "123456",
  "plan_id": "plan_xxx",
  "estado_pago": "validado",
  "fecha_vencimiento": "2026-06-12",
  "admin_id": "usr_xxx"
}
```
- `rol` puede ser: `superadmin`, `administrador`, `beta_tester`, `vendedor`, `vendedor_beta`
- `plan_id`, `estado_pago`, `fecha_vencimiento`, `admin_id` son opcionales
- Si `rol` es `vendedor` o `vendedor_beta`: por defecto hereda `estado_pago` del admin (el usuario indicado en `admin_id`). `admin_id` por defecto es el superadmin autenticado.

### Configuración de Tasa de Cambio (Venezuela)
```json
PUT /configuracion/tasa-cambio
{
  "tasa": 50.25
}
```

### Crear Proveedor
```json
{
  "nombre": "Distribuidora XYZ",
  "telefono": "02121234567",
  "email": "contacto@xyz.com",
  "direccion": "Caracas",
  "notas": "Proveedor de alimentos"
}
```

### Crear Cliente
```json
{
  "nombre": "Juan Pérez",
  "cedula": "V-12345678",
  "telefono": "04121234567",
  "email": "juan@email.com",
  "direccion": "Caracas, Venezuela"
}
```

**Validaciones:**
- El campo `nombre` es obligatorio
- El campo `cedula` es único por usuario (no permite duplicados)

### Ajustar Stock (Inventario)
```json
{
  "productoId": "prod_xxx",
  "cantidad": 5,
  "tipo": "ajuste_entrada",
  "motivo": "Compra de reposición",
  "referenciaId": "opt_xxx"
}
```

**Tipos válidos:**
- `ajuste_entrada` - Entrada de inventario (+)
- `ajuste_salida` - Salida de inventario (-)
- `compra` - Compra de mercancía
- `devolucion` - Devolución de producto
- `inicial` - Stock inicial
- `venta` - Venta (usa cantidad negativa)

## Base de Datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema (admin, vendedor, superadmin) |
| `configuraciones` | Configuraciones globales (beta_activa, tasa_cambio) |
| `configuraciones_empresas` | Configuraciones por empresa (iva, igtf, tasa_cambio) |
| `categorías` | Categorías de productos |
| `proveedores` | Proveedores de productos |
| `productos` | Catálogo de productos (con proveedor_id) |
| `clientes` | Clientes |
| `ventas` | Registro de ventas (con tasa_cambio, iva, igtf) |
| `venta_items` | Items de cada venta (UUID: vi_xxx) |
| `movimientos_inventario` | Historial de stock (kardex) |
| `caja` | Sesiones de caja (apertura/cierre) - Antes: cierres_caja |
| `movimientos_caja` | Ingresos/egresos de caja |
| `pagos_ventas` | Pagos individuales de cada venta (contado y abonos) |

## Seguridad

- ✅ Tokens JWT con expiración (30 días)
- ✅ Firma HMAC SHA-256
- ✅ Protección contra timing attacks
- ✅ Middleware de autenticación
- ✅ Protección IDOR automática
- ✅ Control de roles por negocio
- ✅ Verificación de propietario en cada recurso
- ✅ Límites por plan en creación de recursos
- ✅ Bloqueo de acceso si pago no validado y beta inactiva
- ✅ `estado_pago` y `plan_id` incluidos en respuestas de auth

## Errores Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Datos insuficientes o malformados |
| 401 | No autorizado (token inválido o ausente) |
| 403 | No tiene permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: email ya registrado) |
| 500 | Error del servidor |

## Validaciones Importantes

| Recurso | Validación |
|---------|------------|
| Clientes | Cédula única por usuario |
| Usuarios | Email único en el sistema |
| Superadmin | No puede crear usuarios con email existente |

## Archivos Subidos

### Imágenes de Productos
- Ubicación: `/uploads/{filename}`
- Formato: JPG, PNG
- Acceso desde frontend: `{APP_URL}/uploads/{filename}`

### Comprobantes de Pago (Ventas)
- Ubicación: `/uploads/pagos/{filename}`
- Acceso desde frontend: `{APP_URL}/uploads/pagos/{filename}`

## Ejemplo de Respuesta de Error

```json
{
  "error": "Mensaje de error",
  "status": "unauthorized"
}
```

## Contribuir

1. Fork del proyecto
2. Crear rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## Licencia

MIT License - Ver archivo LICENSE para más detalles.