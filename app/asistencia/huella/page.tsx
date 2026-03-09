"use client"

import { useState, useEffect, useRef } from "react"
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Clock, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ============================================================================
// TYPES
// ============================================================================

type EstadoAsistencia = 
  | "idle"           // Esperando dedo
  | "connecting"     // Conectando con lector
  | "scanning"       // Capturando huella
  | "validating"     // Validando contra BD
  | "success"        // Acceso permitido
  | "warning"        // Permitido con advertencia
  | "error"          // Acceso denegado
  | "no-device"      // Lector no conectado

interface SocioData {
  socio: {
    id: number
    codigo_socio: string
    nombre_completo: string
    foto_perfil_url: string | null
    membresia: string
    fecha_fin_membresia: string
  }
  asistencia: {
    id: number
    timestamp: string
    tipo: 'IN' | 'OUT'
    match_score: number
  }
  estadisticas: {
    asistencias_mes: number
    racha_dias: number
    ultima_asistencia: string
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AsistenciaHuellaPage() {
  const [estado, setEstado] = useState<EstadoAsistencia>("connecting")
  const [progress, setProgress] = useState(0)
  const [socioData, setSocioData] = useState<SocioData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [countdown, setCountdown] = useState(5)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [deviceName, setDeviceName] = useState("Buscando...")
  
  const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
  const audioWarningRef = useRef<HTMLAudioElement | null>(null)
  const audioErrorRef = useRef<HTMLAudioElement | null>(null)
  const audioBeepRef = useRef<HTMLAudioElement | null>(null)
  const readerRef = useRef<any>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar audios
  useEffect(() => {
    audioSuccessRef.current = new Audio('/sounds/success.wav')
    audioWarningRef.current = new Audio('/sounds/warning.wav')
    audioErrorRef.current = new Audio('/sounds/error.wav')
    audioBeepRef.current = new Audio('/sounds/beep-start.wav')
    
    ;[audioSuccessRef, audioWarningRef, audioErrorRef, audioBeepRef].forEach(ref => {
      if (ref.current) {
        ref.current.volume = 0.7
        ref.current.preload = 'auto'
      }
    })

    return () => {
      ;[audioSuccessRef, audioWarningRef, audioErrorRef, audioBeepRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause()
          ref.current = null
        }
      })
    }
  }, [])

