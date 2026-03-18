"use client"

import { useState, useCallback, useEffect } from "react"
import { UserCheck, RefreshCw, LogIn, LogOut, User, Clock, TrendingUp, Users, Activity } from "lucide-react"
import { AsistenciaService, AsistenciasHoyResponse } from "@/lib/services/asistencia"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"

export function VisitantesCard() {
  const [data, setData] = useState<AsistenciasHoyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarAsistencias = useCallback(async () => {
    try {
      setError(null)
      const response = await AsistenciaService.obtenerAsistenciasHoy()
      setData(response)
    } catch (err) {
      console.error('Error al cargar asistencias:', err)
      setError('Error al cargar las asistencias del día')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setSpinning(true)
    await cargarAsistencias()
    setTimeout(() => setSpinning(false), 600)
  }, [cargarAsistencias])

  useEffect(() => {
    cargarAsistencias()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(cargarAsistencias, 30000)
    return () => clearInterval(interval)
  }, [cargarAsistencias])

  const asistencias = data?.data?.asistencias || []
  const resumen = data?.data?.resumen

  return (
    <div
      className="bg-card rounded-xl p-6 animate-fade-in-up border border-border/50"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-3 text-foreground">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          Asistencias de Hoy
        </h3>
        <div className="flex items-center gap-3">
          {!loading && resumen && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Activity className="h-3 w-3 mr-1" />
                {resumen.total_asistencias} total
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hidden sm:flex">
                <Users className="h-3 w-3 mr-1" />
                {resumen.socios_activos_ahora} activos
              </Badge>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-muted transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Refrescar"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-muted-foreground transition-all duration-300",
                spinning && "animate-spin text-primary"
              )}
            />
          </button>
        </div>
      </div>

      {/* Estadísticas Resumen */}
      {!loading && resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <LogIn className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Entradas</span>
            </div>
            <p className="text-xl font-bold text-foreground">{resumen.entradas}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-orange-500/10">
                <LogOut className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Salidas</span>
            </div>
            <p className="text-xl font-bold text-foreground">{resumen.salidas}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Activos</span>
            </div>
            <p className="text-xl font-bold text-foreground">{resumen.socios_activos_ahora}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Confianza</span>
            </div>
            <p className="text-xl font-bold text-foreground">{resumen.promedio_confidence.toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-3">
            <Activity className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-primary hover:underline font-medium"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && asistencias.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No hay asistencias registradas</p>
          <p className="text-xs text-muted-foreground">Las asistencias del día aparecerán aquí</p>
        </div>
      )}

      {/* Lista de Asistencias */}
      {!loading && !error && asistencias.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {asistencias.map((asistencia) => {
            const isEntrada = asistencia.tipo === 'IN'
            const isFacial = asistencia.metodo === 'facial'
            
            return (
              <div
                key={asistencia.id}
                className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={asistencia.foto_perfil_url} alt={asistencia.socio_nombre} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {asistencia.socio_nombre}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        isFacial 
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                          : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      )}
                    >
                      {isFacial ? "facial" : "manual"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{asistencia.hora}</span>
                    <span className="text-[10px]">•</span>
                    <span className="text-[10px] font-mono">{asistencia.codigo_socio}</span>
                  </div>
                </div>

                {/* Badge Tipo */}
                <Badge 
                  className={cn(
                    "font-semibold text-xs shadow-sm",
                    isEntrada 
                      ? "bg-emerald-500/90 hover:bg-emerald-500 text-white border-emerald-600" 
                      : "bg-orange-500/90 hover:bg-orange-500 text-white border-orange-600"
                  )}
                >
                  {isEntrada ? (
                    <>
                      <LogIn className="h-3 w-3 mr-1" />
                      Entrada
                    </>
                  ) : (
                    <>
                      <LogOut className="h-3 w-3 mr-1" />
                      Salida
                    </>
                  )}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
