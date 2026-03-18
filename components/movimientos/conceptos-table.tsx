"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import type { Concepto } from "@/lib/types/movimientos"

interface ConceptosTableProps {
  conceptos: Concepto[]
  loading?: boolean
  onNuevo?: () => void
  onEditar?: (concepto: Concepto) => void
  onEliminar?: (concepto: Concepto) => void
}

export function ConceptosTable({
  conceptos,
  loading = false,
  onNuevo,
  onEditar,
  onEliminar,
}: ConceptosTableProps) {
  const [busqueda, setBusqueda] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "ingreso" | "gasto">("todos")

  // Filtrar conceptos
  const conceptosFiltrados = useMemo(() => {
    return conceptos.filter((c) => {
      const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase())
      const coincideTipo =
        tipoFiltro === "todos" ||
        c.tipo === tipoFiltro
      return coincideBusqueda && coincideTipo
    })
  }, [conceptos, busqueda, tipoFiltro])

  // Estadísticas
  const stats = useMemo(() => {
    const ingresos = conceptos.filter((c) => c.tipo === "ingreso").length
    const gastos = conceptos.filter((c) => c.tipo === "gasto").length
    return { total: conceptos.length, ingresos, gastos }
  }, [conceptos])

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Conceptos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-2xl font-bold text-success">{stats.ingresos}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-2xl font-bold text-destructive">{stats.gastos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Búsqueda */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Filtros y acciones */}
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {/* Filtro tipo */}
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as "todos" | "ingreso" | "gasto")}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>

            {/* Botón nuevo */}
            {onNuevo && (
              <button
                onClick={onNuevo}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Concepto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Cargando conceptos...</p>
            </div>
          </div>
        ) : conceptosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                {busqueda || tipoFiltro !== "todos"
                  ? "No se encontraron conceptos con los filtros aplicados"
                  : "No hay conceptos registrados"}
              </p>
              {onNuevo && (
                <button
                  onClick={onNuevo}
                  className="text-sm text-primary hover:underline"
                >
                  Crear primer concepto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conceptosFiltrados.map((concepto) => (
                  <tr
                    key={concepto.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-muted-foreground">
                        #{concepto.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{concepto.nombre}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          concepto.tipo === "ingreso"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        {concepto.tipo === "ingreso" ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            Ingreso
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            Gasto
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {onEditar && (
                          <button
                            onClick={() => onEditar(concepto)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onEliminar && (
                          <button
                            onClick={() => onEliminar(concepto)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con contador */}
      {!loading && conceptosFiltrados.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Mostrando {conceptosFiltrados.length} de {conceptos.length} conceptos
        </div>
      )}
    </div>
  )
}
