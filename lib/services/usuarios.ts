/**
 * Servicio de Usuarios
 * Maneja todas las operaciones relacionadas con la gestión de usuarios
 */

import { AuthService } from '../auth'

// ============================================================================
// TIPOS DE LA API
// ============================================================================

export interface RolAPI {
  id: string
  nombre: string
  color: string | null
  icono: string | null
}

export interface UsuarioAPI {
  id: string
  nombre: string
  email: string
  telefono: string | null
  username: string
  rol: RolAPI
  activo: boolean
  ultimoAcceso: string | null
  fechaCreacion: string
}

export interface ObtenerUsuariosResponse {
  success: boolean
  data: {
    usuarios: UsuarioAPI[]
    paginacion: {
      total: number
      pagina: number
      limite: number
      totalPaginas: number
    }
  }
}

export interface FiltrosUsuarios {
  page?: number
  limit?: number
  search?: string
  rol?: string
  activo?: boolean
}

export interface CrearUsuarioRequest {
  nombre: string
  email: string
  telefono?: string
  username: string
  password: string
  rolId: string
}

export interface ActualizarUsuarioRequest {
  nombre?: string
  email?: string
  telefono?: string
  username?: string
  password?: string
  rolId?: string
  activo?: boolean
}

export interface CrearUsuarioResponse {
  success: boolean
  message?: string
  data?: {
    usuario: UsuarioAPI
  }
}

export interface ActualizarUsuarioResponse {
  success: boolean
  message?: string
  data?: {
    usuario: UsuarioAPI
  }
}

export interface EliminarUsuarioResponse {
  success: boolean
  message?: string
}

// ============================================================================
// SERVICIO
// ============================================================================

class UsuariosServiceClass {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api'
  }

  /**
   * Obtener headers con autenticación
   */
  private async getHeaders(): Promise<HeadersInit> {
    const token = AuthService.getToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    }
  }

  /**
   * Construir query string desde objeto de filtros
   */
  private buildQueryString(filtros: FiltrosUsuarios): string {
    const params = new URLSearchParams()
    
    if (filtros.page) params.append('page', filtros.page.toString())
    if (filtros.limit) params.append('limit', filtros.limit.toString())
    if (filtros.search) params.append('search', filtros.search)
    if (filtros.rol) params.append('rol', filtros.rol)
    if (filtros.activo !== undefined) params.append('activo', filtros.activo.toString())
    
    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Obtener todos los usuarios con filtros opcionales
   */
  async obtenerUsuarios(filtros: FiltrosUsuarios = {}): Promise<ObtenerUsuariosResponse> {
    try {
      const headers = await this.getHeaders()
      const queryString = this.buildQueryString(filtros)
      const url = `${this.baseURL}/usuarios${queryString}`
      
      console.log('[UsuariosService] GET', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[UsuariosService] Error HTTP:', response.status, errorData)
        throw new Error(errorData.message || `Error HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('[UsuariosService] Usuarios obtenidos:', data.data?.paginacion)
      
      return data
    } catch (error) {
      console.error('[UsuariosService] Error al obtener usuarios:', error)
      throw error
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async obtenerUsuarioPorId(id: string): Promise<{ success: boolean; data?: { usuario: UsuarioAPI } }> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseURL}/usuarios/${id}`
      
      console.log('[UsuariosService] GET', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[UsuariosService] Error al obtener usuario:', error)
      throw error
    }
  }

  /**
   * Crear nuevo usuario
   */
  async crearUsuario(datos: CrearUsuarioRequest): Promise<CrearUsuarioResponse> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseURL}/usuarios`
      
      console.log('[UsuariosService] POST', url, datos)
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('[UsuariosService] Usuario creado:', data)
      
      return data
    } catch (error) {
      console.error('[UsuariosService] Error al crear usuario:', error)
      throw error
    }
  }

  /**
   * Actualizar usuario existente
   */
  async actualizarUsuario(id: string, datos: ActualizarUsuarioRequest): Promise<ActualizarUsuarioResponse> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseURL}/usuarios/${id}`
      
      console.log('[UsuariosService] PUT', url, datos)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(datos)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('[UsuariosService] Usuario actualizado:', data)
      
      return data
    } catch (error) {
      console.error('[UsuariosService] Error al actualizar usuario:', error)
      throw error
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async eliminarUsuario(id: string): Promise<EliminarUsuarioResponse> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseURL}/usuarios/${id}`
      
      console.log('[UsuariosService] DELETE', url)
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('[UsuariosService] Usuario eliminado:', data)
      
      return data
    } catch (error) {
      console.error('[UsuariosService] Error al eliminar usuario:', error)
      throw error
    }
  }

  /**
   * Cambiar estado de usuario (activo/inactivo)
   */
  async cambiarEstado(id: string, activo: boolean): Promise<ActualizarUsuarioResponse> {
    return this.actualizarUsuario(id, { activo })
  }
}

export const UsuariosService = new UsuariosServiceClass()
