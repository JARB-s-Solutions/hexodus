// ============================================================================
// Dashboard Data Layer
// ============================================================================

export interface DatosFinancieros {
  ventas: number
  gastos: number
  ventasAnt: number
  gastosAnt: number
}

export interface Alerta {
  id: string
  mensaje: string
  detalle: string
  tipo: "danger" | "warning" | "info"
}

export interface StockCritico {
  nombre: string
  cantidad: number
  porcentaje: number
  nivel: "danger" | "warning"
}

export interface VisitanteHoy {
  id: string
  nombre: string
  membresia: string
  horaEntrada: string
  estado: "en-gimnasio" | "posible-salida" | "salio"
  minutos: number
  totalVisitas: number
}

export const datosFinancieros: Record<string, DatosFinancieros> = {
  hoy: { ventas: 1540, gastos: 720, ventasAnt: 1420, gastosAnt: 680 },
  semana: { ventas: 14200, gastos: 6350, ventasAnt: 12640, gastosAnt: 6160 },
  mes: { ventas: 58400, gastos: 24800, ventasAnt: 52100, gastosAnt: 23500 },
}

export const alertas: Alerta[] = [
  { id: "1", mensaje: "12 membresias vencen esta semana", detalle: "Notificacion enviada", tipo: "danger" },
  { id: "2", mensaje: "5 productos con stock bajo", detalle: "Requieren reabastecimiento", tipo: "warning" },
  { id: "3", mensaje: "3 pagos pendientes", detalle: "Vencimiento hoy", tipo: "info" },
]

export const stockCritico: StockCritico[] = [
  { nombre: "Whey Protein 2kg", cantidad: 2, porcentaje: 8, nivel: "danger" },
  { nombre: "Botella de Agua 600ml", cantidad: 3, porcentaje: 12, nivel: "danger" },
  { nombre: "Toallas Gym", cantidad: 5, porcentaje: 20, nivel: "warning" },
  { nombre: "Guantes Training", cantidad: 7, porcentaje: 28, nivel: "warning" },
  { nombre: "Barras Energeticas", cantidad: 8, porcentaje: 32, nivel: "warning" },
]

export const ventasChartData = [
  { dia: "Lun", actual: 1200, anterior: 900 },
  { dia: "Mar", actual: 1900, anterior: 1500 },
  { dia: "Mie", actual: 3000, anterior: 2500 },
  { dia: "Jue", actual: 500, anterior: 1000 },
  { dia: "Vie", actual: 2000, anterior: 1800 },
  { dia: "Sab", actual: 3000, anterior: 2800 },
  { dia: "Dom", actual: 2500, anterior: 2000 },
]

export const horasPicoData = [
  { hora: "07", personas: 8 },
  { hora: "08", personas: 5 },
  { hora: "09", personas: 12 },
  { hora: "10", personas: 15 },
  { hora: "11", personas: 10 },
  { hora: "12", personas: 18 },
  { hora: "13", personas: 28 },
  { hora: "14", personas: 32 },
  { hora: "16", personas: 25 },
  { hora: "17", personas: 20 },
  { hora: "18", personas: 14 },
  { hora: "19", personas: 6 },
]

export const ingresosData = [
  { dia: "Lun", ingresos: 1540 },
  { dia: "Mar", ingresos: 2100 },
  { dia: "Mie", ingresos: 1800 },
  { dia: "Jue", ingresos: 2400 },
  { dia: "Vie", ingresos: 1950 },
  { dia: "Sab", ingresos: 2800 },
  { dia: "Dom", ingresos: 2200 },
]

export const asistenciaData = {
  hoy: 73,
  ayer: 68,
  hombres: 45,
  mujeres: 28,
}

export function formatoMoneda(v: number): string {
  return "$" + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function calcPct(actual: number, anterior: number): number {
  if (anterior === 0) return 0
  return parseFloat(((actual - anterior) / anterior * 100).toFixed(1))
}

export function getTendencia(pct: number): { texto: string; sub: string; tipo: "mejoro" | "empeoro" | "igual" } {
  if (pct > 1) {
    return {
      texto: "El negocio mejoro",
      sub: `La utilidad subio un ${Math.abs(pct)}% comparado con el periodo anterior.`,
      tipo: "mejoro",
    }
  } else if (pct < -1) {
    return {
      texto: "El negocio empeoro",
      sub: `La utilidad bajo un ${Math.abs(pct)}% comparado con el periodo anterior.`,
      tipo: "empeoro",
    }
  }
  return {
    texto: "El negocio se mantuvo igual",
    sub: "La utilidad se mantuvo estable comparado con el periodo anterior.",
    tipo: "igual",
  }
}
