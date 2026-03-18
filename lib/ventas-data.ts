export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "digital"

export interface ProductoVenta {
  id: string
  nombre: string
  precio: number
  cantidad: number
}

export interface Venta {
  id: string
  cliente: string
  productos: ProductoVenta[]
  total: number
  fecha: string
  hora: string
  metodoPago: MetodoPago
}

export interface ProductoCatalogo {
  id: string
  nombre: string
  precio: number
  categoria: string
  stock: number
}

// Demo data
export const productosCatalogo: ProductoCatalogo[] = [
  { id: "P001", nombre: "Proteina Whey 2kg", precio: 899.00, categoria: "Suplementos", stock: 45 },
  { id: "P002", nombre: "Creatina 500g", precio: 450.00, categoria: "Suplementos", stock: 32 },
  { id: "P003", nombre: "Guantes de Entrenamiento", precio: 280.00, categoria: "Accesorios", stock: 18 },
  { id: "P004", nombre: "Botella Deportiva 1L", precio: 150.00, categoria: "Accesorios", stock: 60 },
  { id: "P005", nombre: "Banda Elastica Set", precio: 320.00, categoria: "Equipo", stock: 25 },
  { id: "P006", nombre: "Pre-entreno 300g", precio: 550.00, categoria: "Suplementos", stock: 20 },
  { id: "P007", nombre: "Toalla Microfibra", precio: 120.00, categoria: "Accesorios", stock: 80 },
  { id: "P008", nombre: "Cuerda para Saltar", precio: 180.00, categoria: "Equipo", stock: 35 },
  { id: "P009", nombre: "BCAA 400g", precio: 380.00, categoria: "Suplementos", stock: 28 },
  { id: "P010", nombre: "Playera Gimnasio XL", precio: 250.00, categoria: "Ropa", stock: 50 },
  { id: "P011", nombre: "Shaker 700ml", precio: 95.00, categoria: "Accesorios", stock: 100 },
  { id: "P012", nombre: "Cinturon Lumbar", precio: 650.00, categoria: "Equipo", stock: 12 },
]

// Seeded pseudo-random number generator (mulberry32) to ensure deterministic
// output on both server and client, preventing hydration mismatches.
function createSeededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seededRandom = createSeededRandom(42)

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()))
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}

const clientes = [
  "Carlos Ramirez", "Ana Martinez", "Luis Hernandez", "Maria Lopez",
  "Jorge Garcia", "Sofia Torres", "Roberto Diaz", "Elena Morales",
  "Fernando Castro", "Patricia Ruiz", "Miguel Vargas", "Lucia Romero",
  "Diego Flores", "Camila Ortiz", "Andres Mendez", "Valentina Cruz",
  "Ricardo Gutierrez", "Isabella Reyes", "Pedro Salazar", "Natalia Vega",
]

const metodosPago: MetodoPago[] = ["efectivo", "tarjeta", "transferencia", "digital"]

// Format a Date using its UTC components so the result is identical
// regardless of the host timezone, preventing hydration mismatches.
function formatDateUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function generateVentas(count: number, referenceDate?: Date): Venta[] {
  const ventas: Venta[] = []
  const now = referenceDate ?? new Date()
  const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1))

  for (let i = 0; i < count; i++) {
    const fecha = randomDate(threeMonthsAgo, now)
    const numProductos = Math.floor(seededRandom() * 4) + 1
    const productos: ProductoVenta[] = []
    const usedIds = new Set<string>()

    for (let j = 0; j < numProductos; j++) {
      let prod = randomItem(productosCatalogo)
      while (usedIds.has(prod.id)) {
        prod = randomItem(productosCatalogo)
      }
      usedIds.add(prod.id)
      productos.push({
        id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        cantidad: Math.floor(seededRandom() * 3) + 1,
      })
    }

    const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0)

    ventas.push({
      id: `V-${String(i + 1).padStart(4, "0")}`,
      cliente: randomItem(clientes),
      productos,
      total,
      fecha: formatDateUTC(fecha),
      hora: `${String(fecha.getUTCHours()).padStart(2, "0")}:${String(fecha.getUTCMinutes()).padStart(2, "0")}`,
      metodoPago: randomItem(metodosPago),
    })
  }

  return ventas.sort((a, b) => {
    const dateCompare = b.fecha.localeCompare(a.fecha)
    if (dateCompare !== 0) return dateCompare
    return b.hora.localeCompare(a.hora)
  })
}

// Analytics helpers
export function getVentasPorPeriodo(ventas: Venta[], inicio: string, fin: string): Venta[] {
  return ventas.filter((v) => v.fecha >= inicio && v.fecha <= fin)
}

export function getTotalVentas(ventas: Venta[]): number {
  return ventas.reduce((sum, v) => sum + v.total, 0)
}

export function getProductosMasVendidos(ventas: Venta[]): { nombre: string; cantidad: number; ingresos: number }[] {
  const map = new Map<string, { cantidad: number; ingresos: number }>()

  for (const v of ventas) {
    for (const p of v.productos) {
      const existing = map.get(p.nombre) || { cantidad: 0, ingresos: 0 }
      map.set(p.nombre, {
        cantidad: existing.cantidad + p.cantidad,
        ingresos: existing.ingresos + p.precio * p.cantidad,
      })
    }
  }

  return Array.from(map.entries())
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

export function getVentasPorDia(ventas: Venta[]): { fecha: string; total: number; transacciones: number }[] {
  const map = new Map<string, { total: number; transacciones: number }>()

  for (const v of ventas) {
    const existing = map.get(v.fecha) || { total: 0, transacciones: 0 }
    map.set(v.fecha, {
      total: existing.total + v.total,
      transacciones: existing.transacciones + 1,
    })
  }

  return Array.from(map.entries())
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function getVentasPorMetodo(ventas: Venta[]): { metodo: MetodoPago; total: number; cantidad: number }[] {
  const map = new Map<MetodoPago, { total: number; cantidad: number }>()

  for (const v of ventas) {
    const existing = map.get(v.metodoPago) || { total: 0, cantidad: 0 }
    map.set(v.metodoPago, {
      total: existing.total + v.total,
      cantidad: existing.cantidad + 1,
    })
  }

  return Array.from(map.entries())
    .map(([metodo, data]) => ({ metodo, ...data }))
    .sort((a, b) => b.total - a.total)
}

export function formatCurrency(amount: number): string {
  const fixed = amount.toFixed(2)
  const [intPart, decPart] = fixed.split(".")
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${formatted}.${decPart}`
}

export function getMetodoPagoLabel(metodo: MetodoPago): string {
  const labels: Record<MetodoPago, string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
    digital: "Pago Digital",
  }
  return labels[metodo]
}
