// ================================================
// CONFIGURACIÓN DE API
// ================================================

// URL base de la API - Configurar según el entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hexodusapi.vercel.app/api'

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
  const url = `${API_BASE_URL}${endpoint}`
  
  console.log('🌐 GET Request:')
  console.log('  URL:', url)
  console.log('  Token:', token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN')
  
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

  console.log('  Status:', response.status, response.statusText)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('❌ GET Error:', error)
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  const data = await response.json()
  console.log('  Response data:', data)
  return data
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
  const url = `${API_BASE_URL}${endpoint}`
  
  console.log('📤 POST Request:')
  console.log('  URL:', url)
  console.log('  Token:', token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN')
  console.log('  Body:', JSON.stringify(data, null, 2))
  
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  })

  console.log('  Status:', response.status, response.statusText)
  console.log('  Response.ok:', response.ok)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('❌ POST Error Response Body:', error)
    
    const errorMessage = error.error || error.message || 'Error en la petición'
    console.error('❌ Construyendo ApiError:')
    console.error('  - status:', response.status)
    console.error('  - message:', errorMessage)
    console.error('  - errors:', error.errors)
    
    const apiError = new ApiError(
      response.status,
      errorMessage,
      error.errors
    )
    
    console.error('❌ Lanzando ApiError:', apiError)
    throw apiError
  }

  const responseData = await response.json()
  console.log('  Response data:', responseData)
  return responseData
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
  const url = `${API_BASE_URL}${endpoint}`
  
  console.log('✏️  PUT Request:')
  console.log('  URL:', url)
  console.log('  Token:', token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN')
  console.log('  Body:', JSON.stringify(data, null, 2))
  
  const response = await fetchWithTimeout(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })

  console.log('  Status:', response.status, response.statusText)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('❌ PUT Error:', error)
    throw new ApiError(
      response.status,
      error.error || error.message || 'Error en la petición',
      error.errors
    )
  }

  const responseData = await response.json()
  console.log('  Response data:', responseData)
  return responseData
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
