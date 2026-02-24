"use client"

import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { formatCurrency, calcCambio } from "@/lib/reportes-data"

interface InsightItem {
  tipo: "positivo" | "negativo" | "alerta" | "info"
  mensaje: string
}

interface InsightsReportesProps {
  ventas: number
  ventasAnterior: number
  gastos: number
  gastosAnterior: number
  utilidad: number
  utilidadAnterior: number
  membresias: number
  membresiasAnterior: number
  socios: number
  topGasto: string
  topGastoMonto: number
  topPlan: string
  topPlanSocios: number
  periodo: string
}

export function InsightsReportes({
  ventas,
  ventasAnterior,
  gastos,
  gastosAnterior,
  utilidad,
  utilidadAnterior,
  membresias,
  membresiasAnterior,
  socios,
  topGasto,
  topGastoMonto,
  topPlan,
  topPlanSocios,
  periodo,
}: InsightsReportesProps) {
  const cambioVentas = calcCambio(ventas, ventasAnterior)
  const cambioGastos = calcCambio(gastos, gastosAnterior)
  const cambioUtilidad = calcCambio(utilidad, utilidadAnterior)
  const cambioMembresias = calcCambio(membresias, membresiasAnterior)
  const margen = ventas > 0 ? ((utilidad / ventas) * 100) : 0

  const insights: InsightItem[] = []

  // Ventas insight
  if (cambioVentas > 10) {
    insights.push({
      tipo: "positivo",
      mensaje: `Las ventas crecieron +${cambioVentas.toFixed(0)}% respecto al periodo anterior. Excelente tendencia de crecimiento.`,
    })
  } else if (cambioVentas < -10) {
    insights.push({
      tipo: "negativo",
      mensaje: `Las ventas bajaron ${cambioVentas.toFixed(0)}% respecto al periodo anterior. Considere revisar estrategias comerciales.`,
    })
  } else {
    insights.push({
      tipo: "info",
      mensaje: `Las ventas se mantienen estables (${cambioVentas >= 0 ? "+" : ""}${cambioVentas.toFixed(1)}%) respecto al periodo anterior.`,
    })
  }

  // Gastos insight
  if (cambioGastos > 15) {
    insights.push({
      tipo: "alerta",
      mensaje: `Los gastos aumentaron +${cambioGastos.toFixed(0)}%. La categoria con mayor gasto es "${topGasto}" con ${formatCurrency(topGastoMonto)}.`,
    })
  } else if (cambioGastos < -5) {
    insights.push({
      tipo: "positivo",
      mensaje: `Los gastos se redujeron ${Math.abs(cambioGastos).toFixed(0)}%. Buen control de costos operativos.`,
    })
  }

  // Utilidad insight
  if (utilidad > 0 && cambioUtilidad > 0) {
    insights.push({
      tipo: "positivo",
      mensaje: `La utilidad neta es ${formatCurrency(utilidad)} con un margen del ${margen.toFixed(1)}%. Mejoro ${cambioUtilidad.toFixed(0)}% vs periodo anterior.`,
    })
  } else if (utilidad <= 0) {
    insights.push({
      tipo: "negativo",
      mensaje: `La utilidad neta es negativa (${formatCurrency(utilidad)}). Los gastos superan a los ingresos en este periodo.`,
    })
  }

  // Membresias insight
  if (cambioMembresias > 5) {
    insights.push({
      tipo: "positivo",
      mensaje: `Los ingresos por membresias crecieron +${cambioMembresias.toFixed(0)}%. El plan mas popular es "${topPlan}" con ${topPlanSocios} suscripciones.`,
    })
  } else {
    insights.push({
      tipo: "info",
      mensaje: `El plan mas popular es "${topPlan}" con ${topPlanSocios} suscripciones activas. Total de socios: ${socios}.`,
    })
  }

  // General recommendations
  if (margen < 20 && margen > 0) {
    insights.push({
      tipo: "alerta",
      mensaje: `El margen de utilidad es del ${margen.toFixed(1)}%, considerado bajo. Revise oportunidades para optimizar costos.`,
    })
  }

  const iconMap = {
    positivo: CheckCircle,
    negativo: TrendingDown,
    alerta: AlertTriangle,
    info: Info,
  }

  const colorMap = {
    positivo: "text-success",
    negativo: "text-destructive",
    alerta: "text-warning",
    info: "text-accent",
  }

  const bgMap = {
    positivo: "bg-success/10",
    negativo: "bg-destructive/10",
    alerta: "bg-warning/10",
    info: "bg-accent/10",
  }

  return (
    <div
      className="bg-card rounded-xl p-5"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Insights y Recomendaciones</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.tipo]
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg ${bgMap[insight.tipo]}`}
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colorMap[insight.tipo]}`} />
              <p className="text-xs leading-relaxed text-foreground">{insight.mensaje}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
