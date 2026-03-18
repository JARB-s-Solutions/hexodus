"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { CajaService } from "@/lib/services/caja"
import { AuthService } from "@/lib/auth"
import type { EstadoCaja } from "@/lib/types/caja"

interface CajaContextType {
  estadoCaja: EstadoCaja | null
  loading: boolean
  abrirCaja: (montoInicial: number) => Promise<void>
  cerrarCaja: (observacion?: string) => Promise<{ total_ingresos: string }>
  refrescarEstado: () => Promise<void>
}

const CajaContext = createContext<CajaContextType | undefined>(undefined)

export function CajaProvider({ children }: { children: React.ReactNode }) {
  const [estadoCaja, setEstadoCaja] = useState<EstadoCaja | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para refrescar el estado de la caja
  const refrescarEstado = useCallback(async () => {
    try {
      // ⚠️ CRÍTICO: Solo consultar si el usuario está autenticado
      if (!AuthService.isAuthenticated()) {
        console.log("⏸️ Usuario NO autenticado, saltando consulta de caja")
        setLoading(false)
        return
      }

      const puedeGestionarCaja =
        AuthService.hasPermission("ventas", "crearCorte") ||
        AuthService.hasPermission("ventas", "verCortesAnteriores")

      if (!puedeGestionarCaja) {
        console.log("⏸️ Usuario sin permisos de caja, omitiendo consulta de estado")
        const user = AuthService.getUser()
        setEstadoCaja({
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        })
        setLoading(false)
        return
      }
      
      console.log("🔄 Refrescando estado de caja...")
      console.log("   ✅ Usuario autenticado, consultando backend...")
      
      const response = await CajaService.consultarCaja()
      const user = AuthService.getUser()

      console.log("📊 Resumen de caja:", response.resumen)
      console.log("📝 Total de movimientos encontrados:", response.movimientos.length)
      
      // Mostrar TODOS los movimientos para debugging
      console.log("🔍 === ANÁLISIS DE MOVIMIENTOS (buscando apertura) ===")
      response.movimientos.forEach((mov, idx) => {
        const conceptoLower = mov.concepto.toLowerCase().trim()
        const tieneApertura = conceptoLower.includes("apertura")
        const tieneFondo = conceptoLower.includes("fondo")
        const esIngreso = mov.tipo === "ingreso"
        
        console.log(`  [${idx + 1}] "${mov.concepto}"`)
        console.log(`      tipo: "${mov.tipo}" | incluyeApertura: ${tieneApertura} | incluyeFondo: ${tieneFondo} | esIngreso: ${esIngreso}`)
      })

      // Buscar movimiento de apertura
      console.log("🔍 Buscando movimiento de apertura...")
      const movApertura = response.movimientos.find((mov) => {
        const conceptoLower = mov.concepto.toLowerCase().trim()
        const tieneApertura = conceptoLower.includes("apertura")
        const esIngreso = mov.tipo === "ingreso"
        return tieneApertura && esIngreso
      })

      console.log("🔍 Resultado de búsqueda:", movApertura ? "✅ ENCONTRADO" : "❌ NO ENCONTRADO")
      if (movApertura) {
        console.log("   📍 Movimiento de apertura:", {
          id: movApertura.id,
          concepto: movApertura.concepto,
          tipo: movApertura.tipo,
          monto: movApertura.monto,
          fecha: movApertura.fecha
        })
      }

      if (movApertura) {
        // Caja abierta
        const nuevoEstado = {
          abierta: true,
          corte_id: movApertura.id,
          monto_inicial: response.resumen.efectivo_inicial,
          monto_actual: response.resumen.efectivo_final,
          fecha_apertura: movApertura.fecha,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        }
        
        console.log("✅ ✅ ✅ CAJA ABIERTA - Estableciendo estado:")
        console.log("   📌 Estado que se va a establecer:", JSON.stringify(nuevoEstado, null, 2))
        
        setEstadoCaja(nuevoEstado)
        console.log("   ✅ Estado establecido correctamente")
      } else {
        // Caja cerrada (sin movimiento de apertura)
        const nuevoEstado = {
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        }
        
        console.log("❌ ❌ ❌ CAJA CERRADA - No se encontró movimiento de apertura")
        console.log("   📌 Estado que se va a establecer:", JSON.stringify(nuevoEstado, null, 2))
        
        setEstadoCaja(nuevoEstado)
        console.log("   ⚠️ Estado de caja cerrada establecido")
      }
    } catch (error: any) {
      console.error("❌ ❌ ❌ Error al refrescar estado de caja:", error)
      console.error("   Tipo de error:", typeof error)
      console.error("   Error completo:", JSON.stringify(error, null, 2))
      
      const user = AuthService.getUser()

      // Si el error es 403 (sin permiso), no forzar estado abierto.
      if (error?.status === 403) {
        console.warn("   ⚠️ Sin permiso para consultar caja (403). Omitiendo estado de caja.")
        setEstadoCaja({
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        })
        return
      }

        // Para errores transitorios (timeout/red), conservar el último estado
        // evita mostrar el modal de apertura por un falso negativo temporal.
        const estadoError = {
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        }

        console.warn("   ⚠️ Error transitorio al consultar caja; conservando estado previo si existe")
        setEstadoCaja((prev) => prev ?? estadoError)
    } finally {
      console.log("🏁 refrescarEstado() finalizado, estableciendo loading = false")
      setLoading(false)
    }
  }, [])

  // Cargar estado inicial al montar
  useEffect(() => {
    refrescarEstado()
  }, [refrescarEstado])

  // Listener para detectar login/logout en tiempo real (mismo navegador)
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🎧 Registrando listeners para eventos de autenticación (auth:login, auth:logout)")
      
      const handleLogin = () => {
        console.log("✅ ✅ ✅ Evento auth:login capturado! Refrescando estado de caja...")
        refrescarEstado()
      }
      
      const handleLogout = () => {
        console.log("🚪 Evento auth:logout capturado! Limpiando estado de caja...")
        setEstadoCaja({
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: "",
        })
      }
      
      window.addEventListener("auth:login", handleLogin)
      window.addEventListener("auth:logout", handleLogout)
      
      return () => {
        console.log("🔇 Removiendo listeners de autenticación")
        window.removeEventListener("auth:login", handleLogin)
        window.removeEventListener("auth:logout", handleLogout)
      }
    }
  }, [refrescarEstado])

  // Listener para detectar cambios en autenticación entre tabs (storage event)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "auth_token") {
          if (e.newValue) {
            console.log("🔄 Token agregado en otra tab, refrescando caja...")
            refrescarEstado()
          } else {
            console.log("🔄 Token eliminado en otra tab, limpiando caja...")
            setEstadoCaja({
              abierta: false,
              corte_id: null,
              monto_inicial: 0,
              monto_actual: 0,
              fecha_apertura: null,
              usuario: "",
            })
          }
        }
      }
      
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [refrescarEstado])

  // Refrescar estado periódicamente para sincronización entre tabs/navegadores
  useEffect(() => {
    // Solo refrescar si hay un usuario autenticado
    if (typeof window !== "undefined" && AuthService.isAuthenticated()) {
      console.log("⏰ Configurando refresco automático de caja cada 30 segundos")
      
      const interval = setInterval(() => {
        console.log("🔄 Refresco automático de estado de caja...")
        refrescarEstado()
      }, 30000) // 30 segundos

      return () => {
        console.log("⏰ Limpiando interval de refresco")
        clearInterval(interval)
      }
    }
  }, [refrescarEstado])

  // Función para abrir caja
  const abrirCaja = useCallback(async (montoInicial: number) => {
    try {
      console.log("🔓 Intentando abrir caja...")
      const response = await CajaService.abrirCaja(montoInicial)
      const user = AuthService.getUser()

      // Actualizar estado local inmediatamente
      setEstadoCaja({
        abierta: true,
        corte_id: response.data.corte_id,
        monto_inicial: montoInicial,
        monto_actual: montoInicial,
        fecha_apertura: response.data.fecha_apertura,
        usuario: user?.nombre_completo || user?.username || "Usuario",
      })

      console.log("✅ Estado de caja actualizado localmente")
    } catch (error) {
      console.error("❌ Error al abrir caja:", error)
      throw error
    }
  }, [])

  // Función para cerrar caja
  const cerrarCaja = useCallback(async (observacion?: string) => {
    try {
      console.log("🔒 Intentando cerrar caja...")
      const response = await CajaService.cerrarCaja(observacion)
      const user = AuthService.getUser()

      // Actualizar estado local inmediatamente
      setEstadoCaja({
        abierta: false,
        corte_id: null,
        monto_inicial: 0,
        monto_actual: 0,
        fecha_apertura: null,
        usuario: user?.nombre_completo || user?.username || "Usuario",
      })

      console.log("✅ Caja cerrada, estado actualizado localmente")

      return { total_ingresos: response.data.total_ingresos_amarrados }
    } catch (error) {
      console.error("❌ Error al cerrar caja:", error)
      throw error
    }
  }, [])

  const value: CajaContextType = {
    estadoCaja,
    loading,
    abrirCaja,
    cerrarCaja,
    refrescarEstado,
  }

  return <CajaContext.Provider value={value}>{children}</CajaContext.Provider>
}

// Hook personalizado para usar el contexto
export function useCaja() {
  const context = useContext(CajaContext)
  if (context === undefined) {
    throw new Error("useCaja debe ser usado dentro de un CajaProvider")
  }
  return context
}
