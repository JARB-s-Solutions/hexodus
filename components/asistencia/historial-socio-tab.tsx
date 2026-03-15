"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, User, Calendar, TrendingUp } from "lucide-react"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { SociosService } from "@/lib/services/socios"
import { AsistenciaService } from "@/lib/services/asistencia"
import type { HistorialSocioResponse } from "@/lib/services/asistencia"

interface HistorialSocioTabProps {
  onError?: (mensaje: string) => void
}

export function HistorialSocioTab({ onError }: HistorialSocioTabProps) {
  // Estados de búsqueda
  const [busqueda, setBusqueda] = useState("")
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Array<{
    id: number
    nombre: string
    codigo: string
    foto?: string
    membresia?: string
  }>>([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const busquedaTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Estados de socio seleccionado
  const [socioSeleccionado, setSocioSeleccionado] = useState<{
    id: string
    nombre: string
    codigo: string
    foto: string | null
  } | null>(null)
  const [historialData, setHistorialData] = useState<HistorialSocioResponse | null>(null)
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Búsqueda de socios con debounce
  useEffect(() => {
    if (busquedaTimeoutRef.current) {
      clearTimeout(busquedaTimeoutRef.current)
    }

    if (!busqueda || busqueda.trim().length < 2) {
      setResultadosBusqueda([])
      setMostrarResultados(false)
      return
    }

    busquedaTimeoutRef.current = setTimeout(async () => {
      try {
        setBuscando(true)
        const resultados = await SociosService.buscar(busqueda)
        setResultadosBusqueda(resultados)
        setMostrarResultados(true)
      } catch (error) {
        console.error('[HistorialSocio] Error en búsqueda:', error)
        setResultadosBusqueda([])
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => {
      if (busquedaTimeoutRef.current) {
        clearTimeout(busquedaTimeoutRef.current)
      }
    }
  }, [busqueda])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setMostrarResultados(false)
    if (mostrarResultados) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [mostrarResultados])

  const handleSeleccionarSocio = async (socio: typeof resultadosBusqueda[0]) => {
    try {
      setLoadingHistorial(true)
      setBusqueda(socio.nombre)
      setMostrarResultados(false)

      const data = await AsistenciaService.obtenerHistorialSocio(String(socio.id))
      
      // Actualizar socio seleccionado con los datos del API
      if (data.success && data.data.socio) {
        setSocioSeleccionado({
          id: String(data.data.socio.id),
          nombre: data.data.socio.nombreCompleto,
          codigo: data.data.socio.codigoSocio,
          foto: data.data.socio.fotoUrl
        })
      }
      
      setHistorialData(data)
    } catch (error) {
      console.error('[HistorialSocio] Error al obtener historial:', error)
      onError?.('Error al cargar el historial del socio')
    } finally {
      setLoadingHistorial(false)
    }
  }

  const handleLimpiarBusqueda = () => {
    setBusqueda("")
    setSocioSeleccionado(null)
    setHistorialData(null)
    setResultadosBusqueda([])
    setMostrarResultados(false)
  }

  const obtenerIniciales = (nombre: string) => {
    return nombre
      ? nombre.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??'
  }

  return (
    <div className="space-y-4">
      {/* Buscador de Socios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Socio
          </CardTitle>
          <CardDescription>
            Ingresa el nombre o código del socio para ver su historial de asistencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => busqueda.length >= 2 && setMostrarResultados(true)}
                className="pl-9 pr-9"
              />
              {busqueda && (
                <button
                  onClick={handleLimpiarBusqueda}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Resultados de Búsqueda */}
            {mostrarResultados && (
              <div className="absolute z-50 w-full mt-2 bg-card border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {buscando ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : resultadosBusqueda.length > 0 ? (
                  <div className="p-2">
                    {resultadosBusqueda.map((socio) => (
                      <button
                        key={socio.id}
                        onClick={() => handleSeleccionarSocio(socio)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={socio.foto} alt={socio.nombre} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {obtenerIniciales(socio.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{socio.nombre}</p>
                          <p className="text-sm text-muted-foreground">{socio.codigo}</p>
                        </div>
                        {socio.membresia && (
                          <Badge variant="outline" className="text-xs">
                            {socio.membresia}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No se encontraron socios
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del Socio Seleccionado */}
      {socioSeleccionado && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={socioSeleccionado.foto || undefined} alt={socioSeleccionado.nombre} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {obtenerIniciales(socioSeleccionado.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{socioSeleccionado.nombre}</CardTitle>
                <CardDescription>{socioSeleccionado.codigo}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Estadísticas del Socio */}
      {loadingHistorial ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : historialData?.data?.estadisticas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Total Asistencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{historialData.data.estadisticas.total_mostradas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registros encontrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                Última Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {new Date(historialData.data.estadisticas.ultima_asistencia).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(historialData.data.estadisticas.ultima_asistencia).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabla de Asistencias */}
      {loadingHistorial ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : historialData?.data?.asistencias && historialData.data.asistencias.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Asistencias</CardTitle>
            <CardDescription>
              Mostrando {historialData.data.asistencias.length} registro(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium">Hora</th>
                    <th className="text-left py-3 px-4 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium">Método</th>
                    <th className="text-left py-3 px-4 font-medium">Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {historialData.data.asistencias.map((registro) => (
                    <tr key={registro.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        {new Date(registro.timestamp).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(registro.timestamp).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={registro.tipo === 'IN' ? 'default' : 'secondary'}>
                          {registro.tipo === 'IN' ? '📥 Entrada' : '📤 Salida'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {registro.metodo === 'facial' ? '👤 Facial' : '✋ Manual'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {registro.confidence !== null ? `${(registro.confidence * 100).toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : socioSeleccionado ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron asistencias para este socio</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