  // Actualizar reloj
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Inicializar lector al montar
  useEffect(() => {
    iniciarLector()
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.stopAcquisition()
        } catch (e) {
          console.error('Error stopping reader:', e)
        }
      }
    }
  }, [])

  const iniciarLector = async () => {
    setEstado("connecting")
    setDeviceName("Buscando dispositivo...")
    
    try {
      const { FingerprintReader, SampleFormat } = await import('@digitalpersona/devices')
      const reader = new FingerprintReader()
      readerRef.current = reader
      
      const devices = await reader.enumerateDevices()
      
      if (devices.length === 0) {
        setEstado("no-device")
        setDeviceName("No conectado")
        setErrorMsg("No se detectó ningún lector de huellas. Por favor, conecta el dispositivo.")
        return
      }

      setDeviceName(devices[0]?.DeviceID || "U.are.U 4500")
      setEstado("idle")
      
      // Configurar eventos del lector
      reader.on('SamplesAcquired', async (event: any) => {
        audioBeepRef.current?.play()
        setEstado("scanning")
        setProgress(0)
        
        const sample = event.samples[0].Data
        
        // Simular progreso de escaneo
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + 20
          })
        }, 150)
        
        // Esperar a que termine animación
        setTimeout(async () => {
          clearInterval(progressInterval)
          setProgress(100)
          await validarHuella(sample)
        }, 1000)
      })

      reader.on('ErrorOccurred', (errorEvent: any) => {
        console.error('Error del lector:', errorEvent)
        setEstado("error")
        setErrorMsg(`Error del dispositivo: ${errorEvent.message || 'Desconocido'}`)
        audioErrorRef.current?.play()
        iniciarCountdown(7)
      })

      await reader.startAcquisition(SampleFormat.Intermediate, devices[0]?.DeviceID || '')
      console.log('✅ Lector iniciado correctamente')
    } catch (err: any) {
      console.error('❌ Error al inicializar lector:', err)
      setEstado("no-device")
      setDeviceName("Error")
      setErrorMsg(err.message || 'Error al conectar con el lector de huellas')
    }
  }

  const validarHuella = async (sample: string) => {
    setEstado("validating")
    
    try {
      const response = await fetch('/api/asistencia/validar-huella', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fingerprintSample: sample,
          tipo: 'IN',
          kioskId: 'KIOSK-01'
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setSocioData(data.data)
        
        // Verificar estado de membresía
        const diasRestantes = calcularDiasRestantes(data.data.socio.fecha_fin_membresia)
        
        if (diasRestantes < 0) {
          // Membresía vencida
          setEstado("error")
          setErrorMsg("Membresía vencida")
          audioErrorRef.current?.play()
        } else if (diasRestantes <= 3) {
          // Próxima a vencer
          setEstado("warning")
          audioWarningRef.current?.play()
        } else {
          // Todo OK
          setEstado("success")
          audioSuccessRef.current?.play()
        }
        
        iniciarCountdown(5)
      } else {
        setEstado("error")
        setErrorMsg(data.message || "Huella no reconocida. Por favor, intenta nuevamente.")
        audioErrorRef.current?.play()
        iniciarCountdown(5)
      }
    } catch (err: any) {
      console.error('Error validando huella:', err)
      setEstado("error")
      setErrorMsg("Error de conexión con el servidor. Intenta nuevamente.")
      audioErrorRef.current?.play()
      iniciarCountdown(5)
    }
  }

  const calcularDiasRestantes = (fechaFin: string): number => {
    const hoy = new Date()
    const fin = new Date(fechaFin)
    const diff = fin.getTime() - hoy.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const iniciarCountdown = (segundos: number) => {
    setCountdown(segundos)
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          resetear()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resetear = () => {
    setEstado("idle")
    setProgress(0)
    setSocioData(null)
    setErrorMsg("")
    setCountdown(5)
    
    // Reiniciar lector si es necesario
    if (estado === "no-device") {
      iniciarLector()
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Fingerprint className="h-7 w-7 text-accent" />
                Control de Asistencia - Huella Dactilar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(currentTime)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatTime(currentTime)}
                </p>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  {estado === "no-device" ? (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-500 font-medium">{deviceName}</p>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-500 font-medium">{deviceName}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Renderizar pantalla según estado */}
          {(estado === "idle" || estado === "connecting") && (
            <PantallaIdle estado={estado} />
          )}
          
          {estado === "no-device" && (
            <PantallaNoDevice mensaje={errorMsg} onRetry={iniciarLector} />
          )}
          
          {(estado === "scanning" || estado === "validating") && (
            <PantallaScanning progress={progress} estado={estado} />
          )}
          
          {estado === "success" && socioData && (
            <PantallaSuccess socio={socioData} countdown={countdown} />
          )}
          
          {estado === "warning" && socioData && (
            <PantallaWarning socio={socioData} countdown={countdown} />
          )}
          
          {estado === "error" && (
            <PantallaError mensaje={errorMsg} countdown={countdown} socio={socioData} />
          )}
        </div>
      </main>

      {/* Footer con métodos alternativos */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <button 
              onClick={() => window.location.href = '/asistencia/escaneo'}
              className="px-4 py-2 rounded-lg hover:bg-accent/10 hover:text-accent transition-colors"
            >
              🔄 Cambiar a Reconocimiento Facial
            </button>
            <span>|</span>
            <button 
              onClick={() => window.location.href = '/asistencia'}
              className="px-4 py-2 rounded-lg hover:bg-accent/10 hover:text-accent transition-colors"
            >
              ⌨️ Registro Manual
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// PANTALLAS
// ============================================================================

function PantallaIdle({ estado }: { estado: EstadoAsistencia }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 border-border/50 shadow-2xl">
        {/* Icono central */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-accent/10 border-4 border-accent/30 flex items-center justify-center animate-pulse-slow">
              {estado === "connecting" ? (
                <Loader2 className="h-20 w-20 text-accent animate-spin" />
              ) : (
                <Fingerprint className="h-20 w-20 text-accent" />
              )}
            </div>
            {estado === "idle" && (
              <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
            )}
          </div>
        </div>

        {/* Texto principal */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">
            {estado === "connecting" ? "Conectando..." : "Coloca tu dedo en el sensor"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {estado === "connecting" 
              ? "Inicializando lector de huellas..."
              : "El sistema registrará tu asistencia automáticamente"
            }
          </p>
        </div>

        {/* Indicadores */}
        {estado === "idle" && (
          <div className="mt-12 flex justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse delay-150" />
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse delay-300" />
          </div>
        )}
      </div>
    </div>
  )
}

function PantallaNoDevice({ mensaje, onRetry }: { mensaje: string, onRetry: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 border-red-500/30 shadow-2xl">
        {/* Icono */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 rounded-full bg-red-500/10 border-4 border-red-500/30 flex items-center justify-center">
            <WifiOff className="h-20 w-20 text-red-500" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">
            Dispositivo No Conectado
          </h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            {mensaje}
          </p>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-muted/30 rounded-xl p-6 text-left">
          <p className="font-semibold mb-3 text-foreground">Por favor verifica:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>El lector de huellas está conectado al puerto USB</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Los drivers de Digital Persona están instalados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>El dispositivo tiene luz indicadora encendida</span>
            </li>
          </ul>
        </div>

        {/* Botón reintentar */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-accent hover:bg-accent/90 text-primary-foreground rounded-xl font-bold text-lg transition-colors"
          >
            🔄 Intentar Nuevamente
          </button>
        </div>
      </div>
    </div>
  )
}

function PantallaScanning({ progress, estado }: { progress: number, estado: EstadoAsistencia }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 border-accent/50 shadow-2xl">
        {/* Icono con scan effect */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center">
              <Fingerprint className="h-20 w-20 text-accent" />
            </div>
            {/* Línea de scan */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-4xl font-bold text-foreground">
            {estado === "scanning" ? "⚡ Capturando Huella" : "🔍 Validando Identidad"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {estado === "scanning" 
              ? "Mantén el dedo firme en el sensor..."
              : "Comparando con base de datos..."
            }
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-3">
          <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-2xl font-bold text-accent tabular-nums">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}

function PantallaSuccess({ socio, countdown }: { socio: SocioData, countdown: number }) {
  const diasRestantes = Math.ceil(
    (new Date(socio.socio.fecha_fin_membresia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-green-500/10 to-card rounded-3xl p-12 border-2 border-green-500/50 shadow-2xl">
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center animate-bounce-once">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-5xl font-bold text-center text-green-500 mb-8">
          ¡Bienvenido!
        </h2>

        {/* Card del socio */}
        <div className="bg-card/50 rounded-2xl p-8 space-y-6">
          {/* Foto y nombre */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-green-500/30">
              <AvatarImage src={socio.socio.foto_perfil_url || undefined} />
              <AvatarFallback className="text-2xl bg-accent/20">
                {socio.socio.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-foreground">
                {socio.socio.nombre_completo}
              </h3>
              <p className="text-lg text-muted-foreground">
                {socio.socio.codigo_socio}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-border/30" />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">💎 Membresía</p>
              <p className="text-lg font-bold text-foreground">{socio.socio.membresia}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">📅 Vencimiento</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(socio.socio.fecha_fin_membresia).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">⏰ Hora de entrada</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(socio.asistencia.timestamp).toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">📊 Precisión</p>
              <p className="text-lg font-bold text-green-500">{socio.asistencia.match_score}%</p>
            </div>
          </div>

          {/* Estadísticas destacadas */}
          {socio.estadisticas.racha_dias > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
              <p className="text-center text-lg">
                <span className="text-2xl mr-2">🔥</span>
                <span className="font-bold text-foreground">¡Racha de {socio.estadisticas.racha_dias} días consecutivos!</span>
              </p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <p className="text-center text-muted-foreground mt-8 text-lg">
          Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
        </p>
      </div>
    </div>
  )
}

function PantallaWarning({ socio, countdown }: { socio: SocioData, countdown: number }) {
  const diasRestantes = Math.ceil(
    (new Date(socio.socio.fecha_fin_membresia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-amber-500/10 to-card rounded-3xl p-12 border-2 border-amber-500/50 shadow-2xl">
        {/* Icono de advertencia */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-5xl font-bold text-center text-amber-500 mb-4">
          ⚠️ Acceso Permitido
        </h2>
        <p className="text-center text-xl text-muted-foreground mb-8">
          Tu membresía está próxima a vencer
        </p>

        {/* Card del socio */}
        <div className="bg-card/50 rounded-2xl p-8 space-y-6">
          {/* Foto y nombre */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-amber-500/30">
              <AvatarImage src={socio.socio.foto_perfil_url || undefined} />
              <AvatarFallback className="text-2xl bg-accent/20">
                {socio.socio.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-foreground">
                {socio.socio.nombre_completo}
              </h3>
              <p className="text-lg text-muted-foreground">
                {socio.socio.codigo_socio}
              </p>
            </div>
          </div>

          {/* Alerta de vencimiento */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-amber-500/50">
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold text-amber-500">
                ⏰ Tu membresía vence en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
              </p>
              <p className="text-lg text-foreground">
                📅 Fecha de vencimiento: {new Date(socio.socio.fecha_fin_membresia).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-amber-400 font-semibold mt-4">
                💳 Renueva pronto para no perder acceso
              </p>
            </div>
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">⏰ Hora de entrada</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(socio.asistencia.timestamp).toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">💎 Membresía</p>
              <p className="text-lg font-bold text-foreground">{socio.socio.membresia}</p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <p className="text-center text-muted-foreground mt-8 text-lg">
          Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
        </p>
      </div>
    </div>
  )
}

function PantallaError({ mensaje, countdown, socio }: { mensaje: string, countdown: number, socio: SocioData | null }) {
  const mensajesMotivacionales = {
    vencida: {
      titulo: "Membresía Vencida",
      emoji: "⏰",
      accion: "Por favor, acude a recepción para renovar tu membresía.",
      cta: "¡Renueva hoy y obtén 10% de descuento! 🎁"
    },
    noReconocida: {
      titulo: "Huella No Reconocida",
      emoji: "🔍",
      accion: "Por favor, limpia tu dedo e intenta nuevamente.",
      cta: "Si el problema persiste, contacta a recepción."
    },
    default: {
      titulo: "Acceso Denegado",
      emoji: "❌",
      accion: "Por favor, contacta a recepción.",
      cta: "Estamos aquí para ayudarte."
    }
  }

  const tipo = mensaje.toLowerCase().includes('vencida') ? 'vencida' 
    : mensaje.toLowerCase().includes('no reconocida') ? 'noReconocida' 
    : 'default'
  
  const info = mensajesMotivacionales[tipo]

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-red-500/10 to-card rounded-3xl p-12 border-2 border-red-500/50 shadow-2xl">
        {/* Icono de error */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center animate-shake">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-5xl font-bold text-center text-red-500 mb-4">
          {info.emoji} {info.titulo}
        </h2>

        {/* Mensaje */}
        <div className="bg-card/50 rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-xl text-foreground font-semibold">
              {mensaje}
            </p>
            <div className="border-t-2 border-border/30 my-4" />
            <p className="text-lg text-muted-foreground">
              {info.accion}
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl p-6 border border-accent/30">
            <p className="text-center text-lg text-accent font-semibold">
              {info.cta}
            </p>
          </div>

          {/* Info adicional si hay socio */}
          {socio && (
            <div className="border-t border-border/30 pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Socio: {socio.socio.nombre_completo} ({socio.socio.codigo_socio})
              </p>
            </div>
          )}

          {/* Mensaje motivacional para no socios */}
          {!socio && tipo === 'noReconocida' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
              <p className="text-center">
                <span className="text-2xl mr-2">💪</span>
                <span className="text-lg font-semibold text-foreground">
                  ¿No eres socio? ¡Únete hoy!
                </span>
              </p>
              <p className="text-center text-muted-foreground mt-2">
                Primera semana GRATIS + Evaluación física de cortesía
              </p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <p className="text-center text-muted-foreground mt-8 text-lg">
          Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
        </p>
      </div>
    </div>
  )
}
