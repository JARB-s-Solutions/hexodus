"use client"

import { Package, AlertTriangle, DollarSign, FolderOpen, TrendingUp } from "lucide-react"
import type { ProductoExtendido } from "@/lib/types/productos"

interface KpiInventarioProps {
  productos: ProductoExtendido[]
}

export function KpiInventario({ productos }: KpiInventarioProps) {
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
  )
}
