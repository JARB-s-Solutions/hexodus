"use client"

import { useState, useEffect, useRef } from "react"
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { AuthService } from "@/lib/auth"
import { SociosService } from "@/lib/services/socios"
import { sincronizarCacheMotorHuella } from "@/lib/motor-huella"
import type { HuellaMotorEvent, HuellaMotorEventsResponse } from "@/lib/types/asistencia-huella"

// ============================================================================
// CONSTANTES
// ============================================================================

const MOTOR_URL = process.env.NEXT_PUBLIC_MOTOR_URL || "http://localhost:4000"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hexodusapi.vercel.app/api"
const AUTO_RETRY_DELAY_MS = 800
const EVENT_POLL_INTERVAL_MS = 750
const MOTOR_HEALTHCHECK_INTERVAL_MS = 3000
const READY_FOR_NEXT_SCAN_DELAY_MS = 150
const RESULT_NOTIFICATION_DURATION_MS = 4500

const MENSAJES_ESPERA_HUELLA = [
  "lectura fallida",
  "read failed",
  "scan canceled",
  "scan cancelled",
  "captura cancelada",
  "lectura cancelada",
  "no finger",
  "sin dedo",
  "sin huella",
  "no se detecto",
  "no se detectó",
  "time out",
  "timeout",
  "tiempo agotado",
  "tiempo de espera",
  "esperando huella",
  "waiting for finger",
  "coloca tu dedo",
  "coloque su dedo",
  "ponga el dedo",
  "place your finger",
]

const MENSAJES_ACTIVIDAD_HUELLA = [
  "captur",
  "proces",
  "compar",
  "leyendo",
  "reading",
  "detect",
  "muestra",
  "sample",
]

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

type EstadoMotorDiagnostico = {
  cacheCargada: boolean | null
  huellasEnMemoria: number | null
  lectorConectado: boolean | null
  detectorActivo: boolean | null
}

type TipoNotificacionAcceso = "success" | "warning" | "error"

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
    id?: number
    timestamp?: string
    tipo?: "IN" | "OUT"
    match_score?: number
  }
  estadisticas?: {
    asistencias_mes: number
    racha_dias: number
    ultima_asistencia: string
  }
}

interface NotificacionAcceso {
  id: string
  tipo: TipoNotificacionAcceso
  mensaje: string
  socio: SocioData | null
}

const ESTADO_MOTOR_INICIAL: EstadoMotorDiagnostico = {
  cacheCargada: null,
  huellasEnMemoria: null,
  lectorConectado: null,
  detectorActivo: null,
}

const calcularDiasRestantesMembresia = (fechaFin: string): number => {
  if (!fechaFin) return 999

  const hoy = new Date()
  const fin = new Date(fechaFin)
  const diff = fin.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const normalizarMatchScore = (valor: number | null | undefined) => {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null

  const porcentaje = valor > 1 ? valor : valor * 100
  return Math.min(Math.max(porcentaje, 0), 100)
}

const formatearNivelConfianza = (valor: number | null | undefined) => {
  const porcentaje = normalizarMatchScore(valor)
  if (porcentaje === null) return "No disponible"

  const decimales = porcentaje >= 99 || Number.isInteger(porcentaje) ? 0 : 1
  return `${porcentaje.toFixed(decimales)}%`
}

const tieneTexto = (valor: unknown): valor is string =>
  typeof valor === "string" && valor.trim().length > 0

const enriquecerSocioConConfianza = (data: SocioData | null | undefined, confidence: number) => {
  if (!data) return null

  const matchScore = normalizarMatchScore(data.asistencia?.match_score) ?? normalizarMatchScore(confidence)
  if (matchScore === null) return data

  return {
    ...data,
    asistencia: {
      ...(data.asistencia || {}),
      match_score: matchScore,
    },
  }
}

const completarSocioConDetalle = async (data: SocioData | null) => {
  if (!data?.socio?.id) return data

  const necesitaMembresia = !tieneTexto(data.socio.membresia)
  const necesitaFechaFin = !tieneTexto(data.socio.fecha_fin_membresia)
  if (!necesitaMembresia && !necesitaFechaFin) return data

  try {
    const socioDetalle = await SociosService.getById(data.socio.id)

    return {
      ...data,
      socio: {
        ...data.socio,
        membresia: necesitaMembresia
          ? socioDetalle.nombrePlan?.trim() || data.socio.membresia
          : data.socio.membresia,
        fecha_fin_membresia: necesitaFechaFin
          ? socioDetalle.fechaVencimientoMembresia || data.socio.fecha_fin_membresia
          : data.socio.fecha_fin_membresia,
      },
    }
  } catch (error) {
    console.warn("No se pudo completar el detalle del socio:", error)
    return data
  }
}

const obtenerNombreMembresia = (data: SocioData | null | undefined) =>
  tieneTexto(data?.socio?.membresia) ? data.socio.membresia.trim() : "Sin membresía asignada"

const formatearFechaMembresia = (
  fecha: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!tieneTexto(fecha)) return "No disponible"

  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return "No disponible"

  return parsed.toLocaleDateString("es-MX", options)
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

// Generador de tonos usando Web Audio API para casos de error o advertencia.
const playWebAudioTone = (type: "warning" | "error") => {
  if (typeof window === "undefined") return

  const AudioContextClass =
    (window as any).AudioContext ||
    (window as any).webkitAudioContext
  if (!AudioContextClass) return

  const audioCtx = new AudioContextClass()
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  oscillator.onended = () => {
    void audioCtx.close().catch((error: unknown) => {
      console.warn("No se pudo cerrar AudioContext:", error)
    })
  }

  const startTone = () => {
    const startTime = audioCtx.currentTime

    if (type === "warning") {
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(523.25, startTime)
      oscillator.frequency.setValueAtTime(659.25, startTime + 0.2)
      gainNode.gain.setValueAtTime(0.5, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.5)
      return
    }

    oscillator.type = "sawtooth"
    oscillator.frequency.setValueAtTime(330, startTime)
    oscillator.frequency.exponentialRampToValueAtTime(261, startTime + 0.8)
    gainNode.gain.setValueAtTime(0.3, startTime)
    gainNode.gain.linearRampToValueAtTime(0, startTime + 0.8)
    oscillator.start(startTime)
    oscillator.stop(startTime + 0.8)
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume().then(startTone).catch((error: unknown) => {
      console.warn("No se pudo reanudar AudioContext:", error)
      void audioCtx.close().catch(() => undefined)
    })
    return
  }

  startTone()
}

const normalizarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const esMembresiaVencida = (mensaje: string, diasRestantes?: number | null) => {
  const textoNormalizado = normalizarTexto(mensaje)

  return (
    (typeof diasRestantes === "number" && diasRestantes < 0) ||
    textoNormalizado.includes("vencid") ||
    textoNormalizado.includes("expirad") ||
    textoNormalizado.includes("caduc")
  )
}

const esMensajeEsperaHuella = (texto: string) => {
  const textoNormalizado = normalizarTexto(texto)
  return MENSAJES_ESPERA_HUELLA.some((patron) => textoNormalizado.includes(normalizarTexto(patron)))
}

const esMensajeActividadHuella = (texto: string) => {
  const textoNormalizado = normalizarTexto(texto)
  return MENSAJES_ACTIVIDAD_HUELLA.some((patron) => textoNormalizado.includes(normalizarTexto(patron)))
}

const asRecord = (valor: unknown): Record<string, unknown> => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {}
  }

  return valor as Record<string, unknown>
}

