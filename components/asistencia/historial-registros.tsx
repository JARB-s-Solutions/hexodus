"use client"

import { useState, useMemo } from "react"
import {
  History,
  Download,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  User,
  Filter,
  Calendar,
  X,
} from "lucide-react"
import { Input } from "@/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"
import { Button } from "@/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Badge } from "@/ui/badge"
import type { RegistroAcceso } from "@/lib/asistencia-data"
import { formatHora } from "@/lib/asistencia-data"
import {
  exportarRegistrosAsistencia,
  type FormatoExportacionAsistencias,
} from "@/lib/export-asistencias"

interface Props {
  registros: RegistroAcceso[]
  onLimpiar: () => void
  loading?: boolean
  error?: string | null
  onRecargar?: () => void
  canExportar?: boolean
  onVerHistorialSocio?: (socioId: string) => void
  // Props para paginación (solo para historial completo)
  paginaActual?: number
  totalPaginas?: number
  totalRegistros?: number
  registrosPorPagina?: number
  onCambiarPagina?: (pagina: number) => void
  onCambiarRegistrosPorPagina?: (cantidad: number) => void
  // Props para filtros avanzados (solo para historial completo)
  mostrarFiltrosAvanzados?: boolean
  filtroMetodo?: string
  fechaInicio?: string
  fechaFin?: string
  onCambiarFiltroMetodo?: (metodo: string) => void
  onCambiarFechaInicio?: (fecha: string) => void
  onCambiarFechaFin?: (fecha: string) => void
  onAplicarFiltros?: () => void
  onLimpiarFiltros?: () => void
}

