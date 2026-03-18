"use client"

// ============================================================================
// TYPES
// ============================================================================
export type Categoria = "suplementos" | "accesorios" | "ropa" | "equipamiento" | "bebidas" | "otros"
export type EstadoStock = "disponible" | "bajo" | "agotado"

export interface Producto {
  id: number
  codigo: string
  nombre: string
  categoria: Categoria
  marca: string
  precioCompra: number
  precioVenta: number
  stockActual: number
  stockMinimo: number
  estadoStock: EstadoStock
  ubicacion: string
  descripcion: string
  activo: boolean
  fechaActualizacion: string
}

export interface CompraItem {
  id: number
  nombre: string
  codigo: string
  cantidad: number
  costoUnitario: number
  total: number
}

export interface Compra {
  id: number
  fecha: string
  proveedor: string
  tipoPago: string
  productos: CompraItem[]
  total: number
}

// ============================================================================
// CATEGORY & STOCK INFO
// ============================================================================
export const categoriaInfo: Record<Categoria, { nombre: string; color: string; bg: string }> = {
  suplementos: { nombre: "Suplementos", color: "text-purple-300", bg: "bg-purple-500/15" },
  accesorios: { nombre: "Accesorios", color: "text-blue-300", bg: "bg-blue-500/15" },
  ropa: { nombre: "Ropa Deportiva", color: "text-pink-300", bg: "bg-pink-500/15" },
  equipamiento: { nombre: "Equipamiento", color: "text-orange-300", bg: "bg-orange-500/15" },
  bebidas: { nombre: "Bebidas", color: "text-teal-300", bg: "bg-teal-500/15" },
  otros: { nombre: "Otros", color: "text-gray-300", bg: "bg-gray-500/15" },
}

export const estadoStockInfo: Record<EstadoStock, { nombre: string; color: string; bg: string }> = {
  disponible: { nombre: "Disponible", color: "text-[#22C55E]", bg: "bg-[#22C55E]/15" },
  bajo: { nombre: "Stock Bajo", color: "text-[#FBB424]", bg: "bg-[#FBB424]/15" },
  agotado: { nombre: "Sin Stock", color: "text-[#EF4444]", bg: "bg-[#EF4444]/15" },
}

// ============================================================================
// SEEDED DATA GENERATION (SSR-safe, deterministic)
// ============================================================================
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const productoBases = [
  { base: "Proteina Whey", categoria: "suplementos" as Categoria, marcas: ["Gold Standard", "Muscletech", "BSN"], precios: [45, 85] },
  { base: "Creatina Monohidrato", categoria: "suplementos" as Categoria, marcas: ["Muscletech", "Universal", "Optimum"], precios: [25, 45] },
  { base: "BCAA Aminoacidos", categoria: "suplementos" as Categoria, marcas: ["Dymatize", "BSN", "Cellucor"], precios: [18, 35] },
  { base: "Pre-Workout", categoria: "suplementos" as Categoria, marcas: ["Cellucor", "BSN", "Muscletech"], precios: [30, 55] },
  { base: "Glutamina", categoria: "suplementos" as Categoria, marcas: ["Universal", "Optimum", "Dymatize"], precios: [20, 40] },
  { base: "Quemador de Grasa", categoria: "suplementos" as Categoria, marcas: ["Muscletech", "Cellucor", "BSN"], precios: [35, 65] },
  { base: "Shaker", categoria: "accesorios" as Categoria, marcas: ["Hexodus", "BSN", "Universal"], precios: [8, 15] },
  { base: "Guantes de Entrenamiento", categoria: "accesorios" as Categoria, marcas: ["Hexodus", "Universal"], precios: [12, 25] },
  { base: "Cinturon de Levantamiento", categoria: "accesorios" as Categoria, marcas: ["Hexodus", "Universal"], precios: [25, 45] },
  { base: "Straps de Muneca", categoria: "accesorios" as Categoria, marcas: ["Hexodus", "Universal"], precios: [8, 18] },
  { base: "Toalla Deportiva", categoria: "accesorios" as Categoria, marcas: ["Hexodus"], precios: [10, 20] },
  { base: "Camiseta Entrenamiento", categoria: "ropa" as Categoria, marcas: ["Hexodus"], precios: [15, 30] },
  { base: "Shorts Deportivos", categoria: "ropa" as Categoria, marcas: ["Hexodus"], precios: [20, 35] },
  { base: "Leggins Deportivos", categoria: "ropa" as Categoria, marcas: ["Hexodus"], precios: [25, 40] },
  { base: "Sudadera con Capucha", categoria: "ropa" as Categoria, marcas: ["Hexodus"], precios: [35, 55] },
  { base: "Mancuernas Ajustables", categoria: "equipamiento" as Categoria, marcas: ["Universal"], precios: [80, 150] },
  { base: "Banda Elastica", categoria: "equipamiento" as Categoria, marcas: ["Hexodus", "Universal"], precios: [8, 20] },
  { base: "Colchoneta de Yoga", categoria: "equipamiento" as Categoria, marcas: ["Hexodus"], precios: [15, 30] },
  { base: "Pelota de Ejercicio", categoria: "equipamiento" as Categoria, marcas: ["Hexodus"], precios: [20, 35] },
  { base: "Botella de Agua", categoria: "bebidas" as Categoria, marcas: ["Hexodus"], precios: [5, 12] },
  { base: "Bebida Energetica", categoria: "bebidas" as Categoria, marcas: ["Cellucor", "BSN"], precios: [2, 4] },
  { base: "Bebida Isotonica", categoria: "bebidas" as Categoria, marcas: ["Cellucor"], precios: [1.5, 3] },
]

