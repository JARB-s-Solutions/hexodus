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
 * Acepta tanto snake_case (GET) como camelCase (POST/PUT)
 */
export function mapMembresiaFromAPI(api: any): Membresia {
  console.log('Mapeando membresía desde API:', api)
  
  // Convertir duración de días a unidad apropiada
  const duracionDias = api.duracion_dias || api.duracionDias || 0
  let duracionCantidad = duracionDias
  let duracionUnidad = 'dia'
  
  // Si viene etiqueta_tipo del backend, usarla para determinar la unidad
  if (api.etiqueta_tipo) {
    const tipo = api.etiqueta_tipo.toLowerCase()
    if (tipo === 'diaria' || tipo === 'dia') {
      duracionUnidad = 'dia'
      duracionCantidad = duracionDias
    } else if (tipo === 'semanal' || tipo === 'semana') {
      duracionUnidad = 'semana'
      duracionCantidad = Math.round(duracionDias / 7)
    } else if (tipo === 'mensual' || tipo === 'mes') {
      duracionUnidad = 'mes'
      duracionCantidad = Math.round(duracionDias / 30)
    } else if (tipo === 'anual' || tipo === 'año') {
      duracionUnidad = 'año'
      duracionCantidad = Math.round(duracionDias / 365)
    }
  } else {
    // Fallback: intentar deducir de duracion_dias
    if (duracionDias === 1) {
      duracionUnidad = 'dia'
      duracionCantidad = 1
    } else if (duracionDias === 7) {
      duracionUnidad = 'semana'
      duracionCantidad = 1
    } else if (duracionDias === 30 || duracionDias === 31) {
      duracionUnidad = 'mes'
      duracionCantidad = 1
    } else if (duracionDias === 365 || duracionDias === 366) {
      duracionUnidad = 'año'
      duracionCantidad = 1
    } else if (duracionDias % 30 === 0) {
      duracionUnidad = 'mes'
      duracionCantidad = duracionDias / 30
    } else if (duracionDias % 7 === 0) {
      duracionUnidad = 'semana'
      duracionCantidad = duracionDias / 7
    } else {
      duracionUnidad = 'dia'
      duracionCantidad = duracionDias
    }
  }
  
  // Detectar si es oferta válida
  const esOferta = api.es_oferta_valida || api.es_oferta || api.esOferta || false
  
  // Detectar formato y mapear apropiadamente
  const mapped = {
    id: api.plan_id || api.id,
    nombre: api.nombre,
    descripcion: api.descripcion || '',
    precioBase: parseFloat(api.precio_base || api.precioBase || 0),
    duracionCantidad,
    duracionUnidad,
    esOferta,
    precioOferta: api.precio_oferta ? parseFloat(api.precio_oferta) : (api.precioOferta ? parseFloat(api.precioOferta) : undefined),
    fechaFinOferta: api.fecha_fin_oferta || api.fechaFinOferta,
    estado: api.status || 'activo',
    createdAt: api.created_at || api.createdAt,
    updatedAt: api.updated_at || api.updatedAt,
  }
  console.log('Membresía mapeada:', mapped)
  return mapped
}

/**
 * Datos para crear una nueva membresía (camelCase como espera el backend)
 */
export interface CreateMembresia {
  nombre: string
  descripcion?: string
  precioBase: number
  duracionCantidad: number
  duracionUnidad: string
  esOferta?: boolean
  precioOferta?: number
  fechaFinOferta?: string
}

/**
 * Datos para actualizar una membresía existente (camelCase como espera el backend)
 * Campos obligatorios deben estar presentes
 */
export interface UpdateMembresia {
  nombre: string
  descripcion?: string
  precioBase: number
  duracionCantidad: number
  duracionUnidad: string
  esOferta?: boolean
  precioOferta?: number
  fechaFinOferta?: string
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
  membresia?: MembresiaAPI // Formato snake_case (antiguo)
  data?: any // Formato camelCase (nuevo) - puede ser cualquiera
  message?: string
}

/**
 * Respuesta al actualizar el estado
 */
export interface UpdateStatusResponse {
  message: string
  membresia?: MembresiaAPI // Formato snake_case (antiguo)
  data?: any // Formato camelCase (nuevo)
}
