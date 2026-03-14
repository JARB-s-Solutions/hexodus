"use client"

import { useState, useEffect, useRef } from "react"
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Clock, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthService } from "@/lib/auth"

// ============================================================================
// CONSTANTES
// ============================================================================

const MOTOR_URL = "http://localhost:4000"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hexodusapi.vercel.app/api"

// ============================================================================
// TYPES
// ============================================================================

type EstadoAsistencia =
  | "idle"           // Esperando dedo
  | "connecting"     // Cargando cache en el motor
  | "scanning"       // Capturando/comparando huella
  | "validating"     // Validando contra BD
  | "success"        // Acceso permitido
  | "warning"        // Permitido con advertencia
  | "error"          // Acceso denegado
  | "no-device"      // Motor no disponible

interface SocioData {
  socio: {
    id: number
    codigo_socio: string
    nombre_completo: string
    foto_perfil_url: string | null
    membresia: string
    fecha_fin_membresia: string
  }
  asistencia?: {
    id: number
    timestamp: string
    tipo: "IN" | "OUT"
    match_score: number
  }
  estadisticas?: {
    asistencias_mes: number
    racha_dias: number
    ultima_asistencia: string
  }
}

const safePlay = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
  const audio = audioRef.current
  if (!audio) return

  audio.currentTime = 0
  const playPromise = audio.play()
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn("No se pudo reproducir audio:", error)
    })
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
  const [motorListo, setMotorListo] = useState(false)

  const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
  const audioWarningRef = useRef<HTMLAudioElement | null>(null)
  const audioErrorRef = useRef<HTMLAudioElement | null>(null)
  const audioBeepRef = useRef<HTMLAudioElement | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)

  // Inicializar audios
  useEffect(() => {
    audioSuccessRef.current = new Audio("/sounds/success.wav")
    audioWarningRef.current = new Audio("/sounds/warning.wav")
    audioErrorRef.current = new Audio("/sounds/error.wav")
    audioBeepRef.current = new Audio("/sounds/beep-start.wav")

    ;[audioSuccessRef, audioWarningRef, audioErrorRef, audioBeepRef].forEach((ref) => {
      if (ref.current) {
        ref.current.volume = 0.7
        ref.current.preload = "auto"
      }
    })

    return () => {
      ;[audioSuccessRef, audioWarningRef, audioErrorRef, audioBeepRef].forEach((ref) => {
        if (ref.current) {
          ref.current.pause()
          ref.current = null
        }
      })
    }
  }, [])

  // Actualizar reloj
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Inicializar motor al montar
  useEffect(() => {
    isMounted.current = true
    inicializarMotor()
    return () => {
      isMounted.current = false
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================================
  // INICIALIZAR MOTOR: Cargar huellas en cache del motor C#
  // ============================================================================
  const inicializarMotor = async () => {
    if (!isMounted.current) return
    setEstado("connecting")
    setMotorListo(false)

    try {
      const token = AuthService.getToken()

      // 1. Obtener huellas desde la API del backend
      const resSync = await fetch(`${API_BASE}/asistencia/huellas/sincronizar`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!resSync.ok) throw new Error("No se pudo sincronizar huellas desde el servidor.")

      const dataSync = await resSync.json()
      if (!dataSync.success) throw new Error(dataSync.message || "Error al sincronizar huellas.")

      const sociosDb: Array<{ codigoSocio: string; huellaTemplate: string }> = dataSync.data

      // 2. Decodificar Base64 y enviar al motor C#
      const payloadMotor = sociosDb.map((socio) => {
        let templateLimpio = socio.huellaTemplate || ""
        if (templateLimpio && !templateLimpio.trim().startsWith("<")) {
          try {
            templateLimpio = atob(templateLimpio)
          } catch {
            templateLimpio = ""
          }
        }
        return { CodigoSocio: socio.codigoSocio, HuellaTemplate: templateLimpio }
      })

      const resMotor = await fetch(`${MOTOR_URL}/cargar-cache`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ BaseDeDatos: payloadMotor }),
      })

      if (!resMotor.ok) throw new Error("Error al inyectar huellas en el motor biométrico.")

      if (isMounted.current) {
        setMotorListo(true)
        setEstado("idle")
      }
    } catch (err: any) {
      console.error("❌ Error inicializando motor:", err)
      if (isMounted.current) {
        setEstado("no-device")
        setErrorMsg(
          err?.message?.includes("fetch")
            ? "Motor biométrico no disponible. Verifica que esté corriendo en el puerto 4000."
            : err?.message || "Error al inicializar el sistema biométrico."
        )
      }
    }
  }

  // ============================================================================
  // INICIAR VERIFICACIÓN: Llamar al motor para comparar huella
  // ============================================================================
  const iniciarVerificacion = async () => {
    if (!motorListo) return
    if (!isMounted.current) return

    setEstado("scanning")
    setProgress(0)
    setSocioData(null)
    safePlay(audioBeepRef)

    // Animación de progreso
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 80 ? 80 : prev + 10))
    }, 200)

    try {
      const resMotor = await fetch(`${MOTOR_URL}/comparar`, { method: "POST" })

      if (!resMotor.body) throw new Error("El navegador no soporta streams de respuesta.")

      const streamReader = resMotor.body.getReader()
      const decoder = new TextDecoder("utf-8")

      let matchSuccess = false
      let codigoSocioMatch = ""
      let confidenceMatch = 100

      while (true) {
        const { done, value } = await streamReader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lineas = chunk.split("\n").filter((l) => l.trim() !== "")

        for (const linea of lineas) {
          try {
            const data = JSON.parse(linea)
            if (data.tipo === "resultado") {
              if (!data.success) {
                clearInterval(progressInterval)
                setProgress(100)
                setEstado("error")
                setErrorMsg(data.message || "Huella no reconocida.")
                safePlay(audioErrorRef)
                iniciarCountdown(5)
                return
              }
              matchSuccess = true
              codigoSocioMatch = data.codigoSocio
              confidenceMatch = data.confidence ?? 100
            }
          } catch {
            // ignorar líneas no JSON
          }
        }
      }

      clearInterval(progressInterval)
      setProgress(90)

      if (matchSuccess) {
        setEstado("validating")
        await registrarAsistencia(codigoSocioMatch, confidenceMatch)
      } else {
        setEstado("error")
        setErrorMsg("Huella no reconocida. Intenta de nuevo.")
        safePlay(audioErrorRef)
        iniciarCountdown(5)
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error("❌ Error en comparación:", err)
      setEstado("no-device")
      setErrorMsg(
        err?.message?.includes("fetch")
          ? "Motor biométrico no disponible en el puerto 4000."
          : err?.message || "Error al comunicarse con el motor biométrico."
      )
    }
  }

  // ============================================================================
  // REGISTRAR ASISTENCIA EN EL BACKEND
  // ============================================================================
  const registrarAsistencia = async (codigoSocio: string, confidence: number) => {
    try {
      const token = AuthService.getToken()

      const resValidar = await fetch(`${API_BASE}/asistencia/huellas/validar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigoSocio,
          tipo: "IN",
          kioskId: "KIOSKO-HUELLA-01",
          confidence,
        }),
      })

      const dataValidar = await resValidar.json()

      if (!isMounted.current) return

      setProgress(100)

      if (resValidar.ok && dataValidar.success) {
        setSocioData(dataValidar.data)
        const diasRestantes = calcularDiasRestantes(
          dataValidar.data?.socio?.fecha_fin_membresia || ""
        )

        if (diasRestantes < 0) {
          setEstado("error")
          setErrorMsg("Membresía vencida")
          safePlay(audioErrorRef)
        } else if (diasRestantes <= 3) {
          setEstado("warning")
          safePlay(audioWarningRef)
        } else {
          setEstado("success")
          safePlay(audioSuccessRef)
        }
        iniciarCountdown(5)
      } else if (resValidar.status === 403) {
        setEstado("warning")
        setSocioData(dataValidar.data)
        setErrorMsg(dataValidar.message || "Membresía con restricciones.")
        safePlay(audioWarningRef)
        iniciarCountdown(5)
      } else {
        setEstado("error")
        setErrorMsg(dataValidar.message || "No se pudo registrar la asistencia.")
        safePlay(audioErrorRef)
        iniciarCountdown(5)
      }
    } catch (err: any) {
      console.error("❌ Error registrando asistencia:", err)
      if (isMounted.current) {
        setEstado("error")
        setErrorMsg("Error de conexión al validar membresía.")
        safePlay(audioErrorRef)
        iniciarCountdown(5)
      }
    }
  }

  const calcularDiasRestantes = (fechaFin: string): number => {
    if (!fechaFin) return 999
    const hoy = new Date()
    const fin = new Date(fechaFin)
    const diff = fin.getTime() - hoy.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const iniciarCountdown = (segundos: number) => {
    setCountdown(segundos)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
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
  }

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

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
              <p className="text-sm text-muted-foreground mt-1">{formatDate(currentTime)}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatTime(currentTime)}
                </p>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  {estado === "no-device" || estado === "connecting" ? (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-500 font-medium">
                        {estado === "connecting" ? "Inicializando..." : "Motor no disponible"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-500 font-medium">Motor listo (Puerto 4000)</p>
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
          {(estado === "connecting") && <PantallaConectando />}

          {estado === "idle" && (
            <PantallaIdle onIniciar={iniciarVerificacion} />
          )}

          {estado === "no-device" && (
            <PantallaNoDevice mensaje={errorMsg} onRetry={inicializarMotor} />
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

function PantallaConectando() {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 border-border/50 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 rounded-full bg-accent/10 border-4 border-accent/30 flex items-center justify-center">
            <Loader2 className="h-20 w-20 text-accent animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">Inicializando Sistema...</h2>
          <p className="text-xl text-muted-foreground">Sincronizando huellas con el motor biométrico</p>
        </div>
        <div className="mt-12 flex justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse delay-150" />
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse delay-300" />
        </div>
      </div>
    </div>
  )
}

function PantallaIdle({ onIniciar }: { onIniciar: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 border-border/50 shadow-2xl">
        {/* Icono central */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-accent/10 border-4 border-accent/30 flex items-center justify-center animate-pulse-slow">
              <Fingerprint className="h-20 w-20 text-accent" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
          </div>
        </div>

        {/* Texto principal */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">Listo para registrar</h2>
          <p className="text-xl text-muted-foreground">
            Presiona el botón y coloca tu dedo en el sensor cuando se solicite
          </p>
        </div>

        {/* Botón de inicio */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onIniciar}
            className="px-12 py-5 bg-accent hover:bg-accent/90 text-primary-foreground rounded-2xl font-bold text-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-95 flex items-center gap-3"
          >
            <Fingerprint className="h-7 w-7" />
            Registrar Asistencia
          </button>
        </div>
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
              <span>El motor biométrico (C#) está corriendo en el puerto 4000</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>El lector de huellas está conectado al puerto USB</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>El servidor backend está accesible</span>
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
  const horaEntrada = socio.asistencia?.timestamp
    ? new Date(socio.asistencia.timestamp).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No disponible"

  const precision = typeof socio.asistencia?.match_score === "number"
    ? `${socio.asistencia.match_score}%`
    : "No disponible"

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
                {horaEntrada}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">📊 Precisión</p>
              <p className="text-lg font-bold text-green-500">{precision}</p>
            </div>
          </div>

          {/* Estadísticas destacadas */}
          {typeof socio.estadisticas?.racha_dias === "number" && socio.estadisticas.racha_dias > 0 && (
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
  const horaEntrada = socio.asistencia?.timestamp
    ? new Date(socio.asistencia.timestamp).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No disponible"

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
                {horaEntrada}
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
