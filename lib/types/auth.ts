// ================================================
// TIPOS DE DATOS PARA AUTENTICACIÓN
// ================================================

// Permisos por módulo tal como los devuelve el backend
export interface PermisosModulo {
  ver?: boolean
  crear?: boolean
  editar?: boolean
  eliminar?: boolean
  // socios
  verHistorial?: boolean
  pagar?: boolean
  renovar?: boolean
  // inventario
  ajustarStock?: boolean
  gestionarCategorias?: boolean
  // ventas
  crearCorte?: boolean
  verCortesAnteriores?: boolean
  verAnalisis?: boolean
  // movimientos
  verComparaciones?: boolean
  // dashboard
  verGraficas?: boolean
  // reportes
  verReporteFinanciero?: boolean
  // asistencia
  registrarManual?: boolean
  // configuracion
  gestionarSistema?: boolean
  // comodín
  todo?: 'absoluto'
  [key: string]: boolean | 'absoluto' | undefined
}

export interface PermisosBackend {
  socios?: PermisosModulo
  membresias?: PermisosModulo
  inventario?: PermisosModulo
  ventas?: PermisosModulo
  movimientos?: PermisosModulo
  dashboard?: PermisosModulo
  reportes?: PermisosModulo
  asistencia?: PermisosModulo
  usuarios?: PermisosModulo
  roles?: PermisosModulo
  configuracion?: PermisosModulo
  todo?: 'absoluto'
  [key: string]: PermisosModulo | 'absoluto' | undefined
}

export interface User {
  id?: string
  usuario_id?: number
  uid?: string
  username: string
  email?: string
  nombre_completo: string
  /** Nombre del rol (string) o id del rol */
  rol?: string
  /** Estructura de permisos granulares devuelta por el backend */
  permisos?: PermisosBackend
  /** Indica si el usuario tiene permisos de administrador total */
  esAdministrador?: boolean
  activo?: boolean
  avatar?: string
  created_at?: string
  last_login?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expires_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  password_confirmation: string
}

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}
