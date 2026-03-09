"use client"

import { useState, useMemo } from "react"
import {
  History,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { RegistroAcceso } from "@/lib/asistencia-data"
import { formatHora, exportRegistrosCSV } from "@/lib/asistencia-data"

interface Props {
  registros: RegistroAcceso[]
  onLimpiar: () => void
  loading?: boolean
  error?: string | null
  onRecargar?: () => void
  onVerHistorialSocio?: (socioId: string) => void
  // Props para paginación (solo para historial completo)
  paginaActual?: number
  totalPaginas?: number
  totalRegistros?: number
  registrosPorPagina?: number
  onCambiarPagina?: (pagina: number) => void
  onCambiarRegistrosPorPagina?: (cantidad: number) => void
}

export function HistorialRegistros({ 
  registros, 
  onLimpiar, 
  loading = false,
  error = null,
  onRecargar,
  onVerHistorialSocio,
  paginaActual,
  totalPaginas,
  totalRegistros,
  registrosPorPagina = 50,
  onCambiarPagina,
  onCambiarRegistrosPorPagina,
}: Props) {
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
          Registros
          <span className="text-xs text-muted-foreground font-normal ml-1">
            ({registrosFiltrados.length})
          </span>
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </h3>
        <div className="flex items-center gap-2">
          {onRecargar && (
            <button
              onClick={onRecargar}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Recargar datos"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => exportRegistrosCSV(registrosFiltrados)}
            disabled={loading || registrosFiltrados.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent border border-accent/30 hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
          <button
            onClick={onLimpiar}
            disabled={loading || registros.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error al cargar registros</p>
                <p className="text-xs mt-1 text-destructive/80">{error}</p>
              </div>
              {onRecargar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRecargar}
                  disabled={loading}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}

        {loading && registros.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-10 w-10 mb-3 animate-spin opacity-50" />
            <p className="text-sm">Cargando registros...</p>
          </div>
        )}

        {!loading && !error && registrosFiltrados.length === 0 && registros.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay registros de asistencia hoy</p>
            <p className="text-xs mt-1">Los registros aparecerán aquí automáticamente</p>
          </div>
        )}

        {!loading && !error && registrosFiltrados.length === 0 && registros.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay registros que coincidan con tu búsqueda</p>
          </div>
        )}

        {registrosFiltrados.length > 0 && registrosFiltrados.map((registro) => (
          <div
            key={registro.id}
            className={`flex items-center justify-between p-3 rounded-lg bg-muted/40 border-l-3 transition-all hover:bg-muted/70 ${
              registro.tipo === "permitido"
                ? "border-l-success"
                : "border-l-destructive"
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {registro.tipo === "permitido" ? (
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {registro.nombreSocio}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{registro.motivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-foreground">{formatHora(registro.timestamp)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {registro.confianza === "N/A" ? "N/A" : `${registro.confianza}% confianza`}
                </p>
              </div>
              {onVerHistorialSocio && (
                <button
                  onClick={() => onVerHistorialSocio(registro.socioId)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Ver historial del socio"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación y selector de registros por página */}
      {(paginaActual || onCambiarRegistrosPorPagina) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {paginaActual && totalPaginas && (
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-foreground">
                  Página {paginaActual} de {totalPaginas}
                </div>
                {totalRegistros && (
                  <div className="text-xs text-muted-foreground">
                    Mostrando {Math.min((paginaActual - 1) * registrosPorPagina + 1, totalRegistros)} - {Math.min(paginaActual * registrosPorPagina, totalRegistros)} de {totalRegistros} registros
                  </div>
                )}
              </div>
            )}
            
            {/* Selector de registros por página */}
            {onCambiarRegistrosPorPagina && (
              <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border">
                <span className="text-xs font-medium text-foreground whitespace-nowrap">Mostrar:</span>
                <Select
                  value={String(registrosPorPagina)}
                  onValueChange={(value) => onCambiarRegistrosPorPagina(Number(value))}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {paginaActual && totalPaginas && onCambiarPagina && totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(1)}
                disabled={paginaActual <= 1 || loading}
                className="h-8 px-2 text-xs"
                title="Primera página"
              >
                ‹‹
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(paginaActual - 1)}
                disabled={paginaActual <= 1 || loading}
                className="h-8 px-3 text-xs"
              >
                ‹ Anterior
              </Button>
              
              {/* Números de página */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum: number
                  if (totalPaginas <= 5) {
                    pageNum = i + 1
                  } else if (paginaActual <= 3) {
                    pageNum = i + 1
                  } else if (paginaActual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i
                  } else {
                    pageNum = paginaActual - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={paginaActual === pageNum ? "default" : "outline"}
                      onClick={() => onCambiarPagina(pageNum)}
                      disabled={loading}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas || loading}
                className="h-8 px-3 text-xs"
              >
                Siguiente ›
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(totalPaginas)}
                disabled={paginaActual >= totalPaginas || loading}
                className="h-8 px-2 text-xs"
                title="Última página"
              >
                ››
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}