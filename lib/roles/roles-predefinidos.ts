/**
 * Roles Predefinidos del Sistema
 * Define los roles por defecto con sus permisos específicos
 */

import type { Rol, ConjuntoPermisos } from '@/lib/types/permissions'
import { ROLES_SISTEMA } from '@/lib/types/permissions'

// ============================================================================
// PERMISOS: ADMINISTRADOR (Acceso total)
// ============================================================================

const PERMISOS_ADMINISTRADOR: ConjuntoPermisos = {
  dashboard: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    verGraficas: true,
    verAnalisis: true,
    verHorasPico: true,
    verResumenGeneral: true
  },
  membresias: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    activar: true,
    desactivar: true,
    renovar: true,
    verHistorial: true,
    aplicarDescuentos: true
  },
  socios: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    exportar: true,
    importar: true,
    verHistorial: true,
    editarFoto: true
  },
  asistencia: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    registrarEntrada: true,
    registrarSalida: true,
    verHistorial: true,
    exportar: true
  },
  ventas: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    verAnalisis: true,
    crearCorte: true,
    consultarCorte: true,
    verHistorial: true,
    imprimirTicket: true,
    aplicarDescuentos: true
  },
  inventario: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    ajustarStock: true,
    verHistorial: true,
    gestionarCategorias: true,
    eliminarCategoria: true,
    exportar: true
  },
  movimientos: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    verComparaciones: true,
    verConceptos: true,
    crearConcepto: true,
    editarConcepto: true,
    eliminarConcepto: true,
    exportar: true
  },
  reportes: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    exportar: true,
    programarReportes: true,
    verHistorial: true
  },
  usuarios: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    gestionarRoles: true,
    asignarPermisos: true,
    desactivarUsuarios: true
  },
  configuracion: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    datosGimnasio: true,
    apariencia: true,
    notificaciones: true,
    metodosPago: true,
    avanzado: true
  },
  notificaciones: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true
  }
}

// ============================================================================
// PERMISOS: RECEPCIONISTA (Acceso limitado)
// ============================================================================

const PERMISOS_RECEPCIONISTA: ConjuntoPermisos = {
  dashboard: {
    ver: true,
    crear: false,
    editar: false,
    eliminar: false,
    verGraficas: false,        // NO: Solo horas pico y asistencias
    verAnalisis: false,         // NO
    verHorasPico: true,         // SÍ
    verResumenGeneral: true     // SÍ: Accesos rápidos
  },
  membresias: {
    ver: true,                  // SÍ: Ver membresías
    crear: false,               // NO: No agregar
    editar: false,              // NO: No editar
    eliminar: false,            // NO: No eliminar
    activar: false,             // NO: No activar
    desactivar: false,          // NO: No desactivar
    renovar: false,             // NO
    verHistorial: true,         // SÍ: Ver historial
    aplicarDescuentos: false    // NO
  },
  socios: {
    ver: true,                  // SÍ: Todo menos eliminar
    crear: true,                // SÍ
    editar: true,               // SÍ
    eliminar: false,            // NO: No eliminar
    exportar: true,             // SÍ
    importar: false,            // NO
    verHistorial: true,         // SÍ
    editarFoto: true            // SÍ
  },
  asistencia: {
    ver: true,                  // SÍ: Todo
    crear: true,                // SÍ
    editar: true,               // SÍ
    eliminar: true,             // SÍ
    registrarEntrada: true,     // SÍ
    registrarSalida: true,      // SÍ
    verHistorial: true,         // SÍ
    exportar: true              // SÍ
  },
  ventas: {
    ver: true,                  // SÍ: Historial y cortes
    crear: true,                // SÍ: Crear ventas
    editar: false,              // NO
    eliminar: false,            // NO
    verAnalisis: false,         // NO: No análisis
    crearCorte: true,           // SÍ: Crear cortes
    consultarCorte: true,       // SÍ
    verHistorial: true,         // SÍ: Ver historial
    imprimirTicket: true,       // SÍ
    aplicarDescuentos: false    // NO
  },
  inventario: {
    ver: true,                  // SÍ: Todo menos eliminar
    crear: true,                // SÍ
    editar: true,               // SÍ
    eliminar: false,            // NO: No eliminar productos
    ajustarStock: true,         // SÍ
    verHistorial: true,         // SÍ
    gestionarCategorias: false, // NO: Solo visualizar
    eliminarCategoria: false,   // NO
    exportar: true              // SÍ
  },
  movimientos: {
    ver: true,                  // SÍ: Ver historial
    crear: true,                // SÍ: Registrar movimiento
    editar: false,              // NO
    eliminar: false,            // NO
    verComparaciones: false,    // NO: No mostrar comparaciones
    verConceptos: true,         // SÍ: Solo visualizar conceptos
    crearConcepto: false,       // NO
    editarConcepto: false,      // NO
    eliminarConcepto: false,    // NO
    exportar: false             // NO
  },
  reportes: {
    ver: false,                 // NO: Nada de reportes
    crear: false,               // NO
    editar: false,              // NO
    eliminar: false,            // NO
    exportar: false,            // NO
    programarReportes: false,   // NO
    verHistorial: false         // NO
  },
  usuarios: {
    ver: false,                 // NO: Nada de gestión de usuarios
    crear: false,               // NO
    editar: false,              // NO
    eliminar: false,            // NO
    gestionarRoles: false,      // NO
    asignarPermisos: false,     // NO
    desactivarUsuarios: false   // NO
  },
  configuracion: {
    ver: false,                 // NO: Nada de configuración
    crear: false,               // NO
    editar: false,              // NO
    eliminar: false,            // NO
    datosGimnasio: false,       // NO
    apariencia: false,          // NO
    notificaciones: false,      // NO
    metodosPago: false,         // NO
    avanzado: false             // NO
  },
  notificaciones: {
    ver: true,                  // SÍ: Ver notificaciones
    crear: false,               // NO
    editar: false,              // NO
    eliminar: false             // NO
  }
}

// ============================================================================
// ROLES PREDEFINIDOS
// ============================================================================

export const ROL_ADMINISTRADOR: Rol = {
  id: ROLES_SISTEMA.ADMINISTRADOR,
  nombre: 'Administrador',
  descripcion: 'Acceso completo a todas las funciones del sistema',
  color: '#10b981', // green-500
  icono: '👑',
  permisos: PERMISOS_ADMINISTRADOR,
  esAdministrador: true,
  esSistema: true,
  fechaCreacion: new Date().toISOString()
}

export const ROL_RECEPCIONISTA: Rol = {
  id: ROLES_SISTEMA.RECEPCIONISTA,
  nombre: 'Recepcionista',
  descripcion: 'Acceso limitado para operaciones diarias del gimnasio',
  color: '#3b82f6', // blue-500
  icono: '📋',
  permisos: PERMISOS_RECEPCIONISTA,
  esAdministrador: false,
  esSistema: true,
  fechaCreacion: new Date().toISOString()
}

// ============================================================================
// LISTA DE ROLES PREDEFINIDOS
// ============================================================================

export const ROLES_PREDEFINIDOS: Rol[] = [
  ROL_ADMINISTRADOR,
  ROL_RECEPCIONISTA
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene un rol predefinido por ID
 */
export function obtenerRolPredefinido(rolId: string): Rol | undefined {
  return ROLES_PREDEFINIDOS.find(rol => rol.id === rolId)
}

/**
 * Verifica si un rol es de sistema (no se puede eliminar)
 */
export function esRolDeSistema(rolId: string): boolean {
  return ROLES_PREDEFINIDOS.some(rol => rol.id === rolId)
}
