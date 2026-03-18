// Socios data types and mock generator

export type Genero = "M" | "F" | "O"
export type TipoMembresia = "diaria" | "semanal" | "mensual" | "trimestral" | "anual"
export type EstadoContrato = "activo" | "por_vencer" | "vencido" | "sin_contrato"
export type VigenciaMembresia = "vigente" | "por_vencer" | "vencida"

export interface Socio {
  id: number
  nombre: string
  genero: Genero
  correo: string
  telefono: string
  membresia: TipoMembresia
  fechaInicio: string
  fechaFin: string
  firmoContrato: boolean
  contratoInicio: string | null
  contratoFin: string | null
  estadoSocio: "activo" | "inactivo"
  fechaRegistro: string
  bioRostro: boolean
  bioHuella: boolean
}

const formatDate = (d: Date): string => d.toISOString().split("T")[0]

const haceDias = (dias: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return formatDate(d)
}

const enDias = (dias: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return formatDate(d)
}

export function generateSocios(count: number): Socio[] {
  const nombres = [
    "Juan Lopez", "Andrea Gonzalez", "Carlos Ortiz", "Maria Rodriguez",
    "Luis Martinez", "Carmen Ruiz", "Pedro Torres", "Sofia Herrera",
    "Diego Ramirez", "Valentina Flores", "Fernando Diaz", "Gabriela Mendoza",
    "Ricardo Castillo", "Daniela Vargas", "Eduardo Morales", "Isabella Jimenez",
  ]
  const membresias: TipoMembresia[] = ["diaria", "semanal", "mensual", "trimestral", "anual"]
  const generos: Genero[] = ["M", "F"]

  const socios: Socio[] = []

  for (let i = 1; i <= count; i++) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)]
    const genero = generos[Math.floor(Math.random() * generos.length)]
    const membresia = membresias[Math.floor(Math.random() * membresias.length)]
    const firmo = Math.random() > 0.4
    const diasVenc = Math.floor(Math.random() * 400) - 60 // -60 to +340

    socios.push({
      id: i,
      nombre: `${nombre} ${i}`,
      genero,
      correo: `socio${i}@email.com`,
      telefono: `+52 999 ${(10000 + i * 100).toString().slice(0, 5)} ${(1000 + i).toString()}`,
      membresia,
      fechaInicio: haceDias(Math.floor(Math.random() * 180)),
      fechaFin: enDias(diasVenc),
      firmoContrato: firmo,
      contratoInicio: firmo ? haceDias(Math.floor(Math.random() * 60)) : null,
      contratoFin: firmo ? enDias(Math.floor(Math.random() * 365)) : null,
      estadoSocio: "activo",
      fechaRegistro: haceDias(Math.floor(Math.random() * 365)),
      bioRostro: Math.random() > 0.5,
      bioHuella: Math.random() > 0.5,
    })
  }

  return socios
}

export function getVigenciaMembresia(fechaFin: string): VigenciaMembresia {
  const venc = new Date(fechaFin)
  const ahora = new Date()
  const diffDias = Math.ceil((venc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return "vencida"
  if (diffDias <= 7) return "por_vencer"
  return "vigente"
}

export function getEstadoContrato(socio: Socio): EstadoContrato {
  if (!socio.firmoContrato) return "sin_contrato"
  if (!socio.contratoFin) return "sin_contrato"

  const venc = new Date(socio.contratoFin)
  const ahora = new Date()
  const diffDias = Math.ceil((venc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return "vencido"
  if (diffDias <= 30) return "por_vencer"
  return "activo"
}

export function getInicialesSocio(nombre: string): string {
  return nombre
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export const membresiaLabels: Record<TipoMembresia, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
}

export const membresiaPrecios: Record<TipoMembresia, string> = {
  diaria: "$50/dia",
  semanal: "$300/sem",
  mensual: "$1,200/mes",
  trimestral: "$3,200",
  anual: "$10,000",
}
