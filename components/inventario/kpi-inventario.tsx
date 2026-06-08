"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle, DollarSign, FolderOpen, TrendingUp } from "lucide-react"
import type { ProductoExtendido } from "@/lib/types/productos"

interface KpiInventarioProps {
  productos: ProductoExtendido[]
}

const KPI_VISIBILITY_STORAGE_KEY = "hexodus:inventario:kpis-visible"

export function KpiInventario({ productos }: KpiInventarioProps) {
  const [kpisVisibles, setKpisVisibles] = useState(false)

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY)
      if (storedValue !== null) {
        setKpisVisibles(storedValue === "true")
      }
    } catch (error) {
      console.error("Error al leer la visibilidad de KPIs de inventario:", error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, String(kpisVisibles))
    } catch (error) {
      console.error("Error al guardar la visibilidad de KPIs de inventario:", error)
    }
  }, [kpisVisibles])

  const activos = productos.filter((p) => p.activo)
  const stockBajo = activos.filter((p) => p.stockActual > 0 && p.stockActual <= p.stockMinimo).length
  const valorTotal = activos.reduce((sum, p) => sum + p.precioVenta * p.stockActual, 0)
  const categorias = new Set(activos.map((p) => p.categoria)).size

  const cards = [
    {
      label: "Total Productos",
      value: activos.length.toString(),
      sub: "+23 este mes",
      subColor: "text-[#22C55E]",
      icon: Package,
      accent: "text-accent",
      iconBg: "bg-accent/15",
    },
    {
      label: "Stock Bajo",
      value: stockBajo.toString(),
      sub: "Requieren reabastecimiento",
      subColor: "text-[#EF4444]",
      icon: AlertTriangle,
      accent: "text-primary",
      iconBg: "bg-primary/15",
    },
    {
      label: "Valor Total",
      value: `$${Math.round(valorTotal).toLocaleString("es-MX")}`,
      sub: "Inventario completo",
      subColor: "text-muted-foreground",
      icon: DollarSign,
      accent: "text-primary",
      iconBg: "bg-primary/15",
    },
    {
      label: "Categorias",
      value: categorias.toString(),
      sub: "Tipos de productos",
      subColor: "text-[#FBB424]",
      icon: FolderOpen,
      accent: "text-accent",
      iconBg: "bg-accent/15",
    },
  ]

  return (
    <section
      className="bg-card rounded-xl border border-border p-3 shadow-sm"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">KPIs de inventario</h2>
          <p className="text-xs text-muted-foreground">
            Controla si los indicadores de productos y valor de inventario se muestran en pantalla.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Visibilidad
          </span>
          <select
            value={kpisVisibles ? "mostrar" : "ocultar"}
            onChange={(e) => setKpisVisibles(e.target.value === "mostrar")}
            className="min-w-[160px] pl-3 pr-8 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px] bg-[right_0.5rem_center] bg-no-repeat"
            aria-label="Visibilidad de KPIs de inventario"
          >
            <option value="mostrar">Mostrar KPIs</option>
            <option value="ocultar">Ocultar KPIs</option>
          </select>
        </div>
      </div>

      {kpisVisibles ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-card rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] group"
              style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wide ${c.accent}`}>
                  {c.label}
                </span>
                <div className={`p-2 rounded-lg ${c.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <c.icon className={`h-5 w-5 ${c.accent}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{c.value}</p>
              <span className={`text-xs flex items-center gap-1 ${c.subColor}`}>
                {c.subColor === "text-[#22C55E]" && <TrendingUp className="h-3 w-3" />}
                {c.sub}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          Los KPIs de inventario están ocultos. Cambia la visibilidad para mostrarlos cuando lo necesites.
        </div>
      )}
    </section>
  )
}
