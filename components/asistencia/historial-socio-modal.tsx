"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Button } from "@/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Badge } from "@/ui/badge"
import { ScrollArea } from "@/ui/scroll-area"
import { Separator } from "@/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"
import { AsistenciaService, HistorialSocioResponse } from "@/lib/services/asistencia"
import { formatConfidencePercent, getMetodoRegistroLabel } from "@/lib/asistencia-data"
import {
  exportarAsistenciasArchivo,
  getNombreArchivoHistorialSocio,
  type FormatoExportacionAsistencias,
} from "@/lib/export-asistencias"
import { 
  Loader2, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileDown
} from "lucide-react"

interface HistorialSocioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  socioId: string | null
  canExportar?: boolean
}

export function HistorialSocioModal({
  open,
  onOpenChange,
  socioId,
  canExportar = true,
}: HistorialSocioModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HistorialSocioResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [formatoExportacion, setFormatoExportacion] = useState<FormatoExportacionAsistencias>("XLSX")

  // Cargar historial cuando se abre el modal
  useEffect(() => {
    if (open && socioId) {
      cargarHistorial()
    } else {
      // Resetear al cerrar
      setData(null)
      setError(null)
      setPaginaActual(1)
    }
  }, [open, socioId, paginaActual])

  const cargarHistorial = async () => {
    if (!socioId) return

    try {
      setLoading(true)
      setError(null)

      const response = await AsistenciaService.obtenerHistorialSocio(socioId, {
        limite: 20,
        pagina: paginaActual,
      })

      if (response.success) {
        setData(response)
      } else {
        setError("No se pudo cargar el historial")
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el historial")
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    if (!data?.data?.socio || !data?.data?.asistencias?.length) return

    const socio = data.data.socio
    exportarAsistenciasArchivo({
      registros: data.data.asistencias.map((registro) => ({
        timestamp: registro.timestamp,
        nombreSocio: socio.nombreCompleto,
        socioId: socio.codigoSocio,
        tipo: registro.tipo,
        metodoRegistro: getMetodoRegistroLabel(registro.metodo),
        confianza: registro.confidence !== null ? formatConfidencePercent(registro.confidence, 1) : "N/A",
        motivo: "Historial de socio",
      })),
      formato: formatoExportacion,
      nombreArchivoBase: getNombreArchivoHistorialSocio(socio.codigoSocio),
      titulo: "Historial de Asistencias por Socio",
      metadata: [
        ["Socio", socio.nombreCompleto],
        ["Codigo", socio.codigoSocio],
      ],
    })
  }

  const renderEstadisticas = () => {
    if (!data?.data?.estadisticas) return null

    const { estadisticas } = data.data
    const ultimaAsistencia = new Date(estadisticas.ultima_asistencia)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-card/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Total Asistencias
              </p>
              <p className="mt-2 text-3xl leading-none font-bold text-foreground">{estadisticas.total_mostradas}</p>
              <p className="mt-2 text-xs text-muted-foreground">Registros encontrados</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-card/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Última Asistencia
              </p>
              <p className="mt-2 text-xl leading-tight font-semibold text-foreground">
                {ultimaAsistencia.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ultimaAsistencia.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderHistorial = () => {
    if (!data?.data?.asistencias || data.data.asistencias.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No hay registros de asistencias
          </p>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {data.data.asistencias.map((registro) => {
            const fecha = new Date(registro.timestamp)
            const tipo = registro.tipo === 'IN' ? 'permitido' : 'denegado'
            const metodoLabel = getMetodoRegistroLabel(registro.metodo)
            
            return (
              <div
                key={registro.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-gradient-to-br from-card to-card/80 p-3.5 hover:border-accent/40 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      tipo === 'permitido'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {tipo === 'permitido' ? '✓' : '✗'}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {fecha.toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={`h-5 px-2 text-[10px] font-medium ${
                          tipo === 'permitido'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            : 'border-red-500/40 text-red-400 bg-red-500/10'
                        }`}
                      >
                        {tipo === 'permitido' ? 'Entrada' : 'Salida'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fecha.toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        {metodoLabel === 'Facial' ? '👤' : metodoLabel === 'Huella' ? '🖐️' : '✋'}
                        {metodoLabel}
                      </span>
                    </div>

                    {registro.confidence !== null && (
                      <div className="text-xs text-muted-foreground">
                        Confianza: {formatConfidencePercent(registro.confidence, 1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">Registro</p>
                  <p className={`text-xs font-semibold ${tipo === 'permitido' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tipo === 'permitido' ? 'Permitido' : 'Denegado'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    )
  }

  const renderPaginacion = () => {
    // La nueva estructura del API no incluye paginación, mostrar todos los resultados
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,880px)] max-w-[min(94vw,880px)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="space-y-3 pb-2 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de Asistencias
              </DialogTitle>
              <DialogDescription className="mt-1">
                Consulta el historial completo de asistencias del socio
              </DialogDescription>
            </div>
          </div>

          {data && canExportar && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Exportar historial</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                <Select
                  value={formatoExportacion}
                  onValueChange={(value) => setFormatoExportacion(value as FormatoExportacionAsistencias)}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[250px] text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XLSX">Excel (.xlsx) - Recomendado</SelectItem>
                    <SelectItem value="PDF">PDF (imprimible)</SelectItem>
                    <SelectItem value="CSV">CSV (avanzado)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportar}
                  disabled={loading}
                  className="sm:min-w-[160px] justify-center"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {formatoExportacion === "XLSX" && "Exportar Excel"}
                  {formatoExportacion === "PDF" && "Exportar PDF"}
                  {formatoExportacion === "CSV" && "Exportar CSV"}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Excel para editar, PDF para imprimir y CSV para uso avanzado.
              </p>
            </div>
          )}
        </DialogHeader>

        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {data && !error && (
          <div className="space-y-6">
            {/* Información del socio */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={data.data.socio.fotoUrl || undefined} alt={data.data.socio.nombreCompleto} />
                <AvatarFallback className="text-lg">
                  {data.data.socio.nombreCompleto.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{data.data.socio.nombreCompleto}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{data.data.socio.codigoSocio}</Badge>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            {renderEstadisticas()}

            <Separator />

            {/* Historial de registros */}
            <div>
              <h4 className="mb-3 font-medium flex items-center justify-between">
                <span>Registros Recientes</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </h4>
              {renderHistorial()}
            </div>

            {/* Paginación */}
            {renderPaginacion()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
