// ============================================================================
// TYPES
// ============================================================================

export type EstadoAcceso = "permitido" | "denegado"
export type EstadoMembresia = "permitido" | "proximo_vencer" | "vencida" | "sin_pago" | "sin_membresia" | "no_registrado"

export interface RegistroAcceso {
  id: string
  socioId: string
  socioDbId?: number
  nombreSocio: string
  tipo: EstadoAcceso
  motivo: string
  confianza: string
  timestamp: string
  estadoMembresia?: EstadoMembresia
  accionRecomendada?: 'ninguna' | 'cobrar_adeudo' | 'renovar_membresia'
  fotoUrl?: string
}

export interface ConfigRegistro {
  sonidoHabilitado: boolean
  deteccionAutomatica: boolean
  mostrarDeteccion: boolean
  umbralConfianza: number
  tiempoReset: number
}

export interface Socio {
  id: string
  socioDbId?: number
  nombre: string
  email: string
  telefono: string
  genero: string
  foto: string | null
  faceDescriptor: number[] | null
  fechaVencimiento: string
  estado: string
  membresia: string
  membresiaInfo: {
    id: string
    nombre: string
    precio: number
    duracion: number
  } | null
}

export interface KpiAsistencia {
  asistentesHoy: number
  activosAhora: number
  denegados: number
  permanenciaPromedio: string
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_CONFIG: ConfigRegistro = {
  sonidoHabilitado: true,
  deteccionAutomatica: true,
  mostrarDeteccion: true,
  umbralConfianza: 0.5,
  tiempoReset: 10,
}

// ============================================================================
// DEMO DATA GENERATION
// ============================================================================

const NOMBRES_DEMO = [
  "Carlos Martinez", "Ana Garcia", "Luis Rodriguez", "Maria Lopez",
  "Pedro Sanchez", "Sofia Hernandez", "Diego Torres", "Valentina Diaz",
  "Andres Morales", "Camila Flores", "Fernando Ruiz", "Isabella Castro",
  "Ricardo Vargas", "Daniela Mendoza", "Oscar Jimenez", "Paula Rojas",
]

const MEMBRESIAS_DEMO = ["Plan Mensual", "Plan Trimestral", "Plan Semestral", "Plan Anual"]

const MOTIVOS_PERMITIDO = [
  "Acceso permitido",
  "Acceso permitido - Membresia vigente",
]

const MOTIVOS_DENEGADO = [
  "Membresia vencida",
  "Sin membresia activa",
  "Membresia sin pagar",
  "Rostro no registrado",
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateDemoRegistros(count: number = 25): RegistroAcceso[] {
  const rand = seededRandom(42)
  const registros: RegistroAcceso[] = []
  const baseDate = new Date(Date.UTC(2026, 1, 28, 6, 0, 0)) // Feb 28, 2026 6AM

  for (let i = 0; i < count; i++) {
    const isPermitido = rand() > 0.2
    const nombre = NOMBRES_DEMO[Math.floor(rand() * NOMBRES_DEMO.length)]
    const hora = new Date(baseDate.getTime() + Math.floor(rand() * 14 * 60 * 60 * 1000)) // within 14 hours

    registros.push({
      id: `acc_${String(i + 1).padStart(3, "0")}`,
      socioId: `socio_${String(Math.floor(rand() * 50) + 1).padStart(3, "0")}`,
      nombreSocio: nombre,
      tipo: isPermitido ? "permitido" : "denegado",
      motivo: isPermitido
        ? MOTIVOS_PERMITIDO[Math.floor(rand() * MOTIVOS_PERMITIDO.length)]
        : MOTIVOS_DENEGADO[Math.floor(rand() * MOTIVOS_DENEGADO.length)],
      confianza: (70 + rand() * 29).toFixed(1),
      timestamp: hora.toISOString(),
      estadoMembresia: isPermitido
        ? (rand() > 0.8 ? "proximo_vencer" : "permitido")
        : (["vencida", "sin_membresia", "sin_pago", "no_registrado"] as EstadoMembresia[])[
            Math.floor(rand() * 4)
          ],
    })
  }

  // Sort by most recent first
  registros.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return registros
}

export function generateDemoSocios(count: number = 16): Socio[] {
  const rand = seededRandom(123)
  const socios: Socio[] = []

  for (let i = 0; i < count; i++) {
    const membresia = MEMBRESIAS_DEMO[Math.floor(rand() * MEMBRESIAS_DEMO.length)]
    const diasHastaVenc = Math.floor(rand() * 60) - 10
    const vencimiento = new Date(Date.UTC(2026, 1, 28))
    vencimiento.setDate(vencimiento.getDate() + diasHastaVenc)

    socios.push({
      id: `socio_${String(i + 1).padStart(3, "0")}`,
      nombre: NOMBRES_DEMO[i % NOMBRES_DEMO.length],
      email: `${NOMBRES_DEMO[i % NOMBRES_DEMO.length].toLowerCase().replace(" ", ".")}@email.com`,
      telefono: `+52 555 ${String(Math.floor(rand() * 9000000) + 1000000)}`,
      genero: rand() > 0.5 ? "masculino" : "femenino",
      foto: null,
      faceDescriptor: Array.from({ length: 128 }, () => rand() * 2 - 1),
      fechaVencimiento: vencimiento.toISOString().split("T")[0],
      estado: diasHastaVenc > 0 ? "activo" : "vencido",
      membresia,
      membresiaInfo: {
        id: `memb_${String(i + 1).padStart(3, "0")}`,
        nombre: membresia,
        precio: [500, 1200, 2200, 4000][Math.floor(rand() * 4)],
        duracion: [30, 90, 180, 365][Math.floor(rand() * 4)],
      },
    })
  }

  return socios
}

// ============================================================================
// COMPUTE KPIs
// ============================================================================

export function computeKpis(registros: RegistroAcceso[]): KpiAsistencia {
  const hoy = "2026-02-28" // fixed for demo
  const registrosHoy = registros.filter((r) => r.timestamp.startsWith(hoy))

  const asistentesHoy = new Set(
    registrosHoy.filter((r) => r.tipo === "permitido").map((r) => r.socioId)
  ).size

  const denegados = registrosHoy.filter((r) => r.tipo === "denegado").length

  // Active in last 4 hours
  const hace4h = new Date(Date.UTC(2026, 1, 28, 12, 0, 0)).getTime() - 4 * 3600000
  const activosAhora = new Set(
    registros
      .filter((r) => r.tipo === "permitido" && new Date(r.timestamp).getTime() > hace4h)
      .map((r) => r.socioId)
  ).size

  return {
    asistentesHoy,
    activosAhora,
    denegados,
    permanenciaPromedio: "1h 45m",
  }
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export function formatHora(timestamp: string): string {
  if (!timestamp) {
    console.warn('[formatHora] Timestamp is null or undefined:', timestamp)
    return "--:--"
  }
  
  const date = new Date(timestamp)
  
  // Validar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.error('[formatHora] Invalid date from timestamp:', timestamp)
    return "Invalid Date"
  }
  
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatFecha(timestamp: string): string {
  if (!timestamp) {
    console.warn('[formatFecha] Timestamp is null or undefined:', timestamp)
    return "--/--/----"
  }
  
  const date = new Date(timestamp)
  
  // Validar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.error('[formatFecha] Invalid date from timestamp:', timestamp)
    return "Invalid Date"
  }
  
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function exportRegistrosCSV(registros: RegistroAcceso[]) {
  let csv = "Fecha/Hora,Socio,ID,Tipo,Motivo,Confianza\n"
  registros.forEach((r) => {
    csv += `${r.timestamp},${r.nombreSocio},${r.socioId},${r.tipo},${r.motivo},${r.confianza}%\n`
  })

  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `registros_asistencia_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}