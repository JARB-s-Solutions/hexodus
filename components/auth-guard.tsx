// ================================================
// COMPONENTE DE PROTECCIÓN DE RUTAS
// Verifica autenticación y redirige si es necesario
// ================================================

"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

/**
 * Componente que protege rutas requiriendo autenticación
 */
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = AuthService.isAuthenticated()

      if (requireAuth && !isAuthenticated) {
        // Usuario no autenticado intentando acceder a ruta protegida
        router.push('/login')
        return
      }

      if (!requireAuth && isAuthenticated) {
        // Usuario autenticado intentando acceder a login/register
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
      setIsChecking(false)
    }

    checkAuth()
  }, [pathname, requireAuth, router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

/**
 * Hook para usar en componentes que necesitan redirección
 */
export function useRequireAuth() {
  const router = useRouter()

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return AuthService.isAuthenticated()
}
