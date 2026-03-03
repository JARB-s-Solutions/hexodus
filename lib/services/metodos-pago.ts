/**
 * Servicio para gestionar métodos de pago
 * Consume API externa: https://hexodusapi.vercel.app/api/metodos-pago
 */

const API_BASE_URL = "https://hexodusapi.vercel.app"

export interface MetodoPago {
  id: string
  nombre: string
  activo?: boolean
  createdAt?: string
}

/**
 * Obtiene el token Bearer almacenado
 * Usa la misma key que el sistema de autenticación (auth_token)
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

/**
 * Obtiene todos los métodos de pago
 */
export async function getMetodosPago(): Promise<MetodoPago[]> {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error("Token de autenticación no encontrado")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/metodos-pago`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("No autorizado. Por favor, inicia sesión nuevamente")
      }
      if (response.status === 403) {
        throw new Error("No tienes permisos para ver los métodos de pago")
      }
      throw new Error(`Error al obtener métodos de pago: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Manejar diferentes formatos de respuesta
    // Caso 1: Array directo [...]
    if (Array.isArray(data)) {
      return data as MetodoPago[]
    }
    
    // Caso 2: Objeto con array en data: { data: [...] }
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data as MetodoPago[]
    }
    
    // Caso 3: Objeto con array en metodos_pago: { metodos_pago: [...] }
    if (data && typeof data === "object" && Array.isArray(data.metodos_pago)) {
      return data.metodos_pago as MetodoPago[]
    }
    
    // Si no es ninguno de los casos anteriores, devolver array vacío
    console.warn("Formato de respuesta inesperado:", data)
    return []
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error desconocido al obtener métodos de pago")
  }
}

/**
 * Crea un nuevo método de pago
 */
export async function createMetodoPago(nombre: string): Promise<MetodoPago> {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error("Token de autenticación no encontrado")
  }

  if (!nombre || nombre.trim().length === 0) {
    throw new Error("El nombre del método de pago es requerido")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/metodos-pago`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre: nombre.trim() }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("No autorizado. Por favor, inicia sesión nuevamente")
      }
      if (response.status === 403) {
        throw new Error("No tienes permisos para crear métodos de pago")
      }
      if (response.status === 400) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Datos inválidos")
      }
      throw new Error(`Error al crear método de pago: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Si la respuesta tiene la estructura { data: {...} }
    if (data && typeof data === "object" && data.data) {
      return data.data as MetodoPago
    }
    
    // De lo contrario, asumir que data es el método directamente
    return data as MetodoPago
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error desconocido al crear método de pago")
  }
}
