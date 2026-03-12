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
  Filter,
  Calendar,
  X,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
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
              <span className="hidden sm:inline">
                <span className="font-semibold text-foreground">{Math.min((paginaActual - 1) * registrosPorPagina + 1, totalRegistros)}</span> - <span className="font-semibold text-foreground">{Math.min(paginaActual * registrosPorPagina, totalRegistros)}</span> de <span className="font-semibold text-foreground">{totalRegistros}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de registros por página en header */}
          {onCambiarRegistrosPorPagina && totalRegistros && totalRegistros > 10 && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-muted-foreground whitespace-nowrap">Ver:</span>
              <Select
                value={String(registrosPorPagina)}
                onValueChange={(value) => onCambiarRegistrosPorPagina(Number(value))}
                disabled={loading}
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
      <div className="px-4 py-3 space-y-3 border-b border-border/50">
        {/* Fila principal de filtros */}
        <div className="flex items-center gap-3 flex-wrap">
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar socio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted border-border"
            />
          </div>
          {mostrarFiltrosAvanzados && (
            <Button
              size="sm"
              variant={mostrarFiltros ? "default" : "outline"}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="h-9 text-xs gap-2"
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
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-foreground">{formatHora(registro.timestamp)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {registro.confianza === "N/A" ? "N/A" : `${registro.confianza}% confianza`}
                </p>
              </div>
              {onVerHistorialSocio && registro.socioDbId && (
                <button
                  onClick={() => onVerHistorialSocio(String(registro.socioDbId))}
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

      {/* Paginación simplificada */}
      {paginaActual && totalPaginas && onCambiarPagina && totalPaginas > 1 && (
        <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-center">
            {/* Controles de paginación */}
            <div className="flex items-center gap-1.5">
              {/* Primera página */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(1)}
                disabled={paginaActual <= 1 || loading}
                className="h-8 w-8 p-0"
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
                className="h-8 px-3"
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
              <div className="flex md:hidden items-center justify-center px-3">
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
                className="h-8 px-3"
              >
                <span className="text-xs">Siguiente ›</span>
              </Button>

              {/* Última página */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCambiarPagina(totalPaginas)}
                disabled={paginaActual >= totalPaginas || loading}
                className="h-8 w-8 p-0"
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