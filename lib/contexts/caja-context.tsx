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
      console.log("🔄 Refrescando estado de caja...")
      const response = await CajaService.consultarCaja()
      const user = AuthService.getUser()

      // Buscar movimiento de apertura
      const movApertura = response.movimientos.find(
        (mov) => mov.concepto === "Apertura / Fondo de Caja" && mov.tipo === "ingreso"
      )

      if (movApertura) {
        // Caja abierta
        setEstadoCaja({
          abierta: true,
          corte_id: movApertura.id,
          monto_inicial: response.resumen.efectivo_inicial,
          monto_actual: response.resumen.efectivo_final,
          fecha_apertura: movApertura.fecha,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        })
      } else {
        // Caja cerrada (sin movimiento de apertura)
        setEstadoCaja({
          abierta: false,
          corte_id: null,
          monto_inicial: 0,
          monto_actual: 0,
          fecha_apertura: null,
          usuario: user?.nombre_completo || user?.username || "Usuario",
        })
      }
    } catch (error) {
      console.error("Error al refrescar estado de caja:", error)
      // Si hay error, asumimos caja cerrada
      const user = AuthService.getUser()
      setEstadoCaja({
        abierta: false,
        corte_id: null,
        monto_inicial: 0,
        monto_actual: 0,
        fecha_apertura: null,
        usuario: user?.nombre_completo || user?.username || "Usuario",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar estado inicial al montar
  useEffect(() => {
    refrescarEstado()
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
