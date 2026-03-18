# 🔧 Issues de Backend - Sistema de Roles y Permisos

## 📋 Tabla de Contenidos
1. [Autenticación y Usuarios](#1-autenticación-y-usuarios)
2. [Gestión de Roles](#2-gestión-de-roles)
3. [Permisos y Validación](#3-permisos-y-validación)
4. [Integración con Módulos](#4-integración-con-módulos)
5. [Auditoría](#5-auditoría)

---

## 1. Autenticación y Usuarios

### 🔐 ISSUE #1: Sistema de Autenticación con Roles
**Prioridad:** 🔥🔥🔥 CRÍTICA

#### Descripción
Implementar sistema de autenticación JWT que incluya información de roles y permisos en el token.

#### Endpoints Necesarios

##### `POST /api/auth/login`
Autenticar usuario y retornar token con información de roles.

**Request:**
```json
{
  "email": "usuario@hexodus.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_123456",
      "nombre": "Juan Pérez",
      "email": "usuario@hexodus.com",
      "rol": {
        "id": "admin",
        "nombre": "Administrador",
        "color": "#FF5733",
        "icono": "👑",
        "esAdministrador": true,
        "esSistema": true
      },
      "permisos": {
        "dashboard": {
          "ver": true,
          "crear": true,
          "editar": true,
          "eliminar": true,
          "verGraficas": true,
          "verAnalisis": true,
          "verHorasPico": true,
          "verResumenGeneral": true
        },
        "membresias": { /* ... todos los permisos ... */ },
        "socios": { /* ... todos los permisos ... */ }
        // ... resto de módulos
      }
    },
    "refreshToken": "refresh_token_here"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos"
  }
}
```

##### `POST /api/auth/refresh`
Renovar token expirado.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "nuevo_token_jwt",
    "refreshToken": "nuevo_refresh_token"
  }
}
```

##### `GET /api/auth/me`
Obtener información del usuario autenticado (con token).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "nombre": "Juan Pérez",
    "email": "usuario@hexodus.com",
    "rol": {
      "id": "recepcionista",
      "nombre": "Recepcionista",
      "color": "#4CAF50",
      "icono": "👤"
    },
    "permisos": { /* conjunto completo de permisos */ }
  }
}
```

---

### 👥 ISSUE #2: Gestión de Usuarios con Roles
**Prioridad:** 🔥🔥 ALTA

#### Descripción
CRUD completo de usuarios con asignación de roles y gestión de permisos.

#### Endpoints Necesarios

##### `GET /api/usuarios`
Listar todos los usuarios con sus roles.

**Query Params:**
- `page` (number): Página actual (default: 1)
- `limit` (number): Registros por página (default: 20)
- `search` (string): Búsqueda por nombre/email
- `rol` (string): Filtrar por rol específico
- `activo` (boolean): Filtrar por estado activo/inactivo

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": "usr_123456",
        "nombre": "Juan Pérez",
        "email": "juan@hexodus.com",
        "telefono": "+52 123 456 7890",
        "rol": {
          "id": "admin",
          "nombre": "Administrador",
          "color": "#FF5733",
          "icono": "👑"
        },
        "activo": true,
        "ultimoAcceso": "2026-03-08T14:30:00Z",
        "fechaCreacion": "2025-01-15T10:00:00Z",
        "creadoPor": "usr_000001"
      },
      {
        "id": "usr_789012",
        "nombre": "María González",
        "email": "maria@hexodus.com",
        "telefono": "+52 987 654 3210",
        "rol": {
          "id": "recepcionista",
          "nombre": "Recepcionista",
          "color": "#4CAF50",
          "icono": "👤"
        },
        "activo": true,
        "ultimoAcceso": "2026-03-08T13:45:00Z",
        "fechaCreacion": "2025-06-20T09:00:00Z",
        "creadoPor": "usr_123456"
      }
    ],
    "paginacion": {
      "total": 15,
      "pagina": 1,
      "limite": 20,
      "totalPaginas": 1
    }
  }
}
```

##### `POST /api/usuarios`
Crear nuevo usuario con rol asignado.

**Request:**
```json
{
  "nombre": "Carlos Ramírez",
  "email": "carlos@hexodus.com",
  "telefono": "+52 555 123 4567",
  "password": "contraseñaSegura123",
  "rolId": "recepcionista"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "usr_345678",
    "nombre": "Carlos Ramírez",
    "email": "carlos@hexodus.com",
    "telefono": "+52 555 123 4567",
    "rol": {
      "id": "recepcionista",
      "nombre": "Recepcionista",
      "color": "#4CAF50",
      "icono": "👤",
      "descripcion": "Acceso limitado para recepción",
      "permisos": {
        "dashboard": {
          "ver": true,
          "verGraficas": false,
          "verHorasPico": true,
          "verResumenGeneral": true
        },
        "socios": {
          "ver": true,
          "crear": true,
          "editar": true,
          "eliminar": false
        }
        // ... resto de permisos del rol
      }
    },
    "activo": true,
    "fechaCreacion": "2026-03-08T15:00:00Z",
    "creadoPor": "usr_123456"
  },
  "message": "Usuario creado exitosamente con rol 'Recepcionista'"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "USER_EMAIL_EXISTS",
    "message": "Ya existe un usuario con este email"
  }
}
```

##### `GET /api/usuarios/:id`
Obtener detalle de un usuario específico.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "nombre": "Juan Pérez",
    "email": "juan@hexodus.com",
    "telefono": "+52 123 456 7890",
    "rol": {
      "id": "admin",
      "nombre": "Administrador",
      "color": "#FF5733",
      "icono": "👑",
      "esAdministrador": true,
      "esSistema": true,
      "permisos": { /* permisos completos */ }
    },
    "activo": true,
    "ultimoAcceso": "2026-03-08T14:30:00Z",
    "fechaCreacion": "2025-01-15T10:00:00Z",
    "creadoPor": "usr_000001",
    "historialRoles": [
      {
        "rolId": "admin",
        "rolNombre": "Administrador",
        "fechaAsignacion": "2025-01-15T10:00:00Z",
        "asignadoPor": "usr_000001",
        "observaciones": "Usuario fundador del sistema"
      }
    ]
  }
}
```

