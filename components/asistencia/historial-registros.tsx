"use client"

import { useState, useMemo } from "react"
import {
  History,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RegistroAcceso } from "@/lib/asistencia-data"
import { formatHora, exportRegistrosCSV } from "@/lib/asistencia-data"

interface Props {
  registros: RegistroAcceso[]
  onLimpiar: () => void
}

export function HistorialRegistros({ registros, onLimpiar }: Props) {
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [busqueda, setBusqueda] = useState("")

  const registrosFiltrados = useMemo(() => {
    let filtered = [...registros]

    if (filtroTipo !== "todos") {
      filtered = filtered.filter((r) => r.tipo === filtroTipo)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.nombreSocio.toLowerCase().includes(q) ||
          r.socioId.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [registros, filtroTipo, busqueda])

  return (
    <div
      className="bg-card rounded-xl border border-border flex flex-col h-full"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          Registros de Hoy
          <span className="text-xs text-muted-foreground font-normal ml-1">
            ({registrosFiltrados.length})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportRegistrosCSV(registrosFiltrados)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
          <button
            onClick={onLimpiar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los registros</SelectItem>
            <SelectItem value="permitido">Accesos permitidos</SelectItem>
            <SelectItem value="denegado">Accesos denegados</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar socio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted border-border"
          />
        </div>
      </div>

      {/* Records list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ maxHeight: "520px" }}>
        {registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay registros que coincidan</p>
          </div>
        ) : (
          registrosFiltrados.map((registro) => (
            <div
              key={registro.id}
              className={`flex items-center justify-between p-3 rounded-lg bg-muted/40 border-l-3 transition-all hover:bg-muted/70 ${
                registro.tipo === "permitido"
                  ? "border-l-success"
                  : "border-l-destructive"
              }`}
            >
              <div className="flex items-center gap-3">
                {registro.tipo === "permitido" ? (
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {registro.nombreSocio}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{registro.motivo}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-foreground">{formatHora(registro.timestamp)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {registro.confianza}% confianza
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}