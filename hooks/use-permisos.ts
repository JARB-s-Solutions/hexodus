// ================================================
// HOOK DE PERMISOS
// Expone helpers para verificar permisos del usuario
// conectado de forma reactiva, leyendo el AuthContext.
// ================================================

"use client"

import { useAuthContext } from '@/lib/contexts/auth-context'

/**
 * Hook que devuelve utilidades para verificar permisos del usuario actual.
 *
 * @example
 * const { tienePermiso, esAdmin } = usePermisos()
 * if (tienePermiso('socios', 'crear')) { ... }
 */
export function usePermisos() {
  const { tienePermiso, esAdmin, user } = useAuthContext()

  /**
   * Devuelve true si el usuario puede VER el módulo indicado.
   * Útil para filtrar ítems del sidebar.
   */
  const puedeVerModulo = (modulo: string): boolean => {
    return tienePermiso(modulo, 'ver')
  }

  return {
    /** Verifica si el usuario tiene un permiso específico */
    tienePermiso,
    /** Alias rápido para comprobar acceso de "ver" a un módulo */
    puedeVerModulo,
    /** true si el usuario es administrador con acceso total */
    esAdmin,
    /** Usuario conectado */
    user,
  }
}
