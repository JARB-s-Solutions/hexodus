// ================================================
// TIPOS DE DATOS PARA MEMBRESÍAS
// ================================================

/**
 * Estado de una membresía
 */
export type EstadoMembresia = 'activo' | 'inactivo'

/**
 * Estructura de una membresía desde la API (con snake_case como viene del backend)
 */
export interface MembresiaAPI {
  plan_id: number
  uuid_plan?: string
  nombre: string
  descripcion?: string
  precio_base?: number
  duracion_dias: number
  es_oferta?: boolean
  precio_oferta?: number
  fecha_fin_oferta?: string
  status: EstadoMembresia
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
  created_by?: number
}

/**
 * Estructura de una membresía para usar en el frontend (camelCase)
 */
export interface Membresia {
  id: number
  nombre: string
  descripcion: string
  precioBase: number
  duracionCantidad: number
  duracionUnidad: string
  esOferta: boolean
  precioOferta?: number
  fechaFinOferta?: string
  estado: EstadoMembresia
  createdAt?: string
  updatedAt?: string
}

/**
 * Función helper para convertir de API a Frontend
 */
export function mapMembresiaFromAPI(api: MembresiaAPI): Membresia {
  console.log('Mapeando membresía desde API:', api)
  const mapped = {
    id: api.plan_id,
    nombre: api.nombre,
    descripcion: api.descripcion || '',
    precioBase: api.precio_base || 0,
    duracionCantidad: api.duracion_dias,
    duracionUnidad: 'dias',
    esOferta: api.es_oferta || false,
    precioOferta: api.precio_oferta,
    fechaFinOferta: api.fecha_fin_oferta,
    estado: api.status,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
  console.log('Membresía mapeada:', mapped)
  return mapped
}

/**
 * Datos para crear una nueva membresía
 */
export interface CreateMembresia {
  nombre: string
  descripcion?: string
  precio_base: number
  duracion_dias: number
  es_oferta?: boolean
  precio_oferta?: number
  fecha_fin_oferta?: string
}

/**
 * Datos para actualizar una membresía existente
 * Campos obligatorios deben estar presentes
 */
export interface UpdateMembresia {
  nombre: string
  descripcion?: string
  precio_base: number
  duracion_dias: number
  es_oferta?: boolean
  precio_oferta?: number
  fecha_fin_oferta?: string
}

/**
 * Parámetros de búsqueda para membresías
 */
export interface SearchMembresiaParams {
  min_precio?: number
  max_precio?: number
  estado?: EstadoMembresia
  search?: string
  tipo_dias?: number
}

/**
 * Respuesta al obtener lista de membresías
 */
export interface GetMembresiasResponse {
  membresias?: MembresiaAPI[]
  data?: MembresiaAPI[]
}

/**
 * Respuesta al crear o actualizar una membresía
 */
export interface MembresiaResponse {
  membresia: MembresiaAPI
  message?: string
}

/**
 * Respuesta al actualizar el estado
 */
export interface UpdateStatusResponse {
  message: string
  membresia?: MembresiaAPI
}
