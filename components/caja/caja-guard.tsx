"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CajaProvider, useCaja } from "@/lib/contexts/caja-context"
import { ModalAperturaCaja } from "@/components/caja/modal-apertura-caja"
import { IndicadorCaja } from "@/components/caja/indicador-caja"
import { AuthService } from "@/lib/auth"
import { AlertTriangle, LogOut } from "lucide-react"

// Rutas públicas que no requieren autenticación ni caja abierta.
// Incluye el flujo manual de recuperación por token.
const RUTAS_SIN_CAJA = ["/login", "/register", "/recuperar-password", "/reset-password"]

function CajaGuardInner({ children }: { children: React.ReactNode }) {
  const { estadoCaja, loading } = useCaja()
  const pathname = usePathname()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const openModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenModalTimeout = () => {
    if (openModalTimeoutRef.current) {
      clearTimeout(openModalTimeoutRef.current)
      openModalTimeoutRef.current = null
    }
  }

  useEffect(() => {
    if (!pathname) {
      return
    }

    // 1. PRIMERO: Verificar autenticación
    if (typeof window !== "undefined") {
      const isAuthenticated = AuthService.isAuthenticated()
      
      console.log("🔒 CajaGuard - Estado:", {
        isAuthenticated,
        loading,
        pathname,
        estadoCaja: estadoCaja ? {
          abierta: estadoCaja.abierta,
          corte_id: estadoCaja.corte_id
        } : null
      })
      
      // Si no está autenticado y no está en rutas públicas, redirigir a login
      if (!isAuthenticated && !RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))) {
        console.log("🚫 Usuario no autenticado, redirigiendo a login...")
        clearOpenModalTimeout()
        router.push("/login")
        return
      }

      // Si está en ruta pública pero está autenticado, no mostrar modal
      if (RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))) {
        console.log("✅ Ruta pública detectada, no mostrar modal")
        clearOpenModalTimeout()
        setShowModal(false)
        return
      }

      const requiereGestionCaja =
        AuthService.hasPermission("ventas", "crearCorte") ||
        AuthService.hasPermission("ventas", "verCortesAnteriores")

      // 2. SEGUNDO: Si está autenticado y no está en ruta pública, verificar caja
      const requiereCaja = !RUTAS_SIN_CAJA.some((ruta) => pathname?.startsWith(ruta))

      // ⚠️ IMPORTANTE: Solo verificar caja si:
      //    - NO está cargando (loading = false)
      //    - estadoCaja existe (no es null - ya se consultó el backend)
      //    - requiere caja (no es ruta pública)
      //    - está autenticado
      if (!loading && estadoCaja !== null && requiereCaja && isAuthenticated) {
        if (!estadoCaja.abierta) {
          if (!requiereGestionCaja) {
            console.log("⛔ Caja cerrada y usuario sin permisos de gestión. Mostrando bloqueo.")
            clearOpenModalTimeout()
            setShowModal(false)
            setShowBlockedModal(true)
            return
          }

          setShowBlockedModal(false)
          if (!openModalTimeoutRef.current) {
            console.log("⚠️ CAJA CERRADA DETECTADA - Validando antes de mostrar modal")
            openModalTimeoutRef.current = setTimeout(() => {
              openModalTimeoutRef.current = null
              setShowModal(true)
            }, 1200)
          }
        } else {
          console.log("✅ CAJA ABIERTA - Acceso permitido")
          clearOpenModalTimeout()
          setShowModal(false)
          setShowBlockedModal(false)
        }
      }
      // Si loading es true o estadoCaja es null, no hacer nada (esperar)
    }

    return () => {
      clearOpenModalTimeout()
    }
  }, [estadoCaja, loading, pathname, router])

  const handleAperturaExitosa = () => {
    setShowModal(false)
  }

  const handleLogout = async () => {
    await AuthService.logout()
    router.push("/login")
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
      {showBlockedModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-destructive/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Caja Cerrada</h3>
                  <p className="text-sm text-muted-foreground">No puedes operar mientras la caja esté cerrada.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-foreground">
                El sistema bloqueó ventas, cobros y movimientos porque la caja no está aperturada para hoy.
              </p>
              <p className="text-sm text-muted-foreground">
                Solicita a un administrador abrir caja para continuar.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
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