##### `PATCH /api/usuarios/:id`
Actualizar información de usuario (incluyendo cambio de rol).

**Request:**
```json
{
  "nombre": "Juan Pérez García",
  "telefono": "+52 123 456 7891",
  "rolId": "recepcionista",
  "observacionesCambioRol": "Se cambia a recepcionista por rotación de personal"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "nombre": "Juan Pérez García",
    "telefono": "+52 123 456 7891",
    "rol": {
      "id": "recepcionista",
      "nombre": "Recepcionista",
      "color": "#4CAF50"
    }
  },
  "message": "Usuario actualizado exitosamente. Rol cambiado de 'Administrador' a 'Recepcionista'"
}
```

##### `DELETE /api/usuarios/:id`
Desactivar usuario (soft delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario desactivado exitosamente"
}
```

---

## 2. Gestión de Roles

### 🛡️ ISSUE #3: CRUD de Roles
**Prioridad:** 🔥🔥 ALTA

#### Descripción
Sistema completo para crear, leer, actualizar y eliminar roles personalizados.

#### Endpoints Necesarios

##### `GET /api/roles`
Listar todos los roles disponibles (sistema + personalizados).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "admin",
        "nombre": "Administrador",
        "descripcion": "Acceso total al sistema",
        "color": "#FF5733",
        "icono": "👑",
        "esAdministrador": true,
        "esSistema": true,
        "cantidadUsuarios": 2,
        "fechaCreacion": "2025-01-01T00:00:00Z",
        "permisos": { /* conjunto completo */ }
      },
      {
        "id": "recepcionista",
        "nombre": "Recepcionista",
        "descripcion": "Acceso limitado para personal de recepción",
        "color": "#4CAF50",
        "icono": "👤",
        "esAdministrador": false,
        "esSistema": true,
        "cantidadUsuarios": 8,
        "fechaCreacion": "2025-01-01T00:00:00Z",
        "permisos": { /* conjunto específico */ }
      },
      {
        "id": "custom_1234567890",
        "nombre": "Supervisor de Ventas",
        "descripcion": "Acceso a ventas, inventario y reportes de ventas",
        "color": "#2196F3",
        "icono": "📊",
        "esAdministrador": false,
        "esSistema": false,
        "cantidadUsuarios": 3,
        "fechaCreacion": "2025-08-15T12:00:00Z",
        "creadoPor": "usr_123456",
        "permisos": {
          "dashboard": { "ver": true, "verGraficas": true, "verAnalisis": false },
          "ventas": { /* todos true */ },
          "inventario": { "ver": true, "crear": false, "editar": false },
          "reportes": { "ver": true, "verReporteVentas": true }
        }
      }
    ],
    "estadisticas": {
      "totalRoles": 3,
      "rolesSistema": 2,
      "rolesPersonalizados": 1
    }
  }
}
```

