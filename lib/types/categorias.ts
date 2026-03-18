/**
 * Tipos para el módulo de Categorías
 */

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Categoría tal como viene del API
 */
export interface CategoriaAPI {
  id: number
  nombre: string
  prefijo?: string | null // Prefijo para códigos de productos (ej: "PROT", "CREAT")
  color?: string // Color identificador (hex)
  descripcion?: string | null
  estado?: "activa" | "inactiva"
  created_at?: string
  updated_at?: string
  total_productos?: number // Total de productos asociados a esta categoría
}

/**
 * Response de GET /api/categorias
 */
export interface GetCategoriasResponse {
  message: string
  data: CategoriaAPI[]
}

/**
 * Response de GET /api/categorias/:id
 */
export interface GetCategoriaResponse {
  message: string
  data: CategoriaAPI
}

/**
 * Request para crear categoría (Backend ahora acepta todos los campos)
 */
export interface CreateCategoriaRequest {
  nombre: string
  prefijo?: string
  color?: string
  descripcion?: string
  estado?: "activa" | "inactiva"
}

/**
 * Request extendido (DEPRECADO - usar CreateCategoriaRequest)
 * @deprecated Usar CreateCategoriaRequest directamente
 */
export interface CreateCategoriaRequestExtended {
  nombre: string
  prefijo: string
  color?: string
  descripcion?: string
  estado?: "activa" | "inactiva"
}

/**
 * Request para actualizar categoría (Backend ahora acepta todos los campos)
 */
export interface UpdateCategoriaRequest {
  nombre?: string
  prefijo?: string
  color?: string
  descripcion?: string
  estado?: "activa" | "inactiva"
}

/**
 * Response al crear/actualizar categoría
 */
export interface CategoriaResponse {
  message: string
  data: CategoriaAPI
}

/**
 * Response al eliminar categoría
 */
export interface DeleteCategoriaResponse {
  message: string
}

/**
 * Stats de una categoría (productos asociados)
 */
export interface CategoriaStats {
  total_productos: number
  productos_activos: number
  productos_bajo_stock: number
  valor_total_inventario: number
}

/**
 * Response de GET /api/categorias/:id/stats
 */
export interface GetCategoriaStatsResponse {
  message: string
  data: CategoriaStats
}

// ============================================================================
// FRONTEND TYPES
// ============================================================================

/**
 * Categoría extendida para uso en componentes
 */
export interface Categoria {
  id: number
  nombre: string
  prefijo: string
  color: string
  descripcion?: string
  estado: "activa" | "inactiva"
  createdAt?: string
  updatedAt?: string
  // Campos calculados (opcionales)
  totalProductos?: number
  productosActivos?: number
}

/**
 * Datos para crear/editar categoría (formulario)
 */
export interface CategoriaFormData {
  nombre: string
  prefijo: string
  color?: string
  descripcion?: string
  estado?: "activa" | "inactiva"
}

// ============================================================================
// UTILIDADES Y CONSTANTES
// ============================================================================

/**
 * Colores predefinidos para categorías
 */
export const COLORES_CATEGORIA = [
  { nombre: "Morado", valor: "#A855F7", bg: "bg-purple-500/15", text: "text-purple-300" },
  { nombre: "Azul", valor: "#3B82F6", bg: "bg-blue-500/15", text: "text-blue-300" },
  { nombre: "Verde", valor: "#22C55E", bg: "bg-green-500/15", text: "text-green-300" },
  { nombre: "Amarillo", valor: "#FBB424", bg: "bg-yellow-500/15", text: "text-yellow-300" },
  { nombre: "Rojo", valor: "#EF4444", bg: "bg-red-500/15", text: "text-red-300" },
  { nombre: "Rosa", valor: "#EC4899", bg: "bg-pink-500/15", text: "text-pink-300" },
  { nombre: "Naranja", valor: "#F97316", bg: "bg-orange-500/15", text: "text-orange-300" },
  { nombre: "Cyan", valor: "#06B6D4", bg: "bg-cyan-500/15", text: "text-cyan-300" },
  { nombre: "Gris", valor: "#6B7280", bg: "bg-gray-500/15", text: "text-gray-300" },
] as const

