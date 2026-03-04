"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CajaProvider, useCaja } from "@/lib/contexts/caja-context"
import { ModalAperturaCaja } from "@/components/caja/modal-apertura-caja"
import { IndicadorCaja } from "@/components/caja/indicador-caja"
import { AuthService } from "@/lib/auth"

// Rutas que no requieren caja abierta
const RUTAS_SIN_CAJA = ["/login", "/register"]

function CajaGuardInner({ children }: { children: React.ReactNode }) {
  const { estadoCaja, loading } = useCaja()
  const pathname = usePathname()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // 1. PRIMERO: Verificar autenticación
    if (typeof window !== "undefined") {
      const isAuthenticated = AuthService.isAuthenticated()
      
      // Si no está autenticado y no está en rutas públicas, redirigir a login
      if (!isAuthenticated && !RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))) {
        console.log("🚫 Usuario no autenticado, redirigiendo a login...")
        router.push("/login")
        return
      }

      // Si está en ruta pública pero está autenticado, no mostrar modal
      if (RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))) {
        setShowModal(false)
        return
      }

      // 2. SEGUNDO: Si está autenticado y no está en ruta pública, verificar caja
      const requiereCaja = !RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))

      if (!loading && requiereCaja && estadoCaja && !estadoCaja.abierta && isAuthenticated) {
        setShowModal(true)
      } else {
        setShowModal(false)
      }
    }
  }, [estadoCaja, loading, pathname, router])

  const handleAperturaExitosa = () => {
    setShowModal(false)
  }

  // Mostrar loading mientras se verifica el estado
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      <ModalAperturaCaja open={showModal} onSuccess={handleAperturaExitosa} />
    </>
  )
}

export function CajaGuard({ children }: { children: React.ReactNode }) {
  return (
    <CajaProvider>
      <CajaGuardInner>{children}</CajaGuardInner>
    </CajaProvider>
  )
}

// Componente para agregar en los headers de las páginas
export { IndicadorCaja }
