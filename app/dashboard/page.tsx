"use client"

import { useState, useMemo } from "react"
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
import {
  datosFinancieros,
  stockCritico,
  ventasChartData,
  horasPicoData,
  ingresosData,
  asistenciaData,
} from "@/lib/dashboard-data"

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState("semana")

  const datos = useMemo(() => {
    return datosFinancieros[periodo] || datosFinancieros.semana
  }, [periodo])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="dashboard" />

      <main className="flex-1 flex flex-col min-h-0">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs Financieros */}
          <DashboardKpi datos={datos} />

          {/* Visitantes del Dia */}
          <VisitantesCard />

          {/* Tendencia + Asistencia + Genero */}
          <TendenciaRow
            datos={datos}
            asistencia={asistenciaData}
            periodo={periodo}
            onPeriodoChange={setPeriodo}
          />

          {/* Charts Row: Ventas vs Anterior + Horas Pico */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <VentasChart data={ventasChartData} />
            </div>
            <div className="lg:col-span-1">
              <HorasPicoChart data={horasPicoData} />
            </div>
          </div>

          {/* Charts Row: Ingresos + Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IngresosChart data={ingresosData} />
            <StockCriticoCard items={stockCritico} />
          </div>
        </div>
      </main>
    </div>
  )
}