/**
 * Genera un prefijo automático basado en el nombre
 */
export function generarPrefijoAutomatico(nombre: string): string {
  // Eliminar acentos y caracteres especiales
  const sinAcentos = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
  
  // Prefijos específicos conocidos
  const prefijosConocidos: Record<string, string> = {
    'PROTEINAS': 'PROT',
    'CREATINAS': 'CREAT',
    'PRE-ENTRENO': 'PRE',
    'PRE ENTRENO': 'PRE',
    'VITAMINAS': 'VIT',
    'AMINOACIDOS': 'AMINO',
    'BCAA': 'BCAA',
    'BARRAS': 'BAR',
    'SNACKS': 'SNK',
    'BEBIDAS': 'BEB',
    'ACCESORIOS': 'ACC',
    'EQUIPAMIENTO': 'EQUIP',
    'ROPA': 'ROPA',
    'SUPLEMENTOS': 'SUP',
    'OTROS': 'OTR',
  }
  
  // Buscar prefijo conocido
  for (const [key, prefijo] of Object.entries(prefijosConocidos)) {
    if (sinAcentos.includes(key)) {
      return prefijo
    }
  }
  
  // Si no hay match, tomar primeras 3-4 letras
  const palabras = sinAcentos.split(/\s+/)
  if (palabras.length > 1) {
    // Si tiene varias palabras, tomar iniciales
    return palabras.slice(0, 3).map(p => p[0]).join('')
  } else {
    // Una sola palabra, tomar primeras 3-4 letras
    return sinAcentos.slice(0, Math.min(4, sinAcentos.length))
  }
}

/**
 * Valida formato de prefijo
 */
export function validarPrefijo(prefijo: string): { valido: boolean; error?: string } {
  if (!prefijo || prefijo.length === 0) {
    return { valido: false, error: "El prefijo es obligatorio" }
  }
  
  if (prefijo.length < 2 || prefijo.length > 6) {
    return { valido: false, error: "El prefijo debe tener entre 2 y 6 caracteres" }
  }
  
  if (!/^[A-Z0-9]+$/.test(prefijo)) {
    return { valido: false, error: "El prefijo solo puede contener letras mayúsculas y números" }
  }
  
  return { valido: true }
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Mapea una categoría del API al formato frontend
 */
export function mapCategoriaFromAPI(categoria: CategoriaAPI): Categoria {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    prefijo: categoria.prefijo || 'GEN',
    color: categoria.color || '#6B7280',
    descripcion: categoria.descripcion || undefined,
    estado: categoria.estado || 'activa',
    createdAt: categoria.created_at,
    updatedAt: categoria.updated_at,
    totalProductos: categoria.total_productos || 0,
  }
}

/**
 * Mapea datos de formulario a request de API (todos los campos)
 */
export function mapCategoriaToAPI(data: CategoriaFormData): CreateCategoriaRequest {
  return {
    nombre: data.nombre.trim(),
    prefijo: data.prefijo.trim().toUpperCase(),
    color: data.color || '#6B7280',
    descripcion: data.descripcion?.trim() || undefined,
    estado: data.estado || 'activa',
  }
}

/**
 * Mapea datos de formulario a request extendido (con todos los campos)
 */
export function mapCategoriaToAPIExtended(data: CategoriaFormData): CreateCategoriaRequestExtended {
  return {
    nombre: data.nombre.trim(),
    prefijo: data.prefijo.trim().toUpperCase(),
    color: data.color || '#6B7280',
    descripcion: data.descripcion?.trim(),
    estado: data.estado || 'activa',
  }
}
