"use client"

import { useState } from "react"
import { 
  Eye, 
  Pencil, 
  Trash2, 
  Package, 
  AlertCircle,
  CheckCircle2,
  XCircle 
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Categoria } from "@/lib/types/categorias"
import { CategoriasService } from "@/lib/services/categorias"

interface CategoriasTableProps {
  categorias: Categoria[]
  onEditar: (categoria: Categoria) => void
  onEliminar: (categoria: Categoria) => void
  onVerProductos: (categoria: Categoria) => void
}

export function CategoriasTable({ 
  categorias, 
  onEditar, 
  onEliminar,
  onVerProductos 
}: CategoriasTableProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  if (categorias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No hay categorías
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Comienza creando tu primera categoría para organizar mejor tu inventario
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Prefijo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Productos
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categorias.map((categoria) => (
              <tr
                key={categoria.id}
                onMouseEnter={() => setHoveredId(categoria.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="hover:bg-muted/30 transition-colors"
              >
                {/* Categoría con color */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${categoria.color}20` }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: categoria.color }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {categoria.nombre}
                      </div>
                      {categoria.descripcion && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {categoria.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Prefijo */}
                <td className="px-6 py-4">
                  <div
                    className="inline-flex items-center px-3 py-1 rounded-md font-mono text-xs font-semibold"
                    style={{
                      backgroundColor: `${categoria.color}15`,
                      color: categoria.color,
                    }}
                  >
                    {categoria.prefijo}
                  </div>
                </td>

                {/* Productos */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => onVerProductos(categoria)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group"
                  >
                    <Package className="h-4 w-4" />
                    <span className="font-medium">
                      {categoria.totalProductos || 0}
                    </span>
                    <span className="text-xs group-hover:underline">
                      productos
                    </span>
                  </button>
                </td>

                {/* Estado */}
                <td className="px-6 py-4">
                  {categoria.estado === "activa" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Activa
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      <XCircle className="h-3 w-3" />
                      Inactiva
                    </div>
                  )}
                </td>

                {/* Descripción (oculta en móvil) */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {categoria.descripcion || 
                      <span className="italic">Sin descripción</span>
                    }
                  </p>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onVerProductos(categoria)}
                      className="p-2 rounded-lg bg-muted hover:bg-accent/10 hover:text-accent transition-all"
                      title="Ver productos"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditar(categoria)}
                      className="p-2 rounded-lg bg-muted hover:bg-accent/10 hover:text-accent transition-all"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEliminar(categoria)}
                      className="p-2 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