export function generateInventarioData(): Producto[] {
  const rng = seededRandom(54321)
  const productos: Producto[] = []
  let id = 1

  const variacionesSuplementos = ["300g", "500g", "1kg", "2kg"]
  const variacionesRopa = ["Talla S", "Talla M", "Talla L", "Talla XL"]
  const variacionesOtras = ["Negro", "Azul", "Rojo"]

  for (const pb of productoBases) {
    for (const marca of pb.marcas) {
      const count = Math.floor(rng() * 3) + 1
      for (let i = 0; i < count; i++) {
        if (id > 347) break

        let variacion: string
        if (pb.categoria === "suplementos") {
          variacion = variacionesSuplementos[Math.floor(rng() * variacionesSuplementos.length)]
        } else if (pb.categoria === "ropa") {
          variacion = variacionesRopa[Math.floor(rng() * variacionesRopa.length)]
        } else {
          variacion = variacionesOtras[Math.floor(rng() * variacionesOtras.length)]
        }

        const precioBase = pb.precios[0] + rng() * (pb.precios[1] - pb.precios[0])
        const precioCompra = Math.round(precioBase * 0.6 * 100) / 100
        const precioVenta = Math.round(precioBase * 100) / 100

        const stockActual = Math.floor(rng() * 100)
        const stockMinimo = Math.floor(rng() * 10) + 5

        let estadoStock: EstadoStock = "disponible"
        if (stockActual === 0) estadoStock = "agotado"
        else if (stockActual < stockMinimo) estadoStock = "bajo"

        const daysAgo = Math.floor(rng() * 30)
        const fecha = new Date(2026, 1, 22 - daysAgo)

        productos.push({
          id,
          codigo: `${pb.categoria.toUpperCase().slice(0, 3)}-${String(id).padStart(3, "0")}`,
          nombre: `${pb.base} ${marca} ${variacion}`,
          categoria: pb.categoria,
          marca,
          precioCompra,
          precioVenta,
          stockActual,
          stockMinimo,
          estadoStock,
          ubicacion: `Estante ${String.fromCharCode(65 + Math.floor(rng() * 8))}-${Math.floor(rng() * 10) + 1}`,
          descripcion: `${pb.base} de la marca ${marca}, ideal para entrenamiento.`,
          activo: rng() > 0.1,
          fechaActualizacion: fecha.toISOString(),
        })
        id++
      }
      if (id > 347) break
    }
    if (id > 347) break
  }

  return productos.sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export function formatPrecio(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatFechaCorta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
}