##### `GET /api/roles/:id`
Obtener detalle de un rol específico.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "recepcionista",
    "nombre": "Recepcionista",
    "descripcion": "Acceso limitado para personal de recepción",
    "color": "#4CAF50",
    "icono": "👤",
    "esAdministrador": false,
    "esSistema": true,
    "cantidadUsuarios": 8,
    "usuarios": [
      {
        "id": "usr_789012",
        "nombre": "María González",
        "email": "maria@hexodus.com",
        "activo": true
      }
      // ... resto de usuarios con este rol
    ],
    "permisos": {
      "dashboard": {
        "ver": true,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "verGraficas": false,
        "verAnalisis": false,
        "verHorasPico": true,
        "verResumenGeneral": true
      },
      "membresias": {
        "ver": true,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "activar": false,
        "suspender": false,
        "verHistorial": true,
        "verAnalisis": false
      },
      "socios": {
        "ver": true,
        "crear": true,
        "editar": true,
        "eliminar": false,
        "verHistorial": true,
        "exportar": false
      },
      "asistencia": {
        "ver": true,
        "crear": true,
        "editar": true,
        "eliminar": true,
        "registrarManual": true,
        "verReportes": false
      },
      "ventas": {
        "ver": true,
        "crear": true,
        "editar": false,
        "eliminar": false,
        "verAnalisis": false,
        "crearCorte": true,
        "verCortesAnteriores": false
      },
      "inventario": {
        "ver": true,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "ajustarStock": true,
        "verMovimientos": true,
        "gestionarCategorias": false
      },
      "movimientos": {
        "ver": true,
        "crear": true,
        "editar": false,
        "eliminar": false,
        "verComparaciones": false
      },
      "reportes": {
        "ver": false,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "verReporteVentas": false,
        "verReporteFinanciero": false,
        "exportar": false
      },
      "usuarios": {
        "ver": false,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "gestionarRoles": false
      },
      "configuracion": {
        "ver": false,
        "crear": false,
        "editar": false,
        "eliminar": false,
        "gestionarRoles": false,
        "gestionarSistema": false
      },
      "notificaciones": {
        "ver": true,
        "marcarLeida": true,
        "eliminar": false
      }
    },
    "fechaCreacion": "2025-01-01T00:00:00Z",
    "fechaActualizacion": null
  }
}
```

##### `POST /api/roles`
Crear nuevo rol personalizado.

**Request:**
```json
{
  "nombre": "Supervisor de Ventas",
  "descripcion": "Acceso a ventas, inventario y reportes de ventas",
  "color": "#2196F3",
  "icono": "📊",
  "permisos": {
    "dashboard": {
      "ver": true,
      "crear": false,
      "editar": false,
      "eliminar": false,
      "verGraficas": true,
      "verAnalisis": false,
      "verHorasPico": true,
      "verResumenGeneral": true
    },
    "ventas": {
      "ver": true,
      "crear": true,
      "editar": true,
      "eliminar": false,
      "verAnalisis": true,
      "crearCorte": true,
      "verCortesAnteriores": true
    },
    "inventario": {
      "ver": true,
      "crear": true,
      "editar": true,
      "eliminar": false,
      "ajustarStock": true,
      "verMovimientos": true,
      "gestionarCategorias": false
    },
    "reportes": {
      "ver": true,
      "crear": true,
      "verReporteVentas": true,
      "verReporteFinanciero": false,
      "exportar": true
    }
    // ... resto de módulos (false por defecto si no se especifica)
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "custom_1234567890",
    "nombre": "Supervisor de Ventas",
    "descripcion": "Acceso a ventas, inventario y reportes de ventas",
    "color": "#2196F3",
    "icono": "📊",
    "esAdministrador": false,
    "esSistema": false,
    "permisos": { /* permisos especificados */ },
    "fechaCreacion": "2026-03-08T15:00:00Z",
    "creadoPor": "usr_123456"
  },
  "message": "Rol 'Supervisor de Ventas' creado exitosamente"
}
```

##### `PATCH /api/roles/:id`
Actualizar rol personalizado (solo permite actualizar roles custom).

**Request:**
```json
{
  "nombre": "Supervisor de Ventas Senior",
  "descripcion": "Acceso completo a ventas, inventario y todos los reportes",
  "permisos": {
    "reportes": {
      "ver": true,
      "crear": true,
      "verReporteVentas": true,
      "verReporteFinanciero": true,
      "exportar": true
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "custom_1234567890",
    "nombre": "Supervisor de Ventas Senior",
    "descripcion": "Acceso completo a ventas, inventario y todos los reportes",
    "permisos": { /* permisos actualizados */ }
  },
  "message": "Rol actualizado exitosamente. 3 usuarios con este rol serán afectados."
}
```

**Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "ROLE_SYSTEM_PROTECTED",
    "message": "No se puede modificar un rol del sistema"
  }
}
```

##### `DELETE /api/roles/:id`
Eliminar rol personalizado.

**Query Params:**
- `reasignarA` (string): ID del rol al que se reasignarán los usuarios (requerido si hay usuarios)

**Response (200):**
```json
{
  "success": true,
  "message": "Rol eliminado exitosamente. 3 usuarios fueron reasignados al rol 'Recepcionista'"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "ROLE_HAS_USERS",
    "message": "El rol tiene 3 usuarios asignados. Especifica un rol de reasignación.",
    "data": {
      "cantidadUsuarios": 3,
      "rolesDisponibles": [
        { "id": "recepcionista", "nombre": "Recepcionista" },
        { "id": "custom_9876543210", "nombre": "Otro Rol Custom" }
      ]
    }
  }
}
```

##### `POST /api/roles/:id/duplicar`
Duplicar un rol existente para crear uno nuevo.

**Request:**
```json
{
  "nombre": "Supervisor de Ventas - Turno Noche",
  "descripcion": "Basado en Supervisor de Ventas con restricciones horarias"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "custom_9999999999",
    "nombre": "Supervisor de Ventas - Turno Noche",
    "permisos": { /* copiados del rol original */ }
  },
  "message": "Rol duplicado exitosamente"
}
```

---

## 3. Permisos y Validación

### 🔒 ISSUE #4: Middleware de Validación de Permisos
**Prioridad:** 🔥🔥🔥 CRÍTICA

#### Descripción
Middleware para validar permisos en cada request según el rol del usuario.

#### Endpoints Necesarios

##### `POST /api/permisos/validar`
Validar si el usuario tiene un permiso específico.

**Request:**
```json
{
  "modulo": "socios",
  "accion": "eliminar"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tienePermiso": false,
    "rol": "recepcionista",
    "rolPermiso": false,
    "mensaje": "El rol 'Recepcionista' no tiene permiso para 'eliminar' en el módulo 'socios'"
  }
}
```

##### `POST /api/permisos/validar-batch`
Validar múltiples permisos a la vez.

**Request:**
```json
{
  "validaciones": [
    { "modulo": "socios", "accion": "ver" },
    { "modulo": "socios", "accion": "crear" },
    { "modulo": "socios", "accion": "eliminar" }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resultados": [
      { "modulo": "socios", "accion": "ver", "tienePermiso": true },
      { "modulo": "socios", "accion": "crear", "tienePermiso": true },
      { "modulo": "socios", "accion": "eliminar", "tienePermiso": false }
    ],
    "resumen": {
      "total": 3,
      "permitidos": 2,
      "denegados": 1
    }
  }
}
```

##### `GET /api/permisos/modulos`
Obtener lista de módulos accesibles para el usuario actual.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "modulosAccesibles": [
      {
        "id": "dashboard",
        "nombre": "Dashboard",
        "icono": "📊",
        "permisos": {
          "ver": true,
          "verHorasPico": true,
          "verResumenGeneral": true
        }
      },
      {
        "id": "socios",
        "nombre": "Socios",
        "icono": "👥",
        "permisos": {
          "ver": true,
          "crear": true,
          "editar": true,
          "eliminar": false
        }
      }
      // ... solo módulos donde user.permisos[modulo].ver === true
    ],
    "modulosRestringidos": [
      "reportes",
      "usuarios",
      "configuracion"
    ]
  }
}
```

#### Implementación del Middleware

**Ejemplo de uso en rutas protegidas:**

```javascript
// Backend - Express/Node.js
const verificarPermiso = (modulo, accion) => {
  return async (req, res, next) => {
    try {
      const { user } = req; // Del token JWT
      
      // Si es administrador, tiene todos los permisos
      if (user.rol.esAdministrador) {
        return next();
      }
      
      // Verificar permiso específico
      const tienePermiso = user.permisos[modulo]?.[accion] === true;
      
      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: `No tienes permiso para '${accion}' en el módulo '${modulo}'`,
            requiredPermission: { modulo, accion }
          }
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "PERMISSION_CHECK_ERROR",
          message: "Error al verificar permisos"
        }
      });
    }
  };
};

