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
    verGraficas: true
  },
  membresias: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    activar: true,
    desactivar: true
  },
  socios: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    verHistorial: true,
    pagar: true,
    renovar: true,
    imprimirTicket: true,
  },
  asistencia: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    registrarManual: true,
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
    verCortesAnteriores: true,
    imprimirTicket: true,
    exportar: true
  },
  inventario: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    gestionarCompras: true,
    ajustarStock: true,
    gestionarCategorias: true
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
    verGraficas: true,
    verComparaciones: true,
    exportar: true,
    generar: true,
    verHistorial: true
  },
  usuarios: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    gestionarRoles: true,
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
    metodosPago: true
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
    verGraficas: false
  },
  membresias: {
    ver: true,
    crear: false,
    editar: false,
    eliminar: false,
    activar: false,
    desactivar: false
  },
  socios: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: false,
    verHistorial: true,
    pagar: true,
    renovar: true,
    imprimirTicket: true,
  },
  asistencia: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
    registrarManual: true,
    verHistorial: true,
    exportar: true
  },
  ventas: {
    ver: true,
    crear: true,
    editar: false,
    eliminar: false,
    verAnalisis: false,
    crearCorte: true,
    verCortesAnteriores: true,
    imprimirTicket: true,
    exportar: false
  },
  inventario: {
    ver: true,
    crear: true,
    editar: true,
    eliminar: false,
    gestionarCompras: true,
    ajustarStock: true,
    gestionarCategorias: false
  },
  movimientos: {
    ver: true,
    crear: true,
    editar: false,
    eliminar: false,
    verComparaciones: false,
    verConceptos: true,
    crearConcepto: false,
    editarConcepto: false,
    eliminarConcepto: false,
    exportar: false
  },
  reportes: {
    ver: false,
    crear: false,
    editar: false,
    eliminar: false,
    verGraficas: false,
    verComparaciones: false,
    exportar: false,
    generar: false,
    verHistorial: false
  },
  usuarios: {
    ver: false,
    crear: false,
    editar: false,
    eliminar: false,
    gestionarRoles: false,
    desactivarUsuarios: false
  },
  configuracion: {
    ver: false,
    crear: false,
    editar: false,
    eliminar: false,
    datosGimnasio: false,
    apariencia: false,
    notificaciones: false,
    metodosPago: false
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
