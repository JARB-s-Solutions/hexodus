/**
 * Servicio para gestionar metodos de pago.
 * Usa el wrapper de API para respetar base URL por entorno + Bearer token.
 */

import { apiGet, apiPost } from "@/lib/api"

export interface MetodoPago {
  id: string
  nombre: string
  metodo_pago_id?: number
  activo?: boolean
  createdAt?: string
}

function normalizarMetodoPago(raw: any): MetodoPago | null {
  if (!raw || typeof raw !== "object") return null

  const idRaw = raw.metodo_pago_id ?? raw.id
  const nombre = raw.nombre ?? raw.name

  if (!nombre) {
    return null
  }

  const id = idRaw !== undefined && idRaw !== null ? String(idRaw) : String(nombre)

  return {
    id,
    metodo_pago_id: Number.isFinite(Number(idRaw)) ? Number(idRaw) : undefined,
    nombre: String(nombre),
    activo: raw.activo !== undefined ? Boolean(raw.activo) : true,
    createdAt: raw.createdAt ?? raw.created_at,
  }
}

function extraerArrayMetodos(response: any): any[] {
  if (Array.isArray(response)) return response
  if (response && Array.isArray(response.data)) return response.data
  if (response && Array.isArray(response.metodos_pago)) return response.metodos_pago
  return []
}

/**
 * Obtiene todos los métodos de pago
 */
export async function getMetodosPago(): Promise<MetodoPago[]> {
  try {
    const response = await apiGet<any>("/metodos-pago")
    const items = extraerArrayMetodos(response)

    return items
      .map(normalizarMetodoPago)
      .filter((item): item is MetodoPago => item !== null)
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
  if (!nombre || nombre.trim().length === 0) {
    throw new Error("El nombre del método de pago es requerido")
  }

  try {
    const response = await apiPost<any>("/metodos-pago", { nombre: nombre.trim() })
    const raw = response?.data ?? response
    const normalizado = normalizarMetodoPago(raw)

    // Algunos backends devuelven solo { message: "..." } al crear.
    if (normalizado) {
      return normalizado
    }

    return {
      id: nombre.trim().toLowerCase(),
      nombre: nombre.trim(),
      activo: true,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error desconocido al crear método de pago")
  }
}
