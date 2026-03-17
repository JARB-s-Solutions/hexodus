"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardKpi } from "@/components/dashboard/dashboard-kpi"
import { VisitantesCard } from "@/components/dashboard/visitantes-card"
import { TendenciaRow } from "@/components/dashboard/tendencia-row"
import {
  VentasChart,
  HorasPicoChart,
  IngresosChart,
  StockCriticoCard,
} from "@/components/dashboard/dashboard-charts"
import { DashboardSimple } from "@/components/dashboard/dashboard-simple"
import { DashboardService, type DashboardPeriodo, type DashboardMetricasMapped } from "@/lib/services/dashboard"
import type { DatosFinancieros } from "@/lib/dashboard-data"
import { usePermisos } from "@/hooks/use-permisos"

const EMPTY_DATOS: DatosFinancieros = {
  ventas: 0,
  gastos: 0,
  ventasAnt: 0,
  gastosAnt: 0,
}

const EMPTY_METRICAS: DashboardMetricasMapped = {
  ventasChart: [],
  horasPico: [],
  ingresosDiarios: [],
  stockCritico: [],
  asistencia: {
    hoy: 0,
    ayer: 0,
    hombres: 0,
    mujeres: 0,
    variacion: 0,
    tendenciaPositiva: true,
  },
  insightNegocio: null,
}

export default function DashboardPage() {
  const { tienePermiso } = usePermisos()
  const puedeVerGraficas = tienePermiso("dashboard", "verGraficas")

  const [periodo, setPeriodo] = useState<DashboardPeriodo>("hoy")
  const [datos, setDatos] = useState<DatosFinancieros>(EMPTY_DATOS)
  const [metricas, setMetricas] = useState<DashboardMetricasMapped>(EMPTY_METRICAS)
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [errorKpis, setErrorKpis] = useState<string | null>(null)

  const cargarKpis = useCallback(async () => {
    try {
      setLoadingKpis(true)
      setErrorKpis(null)

      const response = await DashboardService.obtenerKpis(periodo)
      const datosMapeados = DashboardService.mapToDatosFinancieros(response)
      setDatos(datosMapeados)
    } catch (error: any) {
      console.error("Error al cargar KPIs del dashboard:", error)
      setErrorKpis(error.message || "No se pudieron cargar los KPIs")
      setDatos(EMPTY_DATOS)
    } finally {
      setLoadingKpis(false)
    }
  }, [periodo])

  const cargarMetricas = useCallback(async () => {
    try {
      const data = await DashboardService.obtenerMetricas(periodo)
      setMetricas(data)
    } catch (error) {
      console.error("Error al cargar metricas del dashboard:", error)
      setMetricas(EMPTY_METRICAS)
    }
  }, [periodo])

  useEffect(() => {
    if (!puedeVerGraficas) return
    cargarKpis()
    cargarMetricas()
  }, [puedeVerGraficas, cargarKpis, cargarMetricas])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="dashboard" />

      <main className="flex-1 flex flex-col min-h-0">
        <DashboardHeader />

        {puedeVerGraficas ? (
          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
            {/* KPIs Financieros */}
            <DashboardKpi datos={datos} loading={loadingKpis} error={errorKpis} />

            {/* Visitantes del Dia */}
            <VisitantesCard />

            {/* Tendencia + Asistencia + Genero */}
            <TendenciaRow
              datos={datos}
              asistencia={metricas.asistencia}
              insightNegocio={metricas.insightNegocio}
              periodo={periodo}
              onPeriodoChange={(value) => setPeriodo(value as DashboardPeriodo)}
            />

            {/* Charts Row: Ventas vs Anterior + Horas Pico */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <VentasChart data={metricas.ventasChart} />
              </div>
              <div className="lg:col-span-1">
                <HorasPicoChart data={metricas.horasPico} />
              </div>
            </div>

            {/* Charts Row: Ingresos + Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IngresosChart data={metricas.ingresosDiarios} />
              <StockCriticoCard items={metricas.stockCritico} />
            </div>
          </div>
        ) : (
          <DashboardSimple />
        )}
      </main>
    </div>
  )
}
