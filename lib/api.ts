// ================================================
// CONFIGURACIÓN DE API
// ================================================

// URL base de la API - Configurar según el entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Timeout por defecto para las peticiones
const DEFAULT_TIMEOUT = 10000

/**
 * Clase de error personalizada para manejar errores de API
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Opciones para las peticiones fetch
 */
interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * Wrapper de fetch con timeout y manejo de errores
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, 'La petición ha excedido el tiempo de espera')
    }
    throw error
  }
}

/**
 * Realizar petición GET a la API
 */
export async function apiGet<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  return response.json()
}

/**
 * Realizar petición POST a la API
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  return response.json()
}

/**
 * Realizar petición PUT a la API
 */
export async function apiPut<T>(
  endpoint: string,
  data: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  return response.json()
}

/**
 * Realizar petición PATCH a la API
 */
export async function apiPatch<T>(
  endpoint: string,
  data: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  return response.json()
}

/**
 * Realizar petición DELETE a la API
 */
export async function apiDelete<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  return response.json()
}

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // User endpoints
  USERS: '/users',
  
  // Other endpoints...
} as const