export function HistorialRegistros({ 
  registros, 
  onLimpiar, 
  loading = false,
  error = null,
  onRecargar,
  canExportar = true,
  onVerHistorialSocio,
  paginaActual,
  totalPaginas,
  totalRegistros,
  registrosPorPagina = 50,
  onCambiarPagina,
  onCambiarRegistrosPorPagina,
  mostrarFiltrosAvanzados = false,
  filtroMetodo,
  fechaInicio,
  fechaFin,
  onCambiarFiltroMetodo,
  onCambiarFechaInicio,
  onCambiarFechaFin,
  onAplicarFiltros,
  onLimpiarFiltros,
}: Props) {
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [formatoExportacion, setFormatoExportacion] = useState<FormatoExportacionAsistencias>("XLSX")

  // Calcular si hay filtros activos
  const hayFiltrosActivos = filtroMetodo !== "todos" || fechaInicio || fechaFin

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
      <div className="space-y-3 border-b border-border p-3 pb-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
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
            {/* Info de paginación en header */}
            {paginaActual && totalPaginas && totalRegistros && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">•</span>
                <span>
                  <span className="font-semibold text-foreground">{Math.min((paginaActual - 1) * registrosPorPagina + 1, totalRegistros)}</span> - <span className="font-semibold text-foreground">{Math.min(paginaActual * registrosPorPagina, totalRegistros)}</span> de <span className="font-semibold text-foreground">{totalRegistros}</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Selector de registros por página en header */}
            {onCambiarRegistrosPorPagina && totalRegistros && totalRegistros > 10 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="whitespace-nowrap text-muted-foreground">Ver:</span>
                <Select
                  value={String(registrosPorPagina)}
                  onValueChange={(value) => onCambiarRegistrosPorPagina(Number(value))}
                  disabled={loading}
                >
                  <SelectTrigger className="h-8 w-[70px] text-xs md:h-7">
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
            {onRecargar && (
              <button
                onClick={onRecargar}
                disabled={loading}
                className="flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:px-3"
                title="Recargar datos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {canExportar && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2.5 lg:flex-row lg:items-center lg:justify-between">
            <p className="hidden px-1 text-[11px] text-muted-foreground sm:block">
              Exporta en el formato adecuado para compartir o imprimir.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <Select
                value={formatoExportacion}
                onValueChange={(value) => setFormatoExportacion(value as FormatoExportacionAsistencias)}
                disabled={loading}
              >
                <SelectTrigger className="h-11 w-full bg-background text-sm sm:h-8 sm:w-[230px] sm:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XLSX">Excel (.xlsx) - Recomendado</SelectItem>
                  <SelectItem value="PDF">PDF (imprimible)</SelectItem>
                  <SelectItem value="CSV">CSV (avanzado)</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() =>
                  exportarRegistrosAsistencia({
                    registros: registrosFiltrados,
                    formato: formatoExportacion,
                  })
                }
                disabled={loading || registrosFiltrados.length === 0}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:min-w-[142px] sm:py-1.5 sm:text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                {formatoExportacion === "XLSX" && "Exportar Excel"}
                {formatoExportacion === "PDF" && "Exportar PDF"}
                {formatoExportacion === "CSV" && "Exportar CSV"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 border-b border-border/50 px-3 py-3 md:px-4">
        {/* Fila principal de filtros */}
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-11 w-full border-border bg-muted text-sm sm:h-9 sm:w-[180px] sm:text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los registros</SelectItem>
              <SelectItem value="permitido">Accesos permitidos</SelectItem>
              <SelectItem value="denegado">Accesos denegados</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar socio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-11 bg-muted pl-9 text-sm sm:h-9 sm:text-xs"
            />
          </div>
          {mostrarFiltrosAvanzados && (
            <Button
              size="sm"
              variant={mostrarFiltros ? "default" : "outline"}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="h-11 gap-2 text-sm sm:h-9 sm:text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros avanzados
              {hayFiltrosActivos && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                  {[filtroMetodo !== "todos", fechaInicio, fechaFin].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltrosAvanzados && mostrarFiltros && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border/50 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                Filtros Avanzados
              </h4>
              {hayFiltrosActivos && onLimpiarFiltros && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onLimpiarFiltros}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filtro de método */}
              {onCambiarFiltroMetodo && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Método de registro
                  </label>
                  <Select 
                    value={filtroMetodo || "todos"} 
                    onValueChange={onCambiarFiltroMetodo}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los métodos</SelectItem>
                      <SelectItem value="huella">Huella dactilar</SelectItem>
                      <SelectItem value="facial">Reconocimiento facial</SelectItem>
                      <SelectItem value="manual">Registro manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro de fecha inicio */}
              {onCambiarFechaInicio && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha inicio
                  </label>
                  <Input
                    type="date"
                    value={fechaInicio || ""}
                    onChange={(e) => onCambiarFechaInicio(e.target.value)}
                    className="h-9 text-xs bg-background"
                    max={fechaFin || undefined}
                  />
                </div>
              )}

              {/* Filtro de fecha fin */}
              {onCambiarFechaFin && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha fin
                  </label>
                  <Input
                    type="date"
                    value={fechaFin || ""}
                    onChange={(e) => onCambiarFechaFin(e.target.value)}
                    className="h-9 text-xs bg-background"
                    min={fechaInicio || undefined}
                  />
                </div>
              )}
            </div>

            {/* Botón aplicar filtros */}
            {onAplicarFiltros && (
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={onAplicarFiltros}
                  disabled={loading}
                  className="h-8 text-xs px-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Filter className="h-3 w-3 mr-1.5" />
                      Aplicar filtros
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Records list */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4 md:px-4" style={{ maxHeight: "520px" }}>
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
            className={`flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-3 border-l-3 transition-all hover:bg-muted/70 md:items-center ${
              registro.tipo === "permitido"
                ? "border-l-success"
                : "border-l-destructive"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Avatar con foto de perfil */}
              <Avatar className="h-9 w-9 border-2 border-border transition-colors">
                <AvatarImage src={registro.fotoUrl || undefined} alt={registro.nombreSocio} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {registro.tipo === "permitido" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {registro.nombreSocio}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{registro.motivo}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="text-right">
                <p className="text-xs text-foreground">{formatHora(registro.timestamp)}</p>
                <p className="max-w-[7rem] truncate text-[11px] text-muted-foreground">
                  {registro.confianza === "N/A" ? "N/A" : `${registro.confianza}% confianza`}
                </p>
              </div>
              {onVerHistorialSocio && registro.socioDbId && (
                <button
                  onClick={() => onVerHistorialSocio(String(registro.socioDbId))}
                  className="rounded-md p-1.5 transition-colors hover:bg-muted"
                  title="Ver historial del socio"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación simplificada */}
      {paginaActual && totalPaginas && onCambiarPagina && totalPaginas > 1 && (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-3 md:px-4">
          <div className="flex items-center justify-center">
            {/* Controles de paginación */}
            <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-center">
              {/* Primera página */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(1)}
                disabled={paginaActual <= 1 || loading}
                className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                title="Primera página"
              >
                <span className="text-xs">‹‹</span>
              </Button>

              {/* Página anterior */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(paginaActual - 1)}
                disabled={paginaActual <= 1 || loading}
                className="h-9 px-3 sm:h-8"
              >
                <span className="text-xs">‹ Anterior</span>
              </Button>
              
              {/* Números de página */}
              <div className="hidden md:flex items-center gap-1">
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

              {/* Indicador móvil */}
              <div className="flex items-center justify-center px-2 md:hidden">
                <span className="text-xs font-medium text-foreground">
                  {paginaActual} / {totalPaginas}
                </span>
              </div>
              
              {/* Página siguiente */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas || loading}
                className="h-9 px-3 sm:h-8"
              >
                <span className="text-xs">Siguiente ›</span>
              </Button>

              {/* Última página */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(totalPaginas)}
                disabled={paginaActual >= totalPaginas || loading}
                className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                title="Última página"
              >
                <span className="text-xs">››</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
