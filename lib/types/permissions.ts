/**
 * Sistema de Roles y Permisos - Inspirado en Discord
 * Define la estructura para gestionar permisos granulares por módulo
 */

// ============================================================================
// TIPOS DE MÓDULOS
// ============================================================================

export type Modulo = 
  | 'dashboard'
  | 'membresias'
  | 'socios'
  | 'asistencia'
  | 'ventas'
  | 'inventario'
  | 'movimientos'
  | 'reportes'
  | 'usuarios'
  | 'configuracion'
  | 'notificaciones'

// ============================================================================
// ACCIONES BÁSICAS
// ============================================================================

export interface AccionesBasicas {
  ver: boolean          // Ver el módulo
  crear: boolean        // Crear nuevos registros
  editar: boolean       // Editar registros existentes
  eliminar: boolean     // Eliminar registros
}

// ============================================================================
// PERMISOS ESPECÍFICOS POR MÓDULO
// ============================================================================

export interface PermisosDashboard extends AccionesBasicas {
  verGraficas: boolean
  verAnalisis: boolean
  verHorasPico: boolean
  verResumenGeneral: boolean
}

export interface PermisosMembresias extends AccionesBasicas {
  activar: boolean
  desactivar: boolean
  renovar: boolean
  verHistorial: boolean
  aplicarDescuentos: boolean
}

export interface PermisosSocios extends AccionesBasicas {
  exportar: boolean
  importar: boolean
  verHistorial: boolean
  editarFoto: boolean
}

export interface PermisosAsistencia extends AccionesBasicas {
  registrarEntrada: boolean
  registrarSalida: boolean
  verHistorial: boolean
  exportar: boolean
}

export interface PermisosVentas extends AccionesBasicas {
  verAnalisis: boolean
  crearCorte: boolean
  consultarCorte: boolean
  verHistorial: boolean
  imprimirTicket: boolean
  aplicarDescuentos: boolean
}

export interface PermisosInventario extends AccionesBasicas {
  ajustarStock: boolean
  verHistorial: boolean
  gestionarCategorias: boolean
  eliminarCategoria: boolean
  exportar: boolean
}

export interface PermisosMovimientos extends AccionesBasicas {
  verComparaciones: boolean
  verConceptos: boolean
  crearConcepto: boolean
  editarConcepto: boolean
  eliminarConcepto: boolean
  exportar: boolean
}

export interface PermisosReportes extends AccionesBasicas {
  exportar: boolean
  programarReportes: boolean
  verHistorial: boolean
}

export interface PermisosUsuarios extends AccionesBasicas {
  gestionarRoles: boolean
  asignarPermisos: boolean
  desactivarUsuarios: boolean
}

export interface PermisosConfiguracion extends AccionesBasicas {
  datosGimnasio: boolean
  apariencia: boolean
  notificaciones: boolean
  metodosPago: boolean
  avanzado: boolean
}

// ============================================================================
// CONJUNTO DE PERMISOS
// ============================================================================

export interface ConjuntoPermisos {
  dashboard: PermisosDashboard
  membresias: PermisosMembresias
  socios: PermisosSocios
  asistencia: PermisosAsistencia
  ventas: PermisosVentas
  inventario: PermisosInventario
  movimientos: PermisosMovimientos
  reportes: PermisosReportes
  usuarios: PermisosUsuarios
  configuracion: PermisosConfiguracion
  notificaciones: AccionesBasicas
}

// ============================================================================
// ROL
// ============================================================================

export interface Rol {
  id: string
  nombre: string
  descripcion: string
  color: string
  icono?: string
  permisos: ConjuntoPermisos
  esAdministrador: boolean
  esSistema: boolean  // No se puede eliminar (ej: Administrador, Recepcionista)
  creadoPor?: string
  fechaCreacion: string
  fechaModificacion?: string
}

// ============================================================================
// ROLES PREDEFINIDOS
// ============================================================================

export const ROLES_SISTEMA = {
  ADMINISTRADOR: 'admin',
  RECEPCIONISTA: 'recepcionista',
  ENTRENADOR: 'entrenador',
  GERENTE: 'gerente'
} as const

// ============================================================================
// HELPER TYPES
// ============================================================================

export type NombreRolSistema = typeof ROLES_SISTEMA[keyof typeof ROLES_SISTEMA]

export interface AsignacionRol {
  usuarioId: string
  rolId: string
  asignadoPor: string
  fechaAsignacion: string
}
