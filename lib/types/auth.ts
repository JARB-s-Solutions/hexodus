// ================================================
// TIPOS DE DATOS PARA AUTENTICACIÓN
// ================================================

export interface User {
  id: string
  username: string
  email: string
  nombre_completo: string
  rol: 'admin' | 'staff' | 'usuario'
  activo: boolean
  avatar?: string
  created_at: string
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
