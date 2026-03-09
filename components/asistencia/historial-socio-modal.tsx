"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AsistenciaService, HistorialSocioResponse } from "@/lib/services/asistencia"
import { 
  Loader2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileDown
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface HistorialSocioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  socioId: string | null
}

export function HistorialSocioModal({ open, onOpenChange, socioId }: HistorialSocioModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HistorialSocioResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)

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
    if (!socioId) return

    try {
      await AsistenciaService.exportar('excel', {
        tipo: `socio-${socioId}`
      })
    } catch (err: any) {
      console.error("Error al exportar:", err)
    }
  }

  const renderEstadisticas = () => {
    if (!data?.data?.estadisticas) return null

    const { estadisticas, asistencias } = data.data

    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Total Asistencias</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{estadisticas.total_mostradas}</p>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última Asistencia</span>
          </div>
          <p className="mt-1 text-sm font-bold">
            {new Date(estadisticas.ultima_asistencia).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </p>
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
          {data.data.asistencias.map((registro, index) => {
            const fecha = new Date(registro.timestamp)
            const tipo = registro.tipo === 'IN' ? 'permitido' : 'denegado'
            
            return (
              <div
                key={registro.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      tipo === 'permitido'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tipo === 'permitido' ? '✓' : '✗'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fecha.toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fecha.toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        {registro.metodo === 'facial' ? '👤' : '✋'}
                        {registro.metodo === 'facial' ? 'Facial' : 'Manual'}
                      </span>
                    </div>

                    {registro.confidence !== null && (
                      <div className="text-xs text-muted-foreground">
                        Confianza: {(registro.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-medium ${
                    tipo === 'permitido' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tipo === 'permitido' ? 'Entrada' : 'Salida'}
                  </span>
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial de Asistencias
            </span>
            {data && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportar}
                disabled={loading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Consulta el historial completo de asistencias del socio
          </DialogDescription>
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
