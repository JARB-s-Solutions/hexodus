"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, DollarSign, PackageSearch, RotateCcw, Search, ShoppingBag } from "lucide-react"
import type { TopProducto } from "@/lib/types/ventas"
import { formatCurrency } from "@/lib/types/ventas"

interface VentasProductoReportProps {
  productos: TopProducto[]
  periodoLabel: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const tooltipStyle = {
  backgroundColor: "#1C1C20",
  border: "1px solid #2A2A30",
  borderRadius: "8px",
  color: "#E0E0E0",
  fontSize: "12px",
}

export function VentasProductoReport({
  productos,
  periodoLabel,
  loading = false,
  error = null,
  onRetry,
}: VentasProductoReportProps) {
  const [busquedaProducto, setBusquedaProducto] = useState("")

  const productosOrdenados = useMemo(() => {
    return [...productos].sort((a, b) => {
      if (b.cantidad_vendida !== a.cantidad_vendida) {
        return b.cantidad_vendida - a.cantidad_vendida
      }
      return b.ingreso_generado - a.ingreso_generado
    })
  }, [productos])

  const productosFiltrados = useMemo(() => {
    const query = normalizeText(busquedaProducto.trim())
    if (!query) return productosOrdenados
    return productosOrdenados.filter((producto) => normalizeText(producto.nombre).includes(query))
  }, [busquedaProducto, productosOrdenados])

  const resumen = useMemo(() => {
    return productosFiltrados.reduce(
      (acc, producto) => ({
        unidades: acc.unidades + producto.cantidad_vendida,
        ingresos: acc.ingresos + producto.ingreso_generado,
      }),
      { unidades: 0, ingresos: 0 }
    )
  }, [productosFiltrados])

  const productoMasVendido = productosFiltrados[0]
  const maxUnidades = Math.max(...productosFiltrados.map((producto) => producto.cantidad_vendida), 0)
  const chartData = productosFiltrados.slice(0, 8)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando ventas por producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isPendingDateRange = error.startsWith("Selecciona fecha inicio")

    return (
      <div
        className={`rounded-xl border p-6 ${
          isPendingDateRange
            ? "bg-card border-border"
            : "bg-destructive/10 border-destructive/20"
        }`}
      >
        <p
          className={`text-sm font-medium mb-2 ${
            isPendingDateRange ? "text-foreground" : "text-destructive"
          }`}
        >
          {isPendingDateRange ? "Selecciona el rango personalizado" : "Error al cargar ventas por producto"}
        </p>
        <p className="text-xs text-muted-foreground">{error}</p>
        {onRetry && !isPendingDateRange && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Unidades vendidas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resumen.unidades}</p>
          <p className="text-xs text-muted-foreground mt-1">{periodoLabel}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(resumen.ingresos)}</p>
          <p className="text-xs text-muted-foreground mt-1">{productosFiltrados.length} productos</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Producto lider</span>
          </div>
          <p className="text-lg font-bold text-foreground truncate">{productoMasVendido?.nombre ?? "Sin ventas"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {productoMasVendido ? `${productoMasVendido.cantidad_vendida} unidades` : "0 unidades"}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Ventas por producto</h2>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busquedaProducto}
              onChange={(event) => setBusquedaProducto(event.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No hay productos vendidos con los filtros actuales.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="h-72 rounded-lg border border-border/60 bg-background/35 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} stroke="#2A2A30" />
                  <YAxis
                    dataKey="nombre"
                    type="category"
                    width={120}
                    tick={{ fill: "#A0A0A0", fontSize: 10 }}
                    stroke="#2A2A30"
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === "cantidad_vendida") return [value, "Unidades"]
                      return [formatCurrency(value), "Ingresos"]
                    }}
                  />
                  <Bar dataKey="cantidad_vendida" fill="#00BFFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 font-semibold">Producto</th>
                    <th className="pb-3 font-semibold text-right">Unidades</th>
                    <th className="pb-3 font-semibold text-right">Ingresos</th>
                    <th className="pb-3 font-semibold pl-6">Participacion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productosFiltrados.map((producto) => {
                    const porcentaje = maxUnidades > 0 ? (producto.cantidad_vendida / maxUnidades) * 100 : 0

                    return (
                      <tr key={producto.nombre} className="text-sm">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{producto.nombre}</p>
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground">
                          {producto.cantidad_vendida}
                        </td>
                        <td className="py-3 text-right font-semibold text-success">
                          {formatCurrency(producto.ingreso_generado)}
                        </td>
                        <td className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-2 min-w-28 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.max(8, porcentaje)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs text-muted-foreground">
                              {porcentaje.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
