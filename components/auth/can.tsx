"use client"

import type { ReactNode } from "react"
import { usePermisos } from "@/hooks/use-permisos"

interface CanProps {
  /** Módulo al que aplica el permiso (ej: 'socios', 'ventas') */
  modulo: string
  /** Acción requerida (ej: 'ver', 'crear', 'eliminar') */
  accion: string
  /** Contenido a renderizar si tiene permiso */
  children: ReactNode
  /** Contenido alternativo si NO tiene permiso (por defecto: nada) */
  fallback?: ReactNode
}

/**
 * Componente envoltorio de permisos.
 * Renderiza `children` solo si el usuario tiene el permiso indicado.
 *
 * @example
 * <Can modulo="socios" accion="crear">
 *   <Button>Nuevo Socio</Button>
 * </Can>
 *
 * @example Con fallback
 * <Can modulo="socios" accion="eliminar" fallback={<span>Sin acceso</span>}>
 *   <Button variant="destructive">Eliminar</Button>
 * </Can>
 */
export function Can({ modulo, accion, children, fallback = null }: CanProps) {
  const { tienePermiso } = usePermisos()

  if (tienePermiso(modulo, accion)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
