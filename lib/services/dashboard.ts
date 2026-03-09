import { apiGet } from '@/lib/api'
import type { DatosFinancieros, StockCritico } from '@/lib/dashboard-data'

export type DashboardPeriodo = 'hoy' | 'semana' | 'mes'

interface DashboardKpisApiData {
  ventas: {
    total: number
    variacion: number
    texto_comparacion?: string
  }
  gastos: {
    total: number
    variacion: number
    texto_comparacion?: string
  }
  utilidad: {
    total: number
    variacion: number
    texto_comparacion?: string
  }
  saldo_neto: {
    total: number
    variacion: number
    texto_comparacion?: string
  }
}

interface DashboardKpisApiResponse {
  message: string
  data: DashboardKpisApiData
}

interface DashboardMetricasApiResponse {
  message?: string
  data?: any
}

export interface DashboardMetricasMapped {
  ventasChart: Array<{ dia: string; actual: number; anterior: number }>
  horasPico: Array<{ hora: string; personas: number }>
  ingresosDiarios: Array<{ dia: string; ingresos: number }>
  stockCritico: StockCritico[]
  asistencia: { hoy: number; ayer: number; hombres: number; mujeres: number }
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function pickFirst<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return undefined
}

function ensureArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

// Convierte total + variacion% en valor del periodo anterior.
function getAnterior(totalRaw: unknown, variacionRaw: unknown): number {
  const total = toNumber(totalRaw)
  const variacion = toNumber(variacionRaw)
  const factor = 1 + variacion / 100

  if (factor <= 0) {
    return total
  }

  return total / factor
}

export class DashboardService {
  static async obtenerKpis(periodo: DashboardPeriodo = 'semana'): Promise<DashboardKpisApiData> {
    try {
      const response = await apiGet<DashboardKpisApiResponse>(`/dashboard?periodo=${periodo}`)
      return response.data
    } catch (error: any) {
      // Fallback por compatibilidad si backend expone /dashboard/kpis.
      if (error?.status === 404) {
        const response = await apiGet<DashboardKpisApiResponse>(`/dashboard/kpis?periodo=${periodo}`)
        return response.data
      }
      throw error
    }
  }

  static mapToDatosFinancieros(kpis: DashboardKpisApiData): DatosFinancieros {
    const ventas = toNumber(kpis.ventas?.total)
    const gastos = toNumber(kpis.gastos?.total)

    return {
      ventas,
      gastos,
      ventasAnt: getAnterior(kpis.ventas?.total, kpis.ventas?.variacion),
      gastosAnt: getAnterior(kpis.gastos?.total, kpis.gastos?.variacion),
    }
  }

  static async obtenerMetricas(periodo: DashboardPeriodo = 'semana'): Promise<DashboardMetricasMapped> {
    const response = await apiGet<DashboardMetricasApiResponse>(`/dashboard/metricas?periodo=${periodo}`)
    return this.mapMetricas(response?.data ?? response)
  }

  static mapMetricas(payloadRaw: any): DashboardMetricasMapped {
    const payload = payloadRaw || {}

    const ventasRaw = ensureArray<any>(pickFirst(
      payload.ventas_chart,
      payload.ventasChart,
      payload.ventas_vs_anterior,
      payload.ventas,
      payload.grafica_ventas,
    ))
    const ventasChart = ventasRaw.map((item) => ({
      dia: String(pickFirst(item.dia, item.day, item.label, item.nombre, '') || ''),
      actual: toNumber(pickFirst(item.actual, item.total_actual, item.ventas_actual, item.value, 0)),
      anterior: toNumber(pickFirst(item.anterior, item.total_anterior, item.ventas_anterior, item.previous, 0)),
    }))

    const horasRaw = ensureArray<any>(pickFirst(
      payload.horas_pico,
      payload.horasPico,
      payload.grafica_horas,
      payload.horaspico,
    ))
    const horasPico = horasRaw.map((item) => ({
      hora: String(pickFirst(item.hora, item.hour, item.label, '') || ''),
      personas: toNumber(pickFirst(item.personas, item.total, item.valor, item.value, 0)),
    }))

    const ingresosRaw = ensureArray<any>(pickFirst(
      payload.ingresos_diarios,
      payload.ingresosDiarios,
      payload.grafica_ingresos,
      payload.ingresos,
    ))
    const ingresosDiarios = ingresosRaw.map((item) => ({
      dia: String(pickFirst(item.dia, item.day, item.label, '') || ''),
      ingresos: toNumber(pickFirst(item.ingresos, item.total, item.valor, item.value, 0)),
    }))

    const stockRaw = ensureArray<any>(pickFirst(
      payload.stock_critico,
      payload.stockCritico,
      payload.stock,
      payload.inventario_critico,
    ))
    const stockCritico = stockRaw.map((item) => {
      const porcentaje = toNumber(pickFirst(item.porcentaje, item.pct, item.percent, 0))
      const nivelRaw = String(pickFirst(item.nivel, item.level, '') || '').toLowerCase()

      const nivel: 'danger' | 'warning' =
        nivelRaw === 'danger' || nivelRaw === 'critico' || nivelRaw === 'critical'
          ? 'danger'
          : porcentaje <= 15
          ? 'danger'
          : 'warning'

      return {
        nombre: String(pickFirst(item.nombre, item.producto, item.item, 'Producto') || 'Producto'),
        cantidad: toNumber(pickFirst(item.cantidad, item.stock, item.total, 0)),
        porcentaje,
        nivel,
      }
    })

    const asistenciaRaw = pickFirst(payload.asistencia, payload.widget_asistencia, payload.resumen_asistencia, {}) || {}
    const generoRaw = pickFirst(asistenciaRaw.genero, asistenciaRaw.distribucion_genero, payload.genero, {}) || {}

    const asistencia = {
      hoy: toNumber(pickFirst(asistenciaRaw.hoy, asistenciaRaw.total_hoy, asistenciaRaw.actual, 0)),
      ayer: toNumber(pickFirst(asistenciaRaw.ayer, asistenciaRaw.total_ayer, asistenciaRaw.anterior, 0)),
      hombres: toNumber(pickFirst(generoRaw.hombres, generoRaw.masculino, generoRaw.male, 0)),
      mujeres: toNumber(pickFirst(generoRaw.mujeres, generoRaw.femenino, generoRaw.female, 0)),
    }

    return {
      ventasChart,
      horasPico,
      ingresosDiarios,
      stockCritico,
      asistencia,
    }
  }
}
