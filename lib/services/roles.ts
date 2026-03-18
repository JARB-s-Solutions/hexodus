/**
 * Servicio de Gestión de Roles y Permisos
 * Maneja la lógica de roles, permisos y asignaciones
 */

import { AuthService } from '@/lib/auth'

// ============================================================================
// TIPOS DE LA API
// ============================================================================

export interface RolAPI {
  id: string
  nombre: string
  descripcion: string | null
  color: string | null
  esSistema: boolean
  usuariosActivos: number
  permisos: Record<string, any>
  fechaCreacion: string
}

export interface ObtenerRolesResponse {
  success: boolean
  data: RolAPI[]
}

export interface CrearRolRequest {
  id: string
  nombre: string
  descripcion?: string
  color?: string
  permisos: Record<string, any>
}

export interface ActualizarRolRequest {
  nombre?: string
  descripcion?: string
  color?: string
  permisos?: Record<string, any>
}

export interface EliminarRolResponse {
  success: boolean
  message?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api'

// ============================================================================
// SERVICIO DE ROLES
// ============================================================================

export class RolesService {
  /**
   * Construir query string desde objeto de filtros
   */
  private static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Obtener headers con autenticación
   */
  private static getHeaders(): HeadersInit {
    const token = AuthService.getToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Obtener todos los roles
   */
  static async obtenerRoles(): Promise<RolAPI[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: ObtenerRolesResponse = await response.json()
      
      if (!data.success) {
        throw new Error('La respuesta de la API no fue exitosa')
      }

      return data.data
    } catch (error) {
      console.error('Error obteniendo roles:', error)
      throw error
    }
  }

  /**
   * Obtener un rol por ID
   */
  static async obtenerRol(rolId: string): Promise<RolAPI> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${rolId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('La respuesta de la API no fue exitosa')
      }

      return data.data
    } catch (error) {
      console.error('Error obteniendo rol:', error)
      throw error
    }
  }

  /**
   * Crear un nuevo rol
   */
  static async crearRol(datosRol: CrearRolRequest): Promise<RolAPI> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(datosRol)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'La respuesta de la API no fue exitosa')
      }

      console.log('✅ Rol creado:', data.data.nombre)
      return data.data
    } catch (error) {
      console.error('Error creando rol:', error)
      throw error
    }
  }

  /**
   * Actualizar un rol existente
   */
  static async actualizarRol(rolId: string, cambios: ActualizarRolRequest): Promise<RolAPI> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${rolId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(cambios)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData?.message ||
          errorData?.error?.message ||
          `Error ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'La respuesta de la API no fue exitosa')
      }

      console.log('✅ Rol actualizado:', data.data.nombre)
      return data.data
    } catch (error) {
      console.error('Error actualizando rol:', error)
      throw error
    }
  }

  /**
   * Eliminar un rol
   */
  static async eliminarRol(rolId: string, reasignarA?: string): Promise<EliminarRolResponse> {
    try {
      const params = new URLSearchParams()
      if (reasignarA) {
        params.set('reasignarA', reasignarA)
      }

      const queryString = params.toString()
      const response = await fetch(`${API_BASE_URL}/roles/${rolId}${queryString ? `?${queryString}` : ''}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData?.message ||
          errorData?.error?.message ||
          `Error ${response.status}: ${response.statusText}`
        )
      }

      const data: EliminarRolResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'La respuesta de la API no fue exitosa')
      }

      console.log('✅ Rol eliminado')
      return data
    } catch (error) {
      console.error('Error eliminando rol:', error)
      throw error
    }
  }
}