// Uso en rutas:
router.get('/api/socios', verificarPermiso('socios', 'ver'), obtenerSocios);
router.post('/api/socios', verificarPermiso('socios', 'crear'), crearSocio);
router.delete('/api/socios/:id', verificarPermiso('socios', 'eliminar'), eliminarSocio);
```

---

## 4. Integración con Módulos

### 📦 ISSUE #5: Protección de Endpoints por Módulo
**Prioridad:** 🔥 MEDIA

#### Descripción
Aplicar validación de permisos a todos los endpoints existentes.

#### Mapeo de Endpoints a Permisos

##### **Dashboard**
```javascript
GET    /api/dashboard/resumen          → permisos.dashboard.ver
GET    /api/dashboard/graficas         → permisos.dashboard.verGraficas
GET    /api/dashboard/horas-pico       → permisos.dashboard.verHorasPico
GET    /api/dashboard/analisis         → permisos.dashboard.verAnalisis
```

##### **Membresías**
```javascript
GET    /api/membresias                 → permisos.membresias.ver
POST   /api/membresias                 → permisos.membresias.crear
PATCH  /api/membresias/:id             → permisos.membresias.editar
DELETE /api/membresias/:id             → permisos.membresias.eliminar
POST   /api/membresias/:id/activar     → permisos.membresias.activar
POST   /api/membresias/:id/suspender   → permisos.membresias.suspender
```

##### **Socios**
```javascript
GET    /api/socios                     → permisos.socios.ver
POST   /api/socios                     → permisos.socios.crear
PATCH  /api/socios/:id                 → permisos.socios.editar
DELETE /api/socios/:id                 → permisos.socios.eliminar
GET    /api/socios/:id/historial       → permisos.socios.verHistorial
GET    /api/socios/exportar            → permisos.socios.exportar
```

##### **Asistencia**
```javascript
GET    /api/asistencia                 → permisos.asistencia.ver
POST   /api/asistencia                 → permisos.asistencia.crear
POST   /api/asistencia/manual          → permisos.asistencia.registrarManual
```

##### **Ventas**
```javascript
GET    /api/ventas                     → permisos.ventas.ver
POST   /api/ventas                     → permisos.ventas.crear
PATCH  /api/ventas/:id                 → permisos.ventas.editar
DELETE /api/ventas/:id                 → permisos.ventas.eliminar
POST   /api/ventas/corte               → permisos.ventas.crearCorte
GET    /api/ventas/analisis            → permisos.ventas.verAnalisis
```

##### **Inventario**
```javascript
GET    /api/inventario                 → permisos.inventario.ver
POST   /api/inventario                 → permisos.inventario.crear
PATCH  /api/inventario/:id             → permisos.inventario.editar
DELETE /api/inventario/:id             → permisos.inventario.eliminar
POST   /api/inventario/:id/ajustar     → permisos.inventario.ajustarStock
GET    /api/inventario/categorias      → permisos.inventario.ver
POST   /api/inventario/categorias      → permisos.inventario.gestionarCategorias
```

##### **Movimientos**
```javascript
GET    /api/movimientos                → permisos.movimientos.ver
POST   /api/movimientos                → permisos.movimientos.crear
PATCH  /api/movimientos/:id            → permisos.movimientos.editar
DELETE /api/movimientos/:id            → permisos.movimientos.eliminar
```

##### **Reportes**
```javascript
GET    /api/reportes                   → permisos.reportes.ver
POST   /api/reportes                   → permisos.reportes.crear
GET    /api/reportes/ventas            → permisos.reportes.verReporteVentas
GET    /api/reportes/financiero        → permisos.reportes.verReporteFinanciero
GET    /api/reportes/:id/exportar      → permisos.reportes.exportar
```

##### **Usuarios**
```javascript
GET    /api/usuarios                   → permisos.usuarios.ver
POST   /api/usuarios                   → permisos.usuarios.crear
PATCH  /api/usuarios/:id               → permisos.usuarios.editar
DELETE /api/usuarios/:id               → permisos.usuarios.eliminar
```

##### **Configuración**
```javascript
GET    /api/configuracion              → permisos.configuracion.ver
PATCH  /api/configuracion              → permisos.configuracion.editar
GET    /api/configuracion/roles        → permisos.configuracion.gestionarRoles
```

---

## 5. Auditoría

### 📝 ISSUE #6: Sistema de Auditoría de Acciones
**Prioridad:** 🔔 MEDIA-BAJA

#### Descripción
Registrar todas las acciones importantes realizadas por usuarios para trazabilidad.

#### Endpoints Necesarios

##### `GET /api/auditoria`
Obtener log de auditoría.

**Query Params:**
- `usuarioId` (string): Filtrar por usuario
- `modulo` (string): Filtrar por módulo
- `accion` (string): Filtrar por tipo de acción
- `fechaInicio` (date): Fecha inicio
- `fechaFin` (date): Fecha fin
- `page`, `limit`: Paginación

**Response (200):**
```json
{
  "success": true,
  "data": {
    "registros": [
      {
        "id": "audit_123456",
        "timestamp": "2026-03-08T15:30:00Z",
        "usuario": {
          "id": "usr_123456",
          "nombre": "Juan Pérez",
          "rol": "Administrador"
        },
        "modulo": "roles",
        "accion": "crear",
        "descripcion": "Creó el rol 'Supervisor de Ventas'",
        "detalles": {
          "rolId": "custom_1234567890",
          "rolNombre": "Supervisor de Ventas"
        },
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0..."
      },
      {
        "id": "audit_123457",
        "timestamp": "2026-03-08T14:20:00Z",
        "usuario": {
          "id": "usr_789012",
          "nombre": "María González",
          "rol": "Recepcionista"
        },
        "modulo": "socios",
        "accion": "crear",
        "descripcion": "Registró nuevo socio 'Carlos López'",
        "detalles": {
          "socioId": "soc_999888",
          "socioNombre": "Carlos López"
        }
      }
    ],
    "paginacion": {
      "total": 1250,
      "pagina": 1,
      "limite": 20,
      "totalPaginas": 63
    }
  }
}
```

##### `GET /api/auditoria/estadisticas`
Estadísticas de uso del sistema.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accionesPorModulo": {
      "socios": 450,
      "ventas": 320,
      "asistencia": 1200,
      "inventario": 85
    },
    "accionesPorUsuario": [
      { "usuarioId": "usr_789012", "nombre": "María González", "acciones": 890 },
      { "usuarioId": "usr_123456", "nombre": "Juan Pérez", "acciones": 650 }
    ],
    "usuariosMasActivos": [
      { "usuarioId": "usr_789012", "nombre": "María González", "rol": "Recepcionista" }
    ]
  }
}
```

