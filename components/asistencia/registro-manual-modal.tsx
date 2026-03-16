"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Textarea } from "@/ui/textarea"
import { Alert, AlertDescription } from "@/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Badge } from "@/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { AsistenciaService } from "@/lib/services/asistencia"
import { SociosService } from "@/lib/services/socios"
import { Loader2, UserCheck, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CheckCircle, Calendar, Clock, Search, X } from "lucide-react"

interface RegistroManualModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistroExitoso?: (registro: any) => void
}

interface SocioRegistrado {
  nombre: string
  codigo: string
  foto: string | null
  membresia: string
  vencimiento: string
  tipo: 'IN' | 'OUT'
}

export function RegistroManualModal({ open, onOpenChange, onRegistroExitoso }: RegistroManualModalProps) {
  const [clave, setClave] = useState("SOC-")
  const [tipo, setTipo] = useState<'IN' | 'OUT'>('IN')
  const [notas, setNotas] = useState("")
  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socioRegistrado, setSocioRegistrado] = useState<SocioRegistrado | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [socioSeleccionadoId, setSocioSeleccionadoId] = useState<number | null>(null)
  const { toast, dismiss } = useToast()
  
  // Estados para búsqueda de socios
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
  
  // Audio ref
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
  const toastMembresiaRef = useRef<string | null>(null)

  // Cargar audio al montar el componente
  useEffect(() => {
    const audio = new Audio('/sounds/success.wav')
    audio.volume = 0.7
    audio.preload = 'auto'
    audioSuccessRef.current = audio

    return () => {
      if (audioSuccessRef.current) {
        audioSuccessRef.current.pause()
        audioSuccessRef.current = null
      }
    }
  }, [])

  // Countdown para cerrar modal después de mostrar éxito
  useEffect(() => {
    if (socioRegistrado && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (socioRegistrado && countdown === 0) {
      onOpenChange(false)
    }
  }, [socioRegistrado, countdown, onOpenChange])

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setClave("SOC-")
        setTipo('IN')
        setNotas("")
        setError(null)
        setSocioRegistrado(null)
        setCountdown(5)
        setBusqueda("")
        setResultadosBusqueda([])
        setMostrarResultados(false)
        setSocioSeleccionadoId(null)
      }, 200)
    }
  }, [open])

  // Búsqueda de socios con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (busquedaTimeoutRef.current) {
      clearTimeout(busquedaTimeoutRef.current)
    }

    // Si la búsqueda está vacía, limpiar resultados
    if (!busqueda || busqueda.trim().length < 2) {
      setResultadosBusqueda([])
      setMostrarResultados(false)
      return
    }

    // Buscar después de 300ms de inactividad
    busquedaTimeoutRef.current = setTimeout(async () => {
      try {
        setBuscando(true)
        const resultados = await SociosService.buscar(busqueda)
        setResultadosBusqueda(resultados)
        setMostrarResultados(true)
      } catch (error) {
        console.error('[BuscarSocio] Error:', error)
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

  const analizarErrorRegistro = (mensajeOriginal?: string) => {
    const mensajeOriginalLimpio = (mensajeOriginal || "").trim()
    const mensajeNormalizado = mensajeOriginalLimpio
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    const esMembresiaVencida =
      mensajeNormalizado.includes("membresia_vencida") ||
      mensajeNormalizado.includes("membership expired") ||
      mensajeNormalizado.includes("vigencia_membresia") ||
      mensajeNormalizado.includes("fecha_fin_membresia") ||
      (mensajeNormalizado.includes("membresia") &&
        (mensajeNormalizado.includes("vencida") || mensajeNormalizado.includes("expirada") || mensajeNormalizado.includes("vencio")))

    if (esMembresiaVencida) {
      return {
        mensaje: "No se pudo registrar la asistencia porque la membresía del socio está vencida.",
        esMembresiaVencida: true,
      }
    }

    const esMensajeGenericoBackend =
      mensajeNormalizado === "error al registrar asistencia manual" ||
      mensajeNormalizado === "error al registrar asistencia" ||
      mensajeNormalizado === "error interno" ||
      mensajeNormalizado === "internal server error"

    return {
      mensaje: esMensajeGenericoBackend
        ? "No se pudo registrar la asistencia manual. Verifica el estado de la membresía o intenta de nuevo."
        : (mensajeOriginalLimpio || "No se pudo registrar la asistencia"),
      esMembresiaVencida: false,
    }
  }


  const resolverErrorConEstadoSocio = async (analisisError: { mensaje: string; esMembresiaVencida: boolean }) => {
    if (analisisError.esMembresiaVencida || !socioSeleccionadoId) {
      return analisisError
    }

    try {
      const socio = await SociosService.getById(socioSeleccionadoId)
      const fechaVencimiento = socio.fechaVencimientoMembresia ? new Date(socio.fechaVencimientoMembresia) : null
      const fechaVencida = !!fechaVencimiento && !Number.isNaN(fechaVencimiento.getTime()) && fechaVencimiento.getTime() < Date.now()
      const estadoVencido = String(socio.estadoSocio || '').toLowerCase() === 'inactivo'

      if (fechaVencida || estadoVencido) {
        return {
          mensaje: "No se pudo registrar la asistencia porque la membresía del socio está vencida.",
          esMembresiaVencida: true,
        }
      }
    } catch (error) {
      console.warn('[RegistroManual] No se pudo validar estado de membresía desde socio seleccionado:', error)
    }

    return analisisError
  }

  const reproducirSonido = () => {
    if (audioSuccessRef.current) {
      audioSuccessRef.current.currentTime = 0
      audioSuccessRef.current.play()
        .then(() => console.log('[RegistroManual] ✅ Sonido reproducido'))
        .catch(err => console.error('[RegistroManual] ❌ Error al reproducir sonido:', err))
    }
  }


  const mostrarToastMembresiaVencida = () => {
    if (toastMembresiaRef.current) {
      dismiss(toastMembresiaRef.current)
    }

    const nuevoToast = toast({
      variant: "destructive",
      title: "Membresía vencida",
      description: "Renueva la membresía para registrar asistencia manual.",
    })

    toastMembresiaRef.current = nuevoToast.id
  }

  const handleRegistrar = async () => {
    // Validar que el código no esté vacío (debe tener algo después de "SOC-")
    if (clave.trim().length <= 4 || clave.trim() === "SOC-") {
      setError("Ingresa un código de socio válido")
      return
    }

    try {
      setRegistrando(true)
      setError(null)

      const response = await AsistenciaService.registrarManual({
        clave: clave.trim(),
        tipo: tipo,
        notas: notas.trim() || undefined,
      })

      console.log('[RegistroManual] Respuesta completa:', response)

      if (response.success && response.data) {
        console.log('[RegistroManual] response.data:', response.data)
        
        // El backend devuelve una estructura plana, no la anidada que define el tipo
        // Usamos 'as any' para evitar errores de TypeScript
        const data = response.data as any
        
        // La estructura real del backend es plana, no tiene socio/asistencia anidados
        // Verificar que al menos tenga nombre y tipo
        if (!data.nombre || !data.tipo) {
          console.error('[RegistroManual] Faltan campos requeridos:', data)
          setError("Respuesta del servidor incompleta. Verifica la consola.")
          return
        }
        
        // Obtener datos completos del socio si tenemos socio_id
        let membresia = "Sin membresía"
        let vencimiento = "N/A"
        
        if (data.socio_id) {
          try {
            console.log('[RegistroManual] Obteniendo datos completos del socio:', data.socio_id)
            const socioCompleto = await SociosService.getById(data.socio_id)
            console.log('[RegistroManual] Socio completo:', socioCompleto)
            
            membresia = socioCompleto.nombrePlan || "Sin membresía"
            vencimiento = socioCompleto.fechaVencimientoMembresia 
              ? new Date(socioCompleto.fechaVencimientoMembresia).toLocaleDateString('es-MX')
              : "N/A"
          } catch (error) {
            console.error('[RegistroManual] Error al obtener datos del socio:', error)
            // Continuar con valores por defecto
          }
        }
        
        // Reproducir sonido de éxito
        reproducirSonido()
        
        // Mostrar pantalla de éxito con datos del socio
        setSocioRegistrado({
          nombre: data.nombre,
          codigo: data.clave || clave.trim(),
          foto: data.foto_perfil_url || null,
          membresia: membresia,
          vencimiento: vencimiento,
          tipo: data.tipo
        })
        
        // Notificar al componente padre
        if (onRegistroExitoso) {
          onRegistroExitoso(response.data)
        }
      } else {
        const analisisError = await resolverErrorConEstadoSocio(analizarErrorRegistro(response.message))
        setError(analisisError.mensaje)

        if (analisisError.esMembresiaVencida) {
          mostrarToastMembresiaVencida()
        }
      }
    } catch (err: any) {
      console.error('[RegistroManual] Error:', err)
      const analisisError = await resolverErrorConEstadoSocio(analizarErrorRegistro(err?.message))
      setError(analisisError.mensaje)

      if (analisisError.esMembresiaVencida) {
        mostrarToastMembresiaVencida()
      }
    } finally {
      setRegistrando(false)
    }
  }

  const handleCodigoChange = (value: string) => {
    // Permitir editar libremente
    setClave(value.toUpperCase())
    setSocioSeleccionadoId(null)
  }

  const handleSeleccionarSocio = (socio: typeof resultadosBusqueda[0]) => {
    setClave(socio.codigo)
    setBusqueda(socio.nombre)
    setSocioSeleccionadoId(socio.id)
    setMostrarResultados(false)
    setResultadosBusqueda([])
  }

  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setError(null)
  }

  const limpiarBusqueda = () => {
    setBusqueda("")
    setResultadosBusqueda([])
    setMostrarResultados(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Pantalla de éxito con datos del socio */}
        {socioRegistrado ? (
          <div className="py-6">
            <div className="text-center space-y-4">
              {/* Ícono de éxito */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <div className="relative bg-green-500/10 p-4 rounded-full border-2 border-green-500">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Foto del socio */}
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-green-500">
                  <AvatarImage src={socioRegistrado.foto || undefined} alt={socioRegistrado.nombre} />
                  <AvatarFallback className="text-2xl">
                    {socioRegistrado.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Nombre y código */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {socioRegistrado.nombre}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Código: {socioRegistrado.codigo}
                </p>
              </div>

              {/* Badge de estado */}
              <div className="flex justify-center mb-4">
                <Badge className="text-lg px-6 py-2 bg-green-500 hover:bg-green-600">
                  {socioRegistrado.tipo === 'IN' ? '✓ ENTRADA REGISTRADA' : '✓ SALIDA REGISTRADA'}
                </Badge>
              </div>

              {/* Detalles */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Membresía:
                  </span>
                  <span className="font-semibold text-foreground">{socioRegistrado.membresia}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vencimiento:</span>
                  <span className="font-semibold text-foreground">{socioRegistrado.vencimiento}</span>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Cerrando en {countdown}s</span>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de registro */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Registro Manual de Asistencia
              </DialogTitle>
              <DialogDescription>
                Busca al socio por nombre o ingresa su código manualmente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Buscador de socios */}
              <div className="space-y-2">
                <Label htmlFor="busqueda">Buscar Socio por Nombre</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busqueda"
                    placeholder="Ej: Juan Pérez, María López..."
                    value={busqueda}
                    onChange={(e) => handleBusquedaChange(e.target.value)}
                    disabled={registrando}
                    className="pl-9 pr-9"
                  />
                  {busqueda && (
                    <button
                      onClick={limpiarBusqueda}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {buscando && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {/* Resultados de búsqueda */}
                {mostrarResultados && resultadosBusqueda.length > 0 && (
                  <div className="border border-border rounded-lg bg-card shadow-lg max-h-[250px] overflow-y-auto">
                    {resultadosBusqueda.filter(socio => socio.nombre && socio.codigo).map((socio) => {
                      // Generar iniciales de forma segura
                      const iniciales = socio.nombre
                        ? socio.nombre.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : '??'
                      
                      return (
                        <button
                          key={socio.id}
                          onClick={() => handleSeleccionarSocio(socio)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          type="button"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={socio.foto} alt={socio.nombre || 'Socio'} />
                            <AvatarFallback>
                              {iniciales}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {socio.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {socio.codigo}
                            </p>
                            {socio.membresia && (
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                {socio.membresia}
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {mostrarResultados && resultadosBusqueda.length === 0 && !buscando && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      No se encontraron socios con ese nombre. Intenta con otro término o ingresa el código manualmente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    o ingresa el código directamente
                  </span>
                </div>
              </div>

              {/* Input de código con prefijo editable */}
              <div className="space-y-2">
                <Label htmlFor="clave">Código de Socio</Label>
                <Input
                  id="clave"
                  placeholder="SOC-274495"
                  value={clave}
                  onChange={(e) => handleCodigoChange(e.target.value)}
                  disabled={registrando}
                />
                <p className="text-xs text-muted-foreground">
                  El prefijo "SOC-" se agrega automáticamente, pero puedes editarlo
                </p>
              </div>

              {/* Selector de tipo (Entrada/Salida) */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Registro</Label>
                <Select value={tipo} onValueChange={(value: 'IN' | 'OUT') => setTipo(value)} disabled={registrando}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">
                      <div className="flex items-center gap-2">
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                        <span>Entrada (IN)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OUT">
                      <div className="flex items-center gap-2">
                        <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                        <span>Salida (OUT)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de notas/observaciones */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas u Observaciones (Opcional)</Label>
                <Textarea
                  id="notas"
                  placeholder="Ej: Lector facial sucio, ingresado manualmente"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={registrando}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Agrega una nota si hay algo especial que reportar
                </p>
              </div>

              {/* Mensaje de error */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={registrando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrar}
                  disabled={registrando || clave.trim().length <= 4}
                  className="flex-1"
                >
                  {registrando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Registrar {tipo === 'IN' ? 'Entrada' : 'Salida'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
