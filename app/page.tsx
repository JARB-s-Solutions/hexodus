"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"

/**
 * Página raíz - Redirige según estado de autenticación
 * - Si está autenticado → /dashboard
 * - Si NO está autenticado → /login
 */
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación solo en el cliente
    if (typeof window !== "undefined") {
      const isAuthenticated = AuthService.isAuthenticated()
      
      if (isAuthenticated) {
        console.log("✅ Usuario autenticado, redirigiendo a dashboard...")
        router.push("/dashboard")
      } else {
        console.log("🔒 Usuario no autenticado, redirigiendo a login...")
        router.push("/login")
      }
    }
  }, [router])

  // Mostrar loading mientras redirige
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
}