---

## 📊 Estructura de Base de Datos Sugerida

### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  rol_id VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por VARCHAR(50),
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);
```

### Tabla: `roles`
```sql
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color VARCHAR(7),
  icono VARCHAR(10),
  es_administrador BOOLEAN DEFAULT false,
  es_sistema BOOLEAN DEFAULT false,
  permisos JSON NOT NULL, -- Objeto completo de permisos
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP,
  creado_por VARCHAR(50)
);
```

### Tabla: `historial_roles`
```sql
CREATE TABLE historial_roles (
  id SERIAL PRIMARY KEY,
  usuario_id VARCHAR(50) NOT NULL,
  rol_id VARCHAR(50) NOT NULL,
  rol_nombre VARCHAR(100),
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asignado_por VARCHAR(50),
  observaciones TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);
```

### Tabla: `auditoria`
```sql
CREATE TABLE auditoria (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id VARCHAR(50),
  modulo VARCHAR(50),
  accion VARCHAR(50),
  descripcion TEXT,
  detalles JSON,
  ip VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

---

## 🔐 Consideraciones de Seguridad

### 1. **Tokens JWT**
- Incluir en el payload: `userId`, `rolId`, `permisos` (completos)
- Tiempo de expiración: 1 hora (token de acceso)
- Refresh token: 7 días
- Firmar con secret fuerte (mínimo 256 bits)

### 2. **Validación de Permisos**
- SIEMPRE validar permisos en el backend (nunca confiar solo en frontend)
- Middleware obligatorio en todas las rutas protegidas
- Roles de sistema NO modificables vía API

### 3. **Protección contra Escalada de Privilegios**
- Solo administradores pueden:
  - Crear/modificar roles
  - Asignar rol de administrador a otros usuarios
  - Acceder a módulo de usuarios
- Usuarios NO pueden modificar su propio rol

### 4. **Rate Limiting**
- Aplicar límites a endpoints sensibles:
  - Login: 5 intentos por 15 minutos
  - Creación de roles: 10 por hora
  - Cambio de roles: 20 por hora

---

## 🎯 Prioridad de Implementación

### FASE 1 - Core (Semana 1-2) 🔥🔥🔥
1. ✅ Autenticación con JWT (ISSUE #1)
2. ✅ Middleware de validación de permisos (ISSUE #4)
3. ✅ CRUD de usuarios con roles (ISSUE #2)

### FASE 2 - Gestión (Semana 3) 🔥🔥
4. ✅ CRUD de roles (ISSUE #3)
5. ✅ Endpoints de validación de permisos (ISSUE #4)

### FASE 3 - Integración (Semana 4) 🔥
6. ✅ Aplicar middleware a todos los módulos (ISSUE #5)
7. ✅ Testing de permisos end-to-end

### FASE 4 - Auditoría (Opcional) 🔔
8. ⏳ Sistema de auditoría (ISSUE #6)

---

## 📝 Notas para el Frontend

### Almacenamiento de Token
```javascript
// Guardar token después del login
localStorage.setItem('hexodus_token', response.data.token);
localStorage.setItem('hexodus_user', JSON.stringify(response.data.user));
```

### Interceptor de Axios
```javascript
// Agregar token a todas las requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('hexodus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores 401/403
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado → intentar refresh
      // Si falla → logout y redirect a login
    }
    if (error.response?.status === 403) {
      // Sin permisos → mostrar mensaje
      toast.error('No tienes permiso para realizar esta acción');
    }
    return Promise.reject(error);
  }
);
```

### Hook usePermissions
```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (modulo: string, accion: string) => {
    if (user?.rol?.esAdministrador) return true;
    return user?.permisos?.[modulo]?.[accion] === true;
  };
  
  const canAccessModule = (modulo: string) => {
    return hasPermission(modulo, 'ver');
  };
  
  return { hasPermission, canAccessModule, permisos: user?.permisos };
}
```

---

## ✅ Checklist de Verificación

Antes de considerar completa la implementación, verificar:

- [ ] Autenticación retorna permisos completos en el token
- [ ] Todos los endpoints tienen middleware de validación
- [ ] Roles de sistema NO son modificables
- [ ] Solo administradores pueden gestionar roles
- [ ] Cambio de rol actualiza el token (relogin o refresh)
- [ ] Usuarios NO pueden elevar sus propios privilegios
- [ ] Eliminación de rol requiere reasignación de usuarios
- [ ] Historial de cambios de roles se registra
- [ ] Frontend valida permisos antes de mostrar acciones
- [ ] Errores 403 tienen mensajes claros

---

**Fecha de creación:** 8 de marzo de 2026  
**Última actualización:** 8 de marzo de 2026  
**Versión:** 1.0.0
