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
  asistencia: {
    hoy: number
    ayer: number
    hombres: number
    mujeres: number
    variacion: number
    tendenciaPositiva: boolean
  }
  insightNegocio: {
    titulo: string
    texto: string
    tendenciaPositiva: boolean
    periodoAplicado: string
  } | null
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
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

function normalizeHourLabel(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  // Accept formats like "8", "08", "8:00", "08:00-09:00" and normalize to HH
  const firstPart = raw.split('-')[0]?.trim() ?? raw
  const hourToken = firstPart.includes(':') ? firstPart.split(':')[0] : firstPart
  const hour = Number(hourToken)

  if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
    return String(Math.floor(hour)).padStart(2, '0')
  }

  return raw
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
    const widgetsRaw = pickFirst(payload.widgets, payload.widget, {}) || {}

    const ventasRaw = ensureArray<any>(pickFirst(
      payload.grafica_ventas_vs_anterior,
      payload.ventas_chart,
      payload.ventasChart,
      payload.ventas_vs_anterior,
      payload.ventas,
      payload.grafica_ventas,
    ))
    const ventasChart = ventasRaw.map((item) => ({
      dia: String(pickFirst(item.dia, item.day, item.label, item.nombre, item.fecha, '') || ''),
      actual: toNumber(pickFirst(item.actual, item.total_actual, item.ventas_actual, item.value, item.total, item.monto_actual, 0)),
      anterior: toNumber(pickFirst(item.anterior, item.total_anterior, item.ventas_anterior, item.previous, item.monto_anterior, 0)),
    }))

    const horasRaw = ensureArray<any>(pickFirst(
      payload.horas_pico,
      payload.horasPico,
      payload.grafica_horas,
      payload.horaspico,
    ))
    const horasPico = horasRaw.map((item) => ({
      hora: normalizeHourLabel(pickFirst(item.hora, item.hour, item.label, item.rango, item.franja, '')),
      personas: toNumber(pickFirst(item.personas, item.visitantes, item.accesos, item.asistencias, item.total, item.promedio, item.valor, item.value, 0)),
    }))

    const ingresosRaw = ensureArray<any>(pickFirst(
      payload.ingresos_diarios,
      payload.ingresosDiarios,
      payload.grafica_ingresos,
      payload.ingresos,
    ))
    const ingresosDiarios = ingresosRaw.map((item) => ({
      dia: String(pickFirst(item.dia, item.day, item.label, item.fecha, item.date, '') || ''),
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

    const asistenciaRaw = pickFirst(
      widgetsRaw.asistencia,
      payload.asistencia,
      payload.widget_asistencia,
      payload.resumen_asistencia,
      {},
    ) || {}

    const generoLista = ensureArray<any>(pickFirst(
      widgetsRaw.por_genero,
      payload.por_genero,
      [],
    ))

    let hombres = 0
    let mujeres = 0

    if (generoLista.length > 0) {
      for (const item of generoLista) {
        const nombre = String(pickFirst(item.nombre, item.name, item.genero, '') || '').toLowerCase()
        const valor = toNumber(pickFirst(item.valor, item.value, item.total, item.cantidad, 0))

        if (nombre.includes('hombre') || nombre.includes('mascul')) {
          hombres = valor
        } else if (nombre.includes('mujer') || nombre.includes('femen')) {
          mujeres = valor
        }
      }
    } else {
      const generoRaw = pickFirst(asistenciaRaw.genero, asistenciaRaw.distribucion_genero, payload.genero, {}) || {}
      hombres = toNumber(pickFirst(generoRaw.hombres, generoRaw.masculino, generoRaw.male, 0))
      mujeres = toNumber(pickFirst(generoRaw.mujeres, generoRaw.femenino, generoRaw.female, 0))
    }

    const variacionAsistencia = toNumber(pickFirst(
      asistenciaRaw.variacion,
      asistenciaRaw.porcentaje_variacion,
      asistenciaRaw.delta,
      0,
    ))

    const asistencia = {
      hoy: toNumber(pickFirst(asistenciaRaw.hoy, asistenciaRaw.total_hoy, asistenciaRaw.actual, 0)),
      ayer: toNumber(pickFirst(asistenciaRaw.ayer, asistenciaRaw.total_ayer, asistenciaRaw.anterior, 0)),
      hombres,
      mujeres,
      variacion: variacionAsistencia,
      tendenciaPositiva: toBoolean(
        pickFirst(asistenciaRaw.tendencia_positiva, asistenciaRaw.tendenciaPositiva),
        variacionAsistencia >= 0,
      ),
    }

    const insightRaw = pickFirst(
      widgetsRaw.insight_negocio,
      widgetsRaw.insightNegocio,
      payload.insight_negocio,
      payload.insightNegocio,
      payload.insight,
      null,
    )

    const insightNegocio = insightRaw
      ? (() => {
          const titulo = String(pickFirst(insightRaw.titulo, insightRaw.title, '') || '').trim()
          const texto = String(pickFirst(insightRaw.texto, insightRaw.subtitulo, insightRaw.text, '') || '').trim()
          const insightContent = `${titulo} ${texto}`.toLowerCase()
          const fallbackTendenciaPositiva = !/(baj|caid|atenci|empeor|negativ|perdid)/.test(insightContent)

          return {
            titulo,
            texto,
            tendenciaPositiva: toBoolean(
              pickFirst(insightRaw.tendencia_positiva, insightRaw.tendenciaPositiva),
              fallbackTendenciaPositiva,
            ),
            periodoAplicado: String(pickFirst(insightRaw.periodo_aplicado, insightRaw.periodoAplicado, '') || ''),
          }
        })()
      : null

    return {
      ventasChart,
      horasPico,
      ingresosDiarios,
      stockCritico,
      asistencia,
      insightNegocio,
    }
  }
}