const pickBoolean = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "boolean") return value

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (normalized === "true") return true
      if (normalized === "false") return false
    }

    if (typeof value === "number") {
      if (value === 1) return true
      if (value === 0) return false
    }
  }

  return null
}

const pickBooleanFromStatus = (...values: unknown[]) => {
  for (const value of values) {
    const booleanValue = pickBoolean(value)
    if (typeof booleanValue === "boolean") return booleanValue

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (["activo", "active", "running", "listo", "ready"].includes(normalized)) return true
      if (["inactivo", "inactive", "stopped", "detenido", "off"].includes(normalized)) return false
    }
  }

  return null
}

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

const extraerEstadoMotor = (payload: unknown): EstadoMotorDiagnostico => {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  return {
    cacheCargada: pickBoolean(
      root.cacheCargada,
      root.cache_cargada,
      root.cacheLoaded,
      root.cache_loaded,
      data.cacheCargada,
      data.cache_cargada,
      data.cacheLoaded,
      data.cache_loaded,
    ),
    huellasEnMemoria: pickNumber(
      root.huellasEnMemoria,
      root.huellas_en_memoria,
      root.totalHuellas,
      root.total_huellas,
      root.huellaCount,
      data.huellasEnMemoria,
      data.huellas_en_memoria,
      data.totalHuellas,
      data.total_huellas,
      data.huellaCount,
    ),
    lectorConectado: pickBoolean(
      root.lectorConectado,
      root.lector_conectado,
      root.readerConnected,
      root.reader_connected,
      data.lectorConectado,
      data.lector_conectado,
      data.readerConnected,
      data.reader_connected,
    ),
    detectorActivo: pickBooleanFromStatus(
      root.detectorActivo,
      root.detector_activo,
      root.detectorContinuoActivo,
      root.detector_continuo_activo,
      root.detectorContinuo,
      root.backgroundServiceActive,
      data.detectorActivo,
      data.detector_activo,
      data.detectorContinuoActivo,
      data.detector_continuo_activo,
      data.detectorContinuo,
      data.backgroundServiceActive,
    ),
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
  const [mensajeEscaneo, setMensajeEscaneo] = useState("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
  const [estadoMotor, setEstadoMotor] = useState<EstadoMotorDiagnostico>(ESTADO_MOTOR_INICIAL)
  const [ultimoCallbackAt, setUltimoCallbackAt] = useState("")
  const [ultimoEventoMotor, setUltimoEventoMotor] = useState("Sin eventos del motor todavia.")
  const [notificaciones, setNotificaciones] = useState<NotificacionAcceso[]>([])

  const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
  const audioBeepRef = useRef<HTMLAudioElement | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arranqueEventoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const compareAbortRef = useRef<AbortController | null>(null)
  const verificacionEnCursoRef = useRef(false)
  const flujoAccesoActivoRef = useRef(false)
  const motorListoRef = useRef(false)
  const ultimoMensajeMotorRef = useRef("")
  const ultimoEventoIdRef = useRef(0)
  const colaEventosRef = useRef<HuellaMotorEvent[]>([])
  const huboActividadHuellaRef = useRef(false)
  const pollingEnCursoRef = useRef(false)
  const callbackActivoRef = useRef(false)
  const deteccionesRecientesRef = useRef<Map<string, number>>(new Map())
  const notificationTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const isMounted = useRef(true)

  // Inicializar audios
  useEffect(() => {
    audioSuccessRef.current = new Audio("/sounds/success.wav")
    audioBeepRef.current = new Audio("/sounds/beep-start.wav")

    ;[audioSuccessRef, audioBeepRef].forEach((ref) => {
      if (ref.current) {
        ref.current.volume = 0.7
        ref.current.preload = "auto"
      }
    })

    return () => {
      ;[audioSuccessRef, audioBeepRef].forEach((ref) => {
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
      if (autoRetryTimeoutRef.current) clearTimeout(autoRetryTimeoutRef.current)
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current)
      if (arranqueEventoTimeoutRef.current) clearTimeout(arranqueEventoTimeoutRef.current)
      if (compareAbortRef.current) compareAbortRef.current.abort()
      notificationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      notificationTimeoutsRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (estado === "connecting") return

    const interval = setInterval(() => {
      void verificarEstadoMotorEnSegundoPlano()
    }, MOTOR_HEALTHCHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [estado])

  const sincronizarCursorEventos = async () => {
    try {
      const response = await fetch("/api/asistencia/huella/eventos?take=0", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo sincronizar el cursor de eventos.")
      }

      const data = await response.json() as HuellaMotorEventsResponse

      if (data.success) {
        ultimoEventoIdRef.current = data.data.latestId
        callbackActivoRef.current = data.data.latestId > 0
      }
    } catch (error) {
      console.warn("[Huella] No se pudo sincronizar el cursor inicial:", error)
    }
  }

  const consultarEstadoMotor = async () => {
    try {
      const response = await fetch(`${MOTOR_URL}/estado`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo consultar el estado del motor.")
      }

      const data = await response.json()
      const diagnostico = extraerEstadoMotor(data)
      if (isMounted.current) {
        setEstadoMotor(diagnostico)
      }

      return diagnostico
    } catch (error) {
      console.warn("[Huella] No se pudo consultar /estado del motor:", error)

      if (isMounted.current) {
        setEstadoMotor(ESTADO_MOTOR_INICIAL)
      }

      return ESTADO_MOTOR_INICIAL
    }
  }

  const limpiarDeteccionesAntiguas = () => {
    const ahora = Date.now()
    const ventanaMs = 15000

    deteccionesRecientesRef.current.forEach((timestamp, codigo) => {
      if (ahora - timestamp > ventanaMs) {
        deteccionesRecientesRef.current.delete(codigo)
      }
    })
  }

  const yaSeProcesoReciente = (codigoSocio: string) => {
    limpiarDeteccionesAntiguas()
    const ultimaDeteccion = deteccionesRecientesRef.current.get(codigoSocio)
    return typeof ultimaDeteccion === "number"
  }

  const marcarDeteccionReciente = (codigoSocio: string) => {
    limpiarDeteccionesAntiguas()
    deteccionesRecientesRef.current.set(codigoSocio, Date.now())
  }

  const encolarNotificacion = (tipo: TipoNotificacionAcceso, mensaje: string, socio: SocioData | null) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setNotificaciones((prev) => [...prev.slice(-2), { id, tipo, mensaje, socio }])

    const timeout = setTimeout(() => {
      if (!isMounted.current) return

      setNotificaciones((prev) => prev.filter((notificacion) => notificacion.id !== id))
      notificationTimeoutsRef.current.delete(id)
    }, RESULT_NOTIFICATION_DURATION_MS)

    notificationTimeoutsRef.current.set(id, timeout)
  }

  const limpiarNotificaciones = () => {
    notificationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    notificationTimeoutsRef.current.clear()
    setNotificaciones([])
  }

  const obtenerMensajeMotorNoDisponible = (diagnostico?: EstadoMotorDiagnostico) => {
    if (diagnostico?.lectorConectado === false) {
      return "Lector de huella desconectado. Verifica el sensor."
    }

    if (diagnostico?.detectorActivo === false) {
      return "El detector del motor biometrico esta inactivo. Reinicia el lector."
    }

    return "Motor biometrico no disponible. Verifica la conexion con el sensor."
  }

  const manejarMotorNoDisponible = (mensaje: string) => {
    motorListoRef.current = false
    flujoAccesoActivoRef.current = false
    verificacionEnCursoRef.current = false
    callbackActivoRef.current = false
    pollingEnCursoRef.current = false

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (autoRetryTimeoutRef.current) clearTimeout(autoRetryTimeoutRef.current)
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current)
    if (arranqueEventoTimeoutRef.current) clearTimeout(arranqueEventoTimeoutRef.current)
    if (compareAbortRef.current) {
      compareAbortRef.current.abort()
      compareAbortRef.current = null
    }

    colaEventosRef.current = []
    setSocioData(null)
    setProgress(0)
    setErrorMsg(mensaje)
    limpiarNotificaciones()
    setEstado("no-device")
  }

  const verificarEstadoMotorEnSegundoPlano = async () => {
    if (!isMounted.current || estado === "connecting") return

    const diagnostico = await consultarEstadoMotor()
    const lectorDesconectado = diagnostico.lectorConectado === false
    const detectorInactivo = diagnostico.detectorActivo === false
    const estadoSinRespuesta =
      motorListoRef.current &&
      diagnostico.lectorConectado === null &&
      diagnostico.detectorActivo === null &&
      diagnostico.cacheCargada === null

    if (lectorDesconectado || detectorInactivo || estadoSinRespuesta) {
      manejarMotorNoDisponible(obtenerMensajeMotorNoDisponible(diagnostico))
    }
  }

  const procesarSiguienteEvento = () => {
    if (!isMounted.current || flujoAccesoActivoRef.current || verificacionEnCursoRef.current) return

    const evento = colaEventosRef.current.shift()
    if (!evento) return

    callbackActivoRef.current = true

    const mensajeEvento = (evento.message || "").trim()
    setUltimoCallbackAt(evento.receivedAt)
    setUltimoEventoMotor(
      mensajeEvento ||
      (evento.codigoSocio ? `Huella detectada para ${evento.codigoSocio}` : "Evento recibido desde el motor.")
    )

    if (evento.kind === "info" || evento.kind === "wait") {
      if (evento.kind === "wait") {
        setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
      }

      setTimeout(() => {
        procesarSiguienteEvento()
      }, 0)
      return
    }

    if (!evento.codigoSocio) {
      flujoAccesoActivoRef.current = true
      const mensajeError = mensajeEvento || "Huella no reconocida."
      setProgress(100)
      setMensajeEscaneo(mensajeError)
      encolarNotificacion("error", mensajeError, null)
      playWebAudioTone("error")
      resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      return
    }

    if (yaSeProcesoReciente(evento.codigoSocio)) {
      setTimeout(() => {
        procesarSiguienteEvento()
      }, 0)
      return
    }

    flujoAccesoActivoRef.current = true
    setEstado("scanning")
    setProgress(35)
    setSocioData(null)
    setErrorMsg("")
    setMensajeEscaneo(mensajeEvento || "Huella detectada. Preparando validacion...")
    safePlay(audioBeepRef)

    if (arranqueEventoTimeoutRef.current) clearTimeout(arranqueEventoTimeoutRef.current)
    arranqueEventoTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return

      marcarDeteccionReciente(evento.codigoSocio!)
      setEstado("validating")
      setProgress(80)
      setMensajeEscaneo("Validando asistencia y membresia...")
      void registrarAsistencia(evento.codigoSocio!, evento.confidence ?? 100)
    }, 250)
  }

  const programarPollingEventos = (delay = EVENT_POLL_INTERVAL_MS) => {
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current)

    pollingTimeoutRef.current = setTimeout(() => {
      void consultarEventosMotor()
    }, delay)
  }

  const programarEscuchaAutomatica = (delay = EVENT_POLL_INTERVAL_MS) => {
    if (autoRetryTimeoutRef.current) clearTimeout(autoRetryTimeoutRef.current)

    autoRetryTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return
      programarPollingEventos(0)

      if (!callbackActivoRef.current && !verificacionEnCursoRef.current && !flujoAccesoActivoRef.current) {
        void iniciarVerificacion(true)
      }
    }, delay)
  }

  const consultarEventosMotor = async () => {
    if (!isMounted.current || pollingEnCursoRef.current) return

    pollingEnCursoRef.current = true
    const after = ultimoEventoIdRef.current

    try {
      const response = await fetch(`/api/asistencia/huella/eventos?after=${after}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudieron obtener eventos del motor.")
      }

      const data = await response.json() as HuellaMotorEventsResponse

      if (data.success) {
        if (typeof data.data.latestId === "number") {
          ultimoEventoIdRef.current = Math.max(ultimoEventoIdRef.current, data.data.latestId)
          callbackActivoRef.current = callbackActivoRef.current || data.data.latestId > 0
        }

        const nuevosEventos = data.data.eventos.filter((evento) => evento.id > after)
        if (nuevosEventos.length > 0) {
          callbackActivoRef.current = true
          if (compareAbortRef.current) {
            compareAbortRef.current.abort()
            compareAbortRef.current = null
          }

          const ultimoEvento = nuevosEventos[nuevosEventos.length - 1]
          setUltimoCallbackAt(ultimoEvento.receivedAt)
          setUltimoEventoMotor(
            (ultimoEvento.message || "").trim() ||
            (ultimoEvento.codigoSocio
              ? `Huella detectada para ${ultimoEvento.codigoSocio}`
              : "Evento recibido desde el motor.")
          )
          colaEventosRef.current.push(...nuevosEventos)
          procesarSiguienteEvento()
        }
      }
    } catch (error) {
      console.warn("[Huella] Error leyendo eventos del callback:", error)
    } finally {
      pollingEnCursoRef.current = false
      if (isMounted.current) {
        programarPollingEventos()
      }
    }
  }

  // ============================================================================
  // INICIALIZAR MOTOR: Cargar huellas en cache del motor C#
  // ============================================================================
  const inicializarMotor = async () => {
    if (!isMounted.current) return

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (autoRetryTimeoutRef.current) clearTimeout(autoRetryTimeoutRef.current)
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current)
    if (arranqueEventoTimeoutRef.current) clearTimeout(arranqueEventoTimeoutRef.current)
    if (compareAbortRef.current) {
      compareAbortRef.current.abort()
      compareAbortRef.current = null
    }

    setEstado("connecting")
    setProgress(0)
    setSocioData(null)
    setErrorMsg("")
    setCountdown(5)
    setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
    setUltimoCallbackAt("")
    setUltimoEventoMotor("Sin eventos del motor todavia.")
    setEstadoMotor(ESTADO_MOTOR_INICIAL)
    limpiarNotificaciones()
    colaEventosRef.current = []
    flujoAccesoActivoRef.current = false
    ultimoEventoIdRef.current = 0
    ultimoMensajeMotorRef.current = ""
    huboActividadHuellaRef.current = false
    pollingEnCursoRef.current = false
    callbackActivoRef.current = false
    motorListoRef.current = false
    verificacionEnCursoRef.current = false
    deteccionesRecientesRef.current.clear()

    try {
      const token = AuthService.getToken()
      if (!token) throw new Error("No se encontro la sesion para sincronizar huellas.")
      await sincronizarCacheMotorHuella(token)
      /*

      
      if (!resMotor.ok) throw new Error("Error al inyectar huellas en el motor biométrico.")

      */
      if (isMounted.current) {
        const diagnostico = await consultarEstadoMotor()
        const motorDisponible =
          diagnostico.lectorConectado !== false &&
          diagnostico.detectorActivo !== false

        if (!motorDisponible) {
          throw new Error(obtenerMensajeMotorNoDisponible(diagnostico))
        }

        motorListoRef.current = true
        setEstado("idle")
        await sincronizarCursorEventos()
        programarPollingEventos(0)
        programarEscuchaAutomatica(1200)
      }
    } catch (err: any) {
      console.error("❌ Error inicializando motor:", err)
      if (isMounted.current) {
        manejarMotorNoDisponible(
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
  const iniciarVerificacion = async (silenciarEspera = false) => {
    if (!motorListoRef.current || !isMounted.current || verificacionEnCursoRef.current) return

    if (autoRetryTimeoutRef.current) clearTimeout(autoRetryTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    verificacionEnCursoRef.current = true

    setEstado("scanning")
    setProgress(0)
    setSocioData(null)
    setErrorMsg("")
    setCountdown(5)
    setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
    ultimoMensajeMotorRef.current = ""
    huboActividadHuellaRef.current = false

    // Animación de progreso
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const incremento = huboActividadHuellaRef.current ? 10 : 2
        const siguiente = prev + incremento
        return siguiente >= 85 ? 85 : siguiente
      })
    }, 250)

    try {
      const controller = new AbortController()
      compareAbortRef.current = controller

      const resMotor = await fetch(`${MOTOR_URL}/comparar`, {
        method: "POST",
        signal: controller.signal,
      })

      if (!resMotor.ok) throw new Error("No se pudo iniciar la lectura del lector biometrico.")
      if (!resMotor.body) throw new Error("El navegador no soporta streams de respuesta.")

      const streamReader = resMotor.body.getReader()
      const decoder = new TextDecoder("utf-8")

      let matchSuccess = false
      let codigoSocioMatch = ""
      let confidenceMatch = 100
      let mensajeErrorMotor = ""
      let buffer = ""

      while (true) {
        const { done, value } = await streamReader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lineas = buffer.split("\n")
        buffer = lineas.pop() || ""

        for (const linea of lineas) {
          try {
            const data = JSON.parse(linea)
            if (data.tipo === "mensaje") {
              const texto = String(data.texto || "").trim()
              if (texto) {
                ultimoMensajeMotorRef.current = texto
                setMensajeEscaneo(texto)

                if (esMensajeActividadHuella(texto) && !huboActividadHuellaRef.current) {
                  huboActividadHuellaRef.current = true
                  safePlay(audioBeepRef)
                  setProgress((prev) => (prev < 20 ? 20 : prev))
                }
              }
              continue
            }
            if (data.tipo === "resultado") {
              if (!data.success) {
                mensajeErrorMotor =
                  data.message ||
                  ultimoMensajeMotorRef.current ||
                  "Huella no reconocida."
                break
              }
              matchSuccess = true
              codigoSocioMatch = data.codigoSocio
              confidenceMatch = data.confidence ?? 100
              huboActividadHuellaRef.current = true
              break
            }
          } catch {
            // ignorar líneas no JSON
          }
        }

        if (matchSuccess || mensajeErrorMotor) break
      }

      clearInterval(progressInterval)
      setProgress(90)

      if (!isMounted.current) return

      if (matchSuccess) {
        if (yaSeProcesoReciente(codigoSocioMatch)) {
          setProgress(0)
          setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
          programarEscuchaAutomatica(AUTO_RETRY_DELAY_MS)
          return
        }

        marcarDeteccionReciente(codigoSocioMatch)
        setEstado("validating")
        setMensajeEscaneo("Validando asistencia y membresia...")
        await registrarAsistencia(codigoSocioMatch, confidenceMatch)
      } else {
        const mensajeNoCoincidencia =
          mensajeErrorMotor ||
          ultimoMensajeMotorRef.current ||
          "Huella no reconocida. Intenta de nuevo."

        const esEsperaSilenciosa =
          !huboActividadHuellaRef.current || esMensajeEsperaHuella(mensajeNoCoincidencia)

        if (silenciarEspera && esEsperaSilenciosa) {
          setProgress(0)
          setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
          programarEscuchaAutomatica(AUTO_RETRY_DELAY_MS)
          return
        }

        setMensajeEscaneo(mensajeNoCoincidencia)
        encolarNotificacion("error", mensajeNoCoincidencia, null)
        playWebAudioTone("error")
        resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error("❌ Error en comparación:", err)
      if (err?.name === "AbortError") return
      manejarMotorNoDisponible(
        err?.message?.includes("fetch")
          ? "Motor biométrico no disponible en el puerto 4000."
          : err?.message || "Error al comunicarse con el motor biométrico."
      )
    } finally {
      verificacionEnCursoRef.current = false
      compareAbortRef.current = null
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
      const socioValidado = await completarSocioConDetalle(
        enriquecerSocioConConfianza(
          (dataValidar?.data || null) as SocioData | null,
          confidence,
        )
      )

      if (resValidar.ok && dataValidar.success) {
        const diasRestantes = calcularDiasRestantesMembresia(
          socioValidado?.socio?.fecha_fin_membresia || ""
        )

        if (diasRestantes < 0) {
          encolarNotificacion("error", "Membresía vencida", socioValidado)
          setErrorMsg("Membresía vencida")
          playWebAudioTone("error")
        } else if (diasRestantes <= 3) {
          setEstado("warning")
          encolarNotificacion("warning", "Tu membresía está próxima a vencer", socioValidado)
          safePlay(audioSuccessRef)
        } else {
          setEstado("success")
          encolarNotificacion("success", "Acceso permitido", socioValidado)
          safePlay(audioSuccessRef)
        }
        resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      } else if (resValidar.status === 403) {
        const bloqueoPorVencimiento = esMembresiaVencida(
          String(dataValidar.message || ""),
          socioValidado?.socio?.fecha_fin_membresia
            ? calcularDiasRestantesMembresia(socioValidado.socio.fecha_fin_membresia)
            : null
        )

        setEstado(bloqueoPorVencimiento ? "error" : "warning")
        setSocioData(socioValidado)
        setErrorMsg(
          bloqueoPorVencimiento
            ? "Membresía vencida"
            : dataValidar.message || "Membresía con restricciones."
        )
        encolarNotificacion(
          bloqueoPorVencimiento ? "error" : "warning",
          bloqueoPorVencimiento
            ? "Membresía vencida"
            : dataValidar.message || "Membresía con restricciones.",
          socioValidado
        )
        playWebAudioTone(bloqueoPorVencimiento ? "error" : "warning")
        resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      } else {
        setSocioData(socioValidado)
        setEstado("error")
        setErrorMsg(dataValidar.message || "No se pudo registrar la asistencia.")
        encolarNotificacion("error", dataValidar.message || "No se pudo registrar la asistencia.", socioValidado)
        playWebAudioTone("error")
        resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      }
    } catch (err: any) {
      console.error("❌ Error registrando asistencia:", err)
      if (isMounted.current) {
        setEstado("error")
        setErrorMsg("Error de conexión al validar membresía.")
        encolarNotificacion("error", "Error de conexión al validar membresía.", null)
        playWebAudioTone("error")
        resetear(READY_FOR_NEXT_SCAN_DELAY_MS)
      }
    }
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

  const resetear = (delay = AUTO_RETRY_DELAY_MS) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    flujoAccesoActivoRef.current = false
    setEstado("idle")
    setProgress(0)
    setSocioData(null)
    setErrorMsg("")
    setCountdown(5)
    setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")

    if (arranqueEventoTimeoutRef.current) clearTimeout(arranqueEventoTimeoutRef.current)
    procesarSiguienteEvento()
    programarEscuchaAutomatica(delay)
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

  const notificacionActiva = notificaciones[notificaciones.length - 1] ?? null

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

          {!notificacionActiva && (estado === "idle" || estado === "success" || estado === "warning" || estado === "error" || estado === "scanning" || estado === "validating") && (
            <PantallaBaseHuella estado={estado} mensaje={mensajeEscaneo} />
          )}

          {estado === "no-device" && (
            <PantallaNoDevice mensaje={errorMsg} onRetry={inicializarMotor} />
          )}

          {!notificacionActiva && (
            <div className="mt-6 rounded-2xl border border-border/50 bg-card/40 px-5 py-4 text-sm text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-foreground">Ultimo callback:</span>{" "}
                  {ultimoCallbackAt
                    ? new Date(ultimoCallbackAt).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })
                    : "Sin recibir aun"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Lector:</span>{" "}
                  {estadoMotor.lectorConectado === null
                    ? "Sin dato"
                    : estadoMotor.lectorConectado
                    ? "Conectado"
                    : "No conectado"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Detector continuo:</span>{" "}
                  {estadoMotor.detectorActivo === null
                    ? "Sin dato"
                    : estadoMotor.detectorActivo
                    ? "Activo"
                    : "Inactivo"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Cache cargada:</span>{" "}
                  {estadoMotor.cacheCargada === null
                    ? "Sin dato"
                    : estadoMotor.cacheCargada
                    ? "Si"
                    : "No"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Huellas en cache:</span>{" "}
                  {estadoMotor.huellasEnMemoria ?? "Sin dato"}
                </p>
              </div>
              <p className="mt-3 border-t border-border/40 pt-3">
                <span className="font-semibold text-foreground">Ultimo evento:</span>{" "}
                {ultimoEventoMotor}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer con métodos alternativos */}
      {notificacionActiva && (
        <NotificacionAccesoCard
          notificacion={notificacionActiva}
        />
      )}

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
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-accent/10 border-4 border-accent/30 flex items-center justify-center animate-pulse">
              <Fingerprint className="h-20 w-20 text-accent" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
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

function PantallaIdle() {
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
          <h2 className="text-4xl font-bold text-foreground">Escuchando el lector</h2>
          <p className="hidden text-xl text-muted-foreground">
            Presiona el botón y coloca tu dedo en el sensor cuando se solicite
          </p>
          <p className="text-xl text-muted-foreground">
            Coloca tu dedo en el sensor. La asistencia se registrara automaticamente.
          </p>
        </div>

        {/* Botón de inicio */}
        <div className="mt-10 flex items-center justify-center gap-3 text-accent">
          <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
          <p className="text-lg font-semibold">Esperando huella...</p>
        </div>
      </div>
    </div>
  )
}

function PantallaBaseHuella({
  estado,
  mensaje,
}: {
  estado: EstadoAsistencia
  mensaje: string
}) {
  const estaValidando = estado === "validating"
  const estaCapturando = estado === "scanning"
  const titulo = estaValidando ? "Validando Identidad" : "Escuchando el lector"
  const subtitulo = estaValidando
    ? "Comparando con base de datos..."
    : mensaje || "Coloca tu dedo en el sensor. La asistencia se registrara automaticamente."

  return (
    <div className="animate-fade-in">
      <div className={`bg-gradient-to-br from-card to-card/50 rounded-3xl p-12 border-2 shadow-2xl ${
        estaValidando || estaCapturando ? "border-accent/50" : "border-border/50"
      }`}>
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center ${
              estaValidando || estaCapturando
                ? "bg-accent/15 border-accent/40 shadow-[0_0_60px_rgba(245,158,11,0.18)] animate-pulse"
                : "bg-accent/10 border-accent/30 animate-pulse-slow"
            }`}>
              <Fingerprint className="h-20 w-20 text-accent" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">{titulo}</h2>
          <p className="text-xl text-muted-foreground">{subtitulo}</p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-accent">
          <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
          <p className="text-lg font-semibold">
            {estaValidando ? "Validando..." : estaCapturando ? "Procesando huella..." : "Esperando huella..."}
          </p>
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

function PantallaScanning({
  progress,
  estado,
  mensaje,
}: {
  progress: number
  estado: EstadoAsistencia
  mensaje: string
}) {
  const estaEscuchando = estado === "scanning" && progress < 20

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
        <div className="hidden text-center space-y-4 mb-8">
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

        <div className="text-center space-y-4 mb-8">
          <h2 className="text-4xl font-bold text-foreground">
            {estado === "validating"
              ? "Validando Identidad"
              : estaEscuchando
              ? "Escuchando Huella"
              : "Capturando Huella"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {estado === "validating"
              ? "Comparando con base de datos..."
              : mensaje || "Mantén el dedo firme en el sensor..."}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-3">
          <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-300 ease-out rounded-full ${
                estaEscuchando ? "animate-pulse" : ""
              }`}
              style={{ width: `${Math.max(progress, estaEscuchando ? 12 : 0)}%` }}
            />
          </div>
          <p className="text-center text-2xl font-bold text-accent tabular-nums">
            {estaEscuchando ? "Escuchando..." : `${progress}%`}
          </p>
        </div>
      </div>
    </div>
  )
}

function NotificacionAccesoCard({ notificacion }: { notificacion: NotificacionAcceso }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 py-6 md:px-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        {notificacion.tipo === "success" && notificacion.socio ? (
          <PantallaSuccess socio={notificacion.socio} />
        ) : notificacion.tipo === "warning" && notificacion.socio ? (
          <PantallaWarning socio={notificacion.socio} />
        ) : (
          <PantallaError mensaje={notificacion.mensaje} socio={notificacion.socio} />
        )}
      </div>
    </div>
  )

  /*
  const diasRestantes = notificacion.socio
    ? calcularDiasRestantesMembresia(notificacion.socio.socio.fecha_fin_membresia)
    : null
  const precision = formatearNivelConfianza(notificacion.socio?.asistencia?.match_score)
  const esVencida = notificacion.tipo === "error" && esMembresiaVencida(notificacion.mensaje, diasRestantes)

  const config =
    notificacion.tipo === "success"
      ? {
          Icon: CheckCircle2,
          titulo: "Acceso permitido",
          cardClass: "border-green-500/40 bg-green-500/12",
          iconClass: "border-green-500/40 bg-green-500/15 text-green-400",
          accentClass: "text-green-300",
        }
      : notificacion.tipo === "warning"
      ? {
          Icon: AlertTriangle,
          titulo: "Acceso con aviso",
          cardClass: "border-amber-500/40 bg-amber-500/12",
          iconClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
          accentClass: "text-amber-200",
        }
      : {
          Icon: XCircle,
          titulo: esVencida ? "Membresía vencida" : "Acceso denegado",
          cardClass: "border-red-500/40 bg-red-500/12",
          iconClass: "border-red-500/40 bg-red-500/15 text-red-300",
          accentClass: "text-red-200",
        }

  const resumenVencimiento =
    diasRestantes === null
      ? null
      : diasRestantes < 0
      ? `Venció hace ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? "día" : "días"}`
      : diasRestantes === 0
      ? "Vence hoy"
      : `Vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`

  return (
    <div className={`overflow-hidden rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-md ${config.cardClass}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${config.iconClass}`}>
          <config.Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${config.accentClass}`}>
                {config.titulo}
              </p>
              <p className="mt-1 text-sm text-white/90">{notificacion.mensaje}</p>
            </div>
            <div className="h-2 w-2 shrink-0 rounded-full bg-white/70 animate-pulse" />
          </div>

          {notificacion.socio && (
            <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/10">
                  <AvatarImage src={notificacion.socio.socio.foto_perfil_url || undefined} />
                  <AvatarFallback className="bg-white/10 text-sm text-white">
                    {notificacion.socio.socio.nombre_completo.split(" ").map((nombre) => nombre[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {notificacion.socio.socio.nombre_completo}
                  </p>
                  <p className="truncate text-xs text-white/70">
                    {notificacion.socio.socio.codigo_socio} · {obtenerNombreMembresia(notificacion.socio)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                <p>Confianza: <span className="font-semibold text-white/90">{precision}</span></p>
                <p>Vigencia: <span className="font-semibold text-white/90">{resumenVencimiento || "No disponible"}</span></p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <Clock className="h-3.5 w-3.5" />
            <span>Se oculta sola y el lector sigue activo.</span>
          </div>
        </div>
      </div>
    </div>
  )
  */
}

function PantallaSuccess({ socio, countdown }: { socio: SocioData, countdown?: number }) {
  const horaEntrada = socio.asistencia?.timestamp
    ? new Date(socio.asistencia.timestamp).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No disponible"

  const precision = formatearNivelConfianza(socio.asistencia?.match_score)
  const diasRestantes = calcularDiasRestantesMembresia(socio.socio.fecha_fin_membresia)

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-card via-card to-card rounded-3xl p-12 border-2 border-green-500/50 shadow-2xl">
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
        <div className="bg-background rounded-2xl p-8 space-y-6">
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
              <p className="text-lg font-bold text-foreground">{obtenerNombreMembresia(socio)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">📅 Vencimiento</p>
              <p className="text-lg font-bold text-foreground">
                {formatearFechaMembresia(socio.socio.fecha_fin_membresia)}
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

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-center text-sm text-muted-foreground">
            Confianza de lectura:{" "}
            <span className="font-bold text-amber-500">{precision}</span>
          </p>
        </div>

        {typeof countdown === "number" && countdown > 0 && (
          <p className="text-center text-muted-foreground mt-8 text-lg">
            Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
          </p>
        )}
      </div>
    </div>
  )
}

function PantallaWarning({ socio, countdown }: { socio: SocioData, countdown?: number }) {
  const horaEntrada = socio.asistencia?.timestamp
    ? new Date(socio.asistencia.timestamp).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No disponible"

  const diasRestantes = calcularDiasRestantesMembresia(socio.socio.fecha_fin_membresia)
  const precision = formatearNivelConfianza(socio.asistencia?.match_score)
  const mensajeVencimiento =
    diasRestantes === 0
      ? "⏰ Tu membresía vence hoy"
      : `⏰ Tu membresía vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`

  if (diasRestantes < 0) {
    return <PantallaError mensaje="Membresía vencida" countdown={countdown} socio={socio} />
  }

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-card via-card to-card rounded-3xl p-12 border-2 border-amber-500/50 shadow-2xl">
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
        <div className="bg-background rounded-2xl p-8 space-y-6">
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
                {mensajeVencimiento}
              </p>
              <p className="text-lg text-foreground">
                📅 Fecha de vencimiento: {formatearFechaMembresia(socio.socio.fecha_fin_membresia, {
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
              <p className="text-lg font-bold text-foreground">{obtenerNombreMembresia(socio)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-center text-sm text-muted-foreground">
              Confianza de lectura:{" "}
              <span className="font-bold text-amber-500">{precision}</span>
            </p>
          </div>
        </div>

        {typeof countdown === "number" && countdown > 0 && (
          <p className="text-center text-muted-foreground mt-8 text-lg">
            Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
          </p>
        )}
      </div>
    </div>
  )
}

function PantallaError({ mensaje, countdown, socio }: { mensaje: string, countdown?: number, socio: SocioData | null }) {
  const mensajesMotivacionales = {
    vencida: {
      titulo: "Membresía Vencida",
      emoji: "⏰",
      accion: "Por favor, acude a recepción para renovar tu membresía.",
      cta: "¡Renueva hoy y no pierdas tu membresía!"
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

  const precision = formatearNivelConfianza(socio?.asistencia?.match_score)
  const diasRestantes = socio
    ? calcularDiasRestantesMembresia(socio.socio.fecha_fin_membresia)
    : null
  const tipo = esMembresiaVencida(mensaje, diasRestantes)
    ? 'vencida'
    : normalizarTexto(mensaje).includes('no reconocida')
    ? 'noReconocida'
    : 'default'
  const mensajePrincipal = tipo === 'vencida' ? 'Membresía vencida' : mensaje
  
  const info = mensajesMotivacionales[tipo]

  return (
    <div className="animate-scale-in">
      <div className="bg-gradient-to-br from-card via-card to-card rounded-3xl p-12 border-2 border-red-500/50 shadow-2xl">
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
        <div className="bg-background rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-xl text-foreground font-semibold">
              {mensajePrincipal}
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
            <div className="space-y-4 border-t border-border/30 pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Socio: {socio.socio.nombre_completo} ({socio.socio.codigo_socio})
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Membresia</p>
                  <p className="mt-1 text-base font-bold text-foreground">{obtenerNombreMembresia(socio)}</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Confianza</p>
                  <p className="mt-1 text-base font-bold text-red-400">{precision}</p>
                </div>
              </div>

              {tipo === "vencida" && diasRestantes !== null && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                  <p className="text-center text-lg font-bold text-red-400">
                    Membresia vencida hace {Math.abs(diasRestantes)} {Math.abs(diasRestantes) === 1 ? "dia" : "dias"}
                  </p>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Fecha de vencimiento: {formatearFechaMembresia(socio.socio.fecha_fin_membresia)}
                  </p>
                </div>
              )}
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

        {typeof countdown === "number" && countdown > 0 && (
          <p className="text-center text-muted-foreground mt-8 text-lg">
            Auto-cierre en <span className="font-bold text-accent tabular-nums">{countdown}s</span>
          </p>
        )}
      </div>
    </div>
  )
}


