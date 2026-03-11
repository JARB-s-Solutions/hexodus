"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermisos } from "@/hooks/use-permisos"
import { useAuthContext } from "@/lib/contexts/auth-context"

interface RoleGuardProps {
  /** Módulo que se protege */
  modulo: string
  /** Acción mínima requerida para acceder (default: 'ver') */
  accion?: string
  /** Ruta de redirección si no tiene permiso (default: '/dashboard') */
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Guard de rutas basado en permisos.
 * Redirige al usuario si no tiene el permiso requerido para ver la ruta.
 *
 * Uso en un layout de ruta:
 * @example
 * export default function ReportesLayout({ children }) {
 *   return (
 *     <RoleGuard modulo="reportes" accion="ver">
 *       {children}
 *     </RoleGuard>
 *   )
 * }
 */
export function RoleGuard({
  modulo,
  accion = "ver",
  redirectTo = "/dashboard",
  children,
}: RoleGuardProps) {
  const { tienePermiso } = usePermisos()
  const { isLoading, isAuthenticated } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    // Esperar a que cargue el estado de auth antes de evaluar
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!tienePermiso(modulo, accion)) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, tienePermiso, modulo, accion, redirectTo, router])

  // Mientras carga o si no tiene permiso, no renderizar nada
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !tienePermiso(modulo, accion)) {
    return null
  }

  return <>{children}</>
}
