// ================================================
// SERVICIO DE AUTENTICACIÓN
// ================================================

import { apiPost, ApiError, API_ENDPOINTS } from './api'
import type {
  LoginCredentials,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  User,
  PermisosBackend,
} from './types/auth'

// MODO DE DESARROLLO: Usar Mock API (sin backend)
// Cambia a true para usar datos simulados
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'

// Importar Mock API solo si está habilitado
let mockLogin: any, mockForgotPassword: any, mockLogout: any
if (USE_MOCK_API) {
  import('./mock-api').then(module => {
    mockLogin = module.mockLogin
    mockForgotPassword = module.mockForgotPassword
    mockLogout = module.mockLogout
  })
}

// Constantes de almacenamiento
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const EXPIRES_KEY = 'auth_expires'

/**
 * Servicio de autenticación
 */
export const AuthService = {
  /**
   * Iniciar sesión
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      let response: LoginResponse

      // Usar Mock API o API real según configuración
      if (USE_MOCK_API && mockLogin) {
        response = await mockLogin(username, password)
      } else {
        response = await apiPost<LoginResponse>(
          API_ENDPOINTS.LOGIN,
          { username, password } as LoginCredentials
        )
      }

      // Guardar datos de autenticación
      if (response.token) {
        // Si no viene expires_at, calcular 7 días desde ahora (default del backend)
        const expiresAt = response.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        this.saveAuthData(response.token, response.user, expiresAt)
      }

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(0, 'Error al conectar con el servidor')
    }
  },

  /**
   * Cerrar sesión
   * Nota: No existe endpoint de logout en el backend, solo limpiamos localStorage
   */
  async logout(): Promise<void> {
    console.log('🚪 Cerrando sesión...')
    
    // Solo limpiar datos locales (no hay endpoint de logout en el backend)
    this.clearAuthData()
    
    console.log('✅ Sesión cerrada correctamente')
  },

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      let response: ForgotPasswordResponse

      if (USE_MOCK_API && mockForgotPassword) {
        response = await mockForgotPassword(email)
      } else {
        response = await apiPost<ForgotPasswordResponse>(
          API_ENDPOINTS.FORGOT_PASSWORD,
          { email } as ForgotPasswordRequest
        )
      }
      
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(0, 'Error al conectar con el servidor')
    }
  },

  /**
   * Validar formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validar formato de contraseña
   * Mínimo 8 caracteres, al menos una mayúscula, un número y un símbolo
   */
  isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
    return passwordRegex.test(password)
  },

  /**
   * Guardar datos de autenticación
   */
  saveAuthData(token: string, user: User, expiresAt: string): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(EXPIRES_KEY, expiresAt)
    
    // Disparar evento personalizado para notificar el login
    console.log('🔔 Disparando evento auth:login...')
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user, token } }))
  },

  /**
   * Limpiar datos de autenticación
   */
  clearAuthData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    
    // Disparar evento personalizado para notificar el logout
    console.log('🔔 Disparando evento auth:logout...')
    window.dispatchEvent(new CustomEvent('auth:logout'))
  },

  /**
   * Obtener token de autenticación
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  /**
   * Obtener usuario actual
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null

    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  },

  /**
   * Verificar permiso granular del usuario actual o de un usuario dado.
   */
  hasPermission(modulo: string, accion: string, user?: User | null): boolean {
    const currentUser = user ?? this.getUser()
    if (!currentUser) return false

    if (
      currentUser.esAdministrador ||
      (currentUser.permisos as PermisosBackend | undefined)?.todo === 'absoluto'
    ) {
      return true
    }

    const permisosModulo = currentUser.permisos?.[modulo]
    if (!permisosModulo || typeof permisosModulo !== 'object') return false

    return (permisosModulo as Record<string, boolean | undefined>)[accion] === true
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken()
    const expiresAt = localStorage.getItem(EXPIRES_KEY)

    if (!token || !expiresAt) return false

    // Verificar si el token ha expirado
    const expirationDate = new Date(expiresAt)
    const now = new Date()

    if (now >= expirationDate) {
      this.clearAuthData()
      return false
    }

    return true
  },

  /**
   * Redirigir al login si no está autenticado
   */
  requireAuth(): boolean {
    if (typeof window === 'undefined') return false
    
    if (!this.isAuthenticated()) {
      window.location.href = '/login'
      return false
    }
    return true
  },

  /**
   * Redirigir al dashboard si ya está autenticado
   */
  redirectIfAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    if (this.isAuthenticated()) {
      window.location.href = '/dashboard'
      return true
    }
    return false
  },
}
