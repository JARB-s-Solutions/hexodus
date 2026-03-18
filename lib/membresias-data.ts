// ============================================================================
// MEMBRESIAS DATA LAYER
// ============================================================================

export type TipoMembresia = "dias" | "semanal" | "mensual" | "anual" | "temporada"
export type UnidadDuracion = "dias" | "semanas" | "meses" | "anos"

export interface Membresia {
  id: number
  nombre: string
  precio: number
  tipo: TipoMembresia
  duracion: { cantidad: number; unidad: UnidadDuracion }
  descripcion: string
  activa: boolean
  esOferta: boolean
  precioOriginal?: number
  fechaVencimientoOferta?: string
  fechaCreacion: string
  sociosActivos: number
}

export interface MembresiaFormData {
  nombre: string
  precio: number
  tipo: TipoMembresia
  duracion: { cantidad: number; unidad: UnidadDuracion }
  descripcion: string
  esOferta: boolean
  precioOriginal?: number
  fechaVencimientoOferta?: string
}

export const tipoLabels: Record<TipoMembresia, string> = {
  dias: "Diario",
  semanal: "Semanal",
  mensual: "Mensual",
  anual: "Anual",
  temporada: "Temporada",
}

export const unidadLabels: Record<UnidadDuracion, { singular: string; plural: string }> = {
  dias: { singular: "dia", plural: "dias" },
  semanas: { singular: "semana", plural: "semanas" },
  meses: { singular: "mes", plural: "meses" },
  anos: { singular: "ano", plural: "anos" },
}

export function getDuracionTexto(duracion: { cantidad: number; unidad: UnidadDuracion }): string {
  const label = unidadLabels[duracion.unidad]
  return `${duracion.cantidad} ${duracion.cantidad === 1 ? label.singular : label.plural}`
}

export function getDescuento(membresia: Membresia): number | null {
  if (!membresia.esOferta || !membresia.precioOriginal) return null
  return Math.round(((membresia.precioOriginal - membresia.precio) / membresia.precioOriginal) * 100)
}

export function generateMembresias(): Membresia[] {
  return [
    {
      id: 1,
      nombre: "Mensual Basica",
      precio: 800,
      tipo: "mensual",
      duracion: { cantidad: 1, unidad: "meses" },
      descripcion: "Acceso completo al gimnasio por 30 dias",
      activa: true,
      esOferta: false,
      fechaCreacion: "2025-01-15",
      sociosActivos: 45,
    },
    {
      id: 2,
      nombre: "Mensual VIP",
      precio: 1400,
      tipo: "mensual",
      duracion: { cantidad: 1, unidad: "meses" },
      descripcion: "Acceso completo + clases grupales + entrenador personal 2 sesiones",
      activa: true,
      esOferta: false,
      fechaCreacion: "2025-01-15",
      sociosActivos: 23,
    },
    {
      id: 3,
      nombre: "Trimestral Premium",
      precio: 3500,
      tipo: "mensual",
      duracion: { cantidad: 3, unidad: "meses" },
      descripcion: "Pago trimestral con descuento del 15%",
      activa: true,
      esOferta: false,
      fechaCreacion: "2025-01-20",
      sociosActivos: 67,
    },
    {
      id: 4,
      nombre: "Anual Gold",
      precio: 12000,
      tipo: "anual",
      duracion: { cantidad: 1, unidad: "anos" },
      descripcion: "Membresia anual con todos los beneficios y descuentos especiales",
      activa: true,
      esOferta: false,
      fechaCreacion: "2025-01-10",
      sociosActivos: 89,
    },
    {
      id: 5,
      nombre: "Pase Diario",
      precio: 50,
      tipo: "dias",
      duracion: { cantidad: 1, unidad: "dias" },
      descripcion: "Acceso por un dia completo al gimnasio",
      activa: true,
      esOferta: false,
      fechaCreacion: "2025-02-01",
      sociosActivos: 12,
    },
    {
      id: 6,
      nombre: "Semanal Student",
      precio: 300,
      tipo: "semanal",
      duracion: { cantidad: 1, unidad: "semanas" },
      descripcion: "Membresia semanal especial para estudiantes",
      activa: true,
      esOferta: true,
      precioOriginal: 400,
      fechaVencimientoOferta: "2025-12-31",
      fechaCreacion: "2025-03-01",
      sociosActivos: 34,
    },
    {
      id: 7,
      nombre: "Oferta Verano 2025",
      precio: 2500,
      tipo: "temporada",
      duracion: { cantidad: 4, unidad: "meses" },
      descripcion: "Promocion especial de verano - 4 meses por precio de 3",
      activa: true,
      esOferta: true,
      precioOriginal: 3200,
      fechaVencimientoOferta: "2025-08-31",
      fechaCreacion: "2025-05-01",
      sociosActivos: 78,
    },
    {
      id: 8,
      nombre: "Plan Familiar",
      precio: 2800,
      tipo: "mensual",
      duracion: { cantidad: 1, unidad: "meses" },
      descripcion: "Membresia familiar hasta 4 personas",
      activa: false,
      esOferta: false,
      fechaCreacion: "2024-12-01",
      sociosActivos: 0,
    },
  ]
}
