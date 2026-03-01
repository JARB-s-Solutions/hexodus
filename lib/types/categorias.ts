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
}

/**
 * Response de GET /api/categorias
 */
export interface GetCategoriasResponse {
  message: string
  data: CategoriaAPI[]
}

// ============================================================================
// FRONTEND TYPES
// ============================================================================

/**
 * Categoría para uso en componentes
 */
export interface Categoria {
  id: number
  nombre: string
}

/**
 * Mapea una categoría del API al formato frontend
 */
export function mapCategoriaFromAPI(categoria: CategoriaAPI): Categoria {
  return {
    id: categoria.id,
    nombre: categoria.nombre
  }
}
