"use client"

import { useState, useEffect, useRef } from "react"
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { AuthService } from "@/lib/auth"
import { SociosService } from "@/lib/services/socios"
import { sincronizarCacheMotorHuella, consumirEventosMotorSse, MOTOR_SSE, motorFetch, biometricApiFetch, BIOMETRIC_LEGACY, BIOMETRIC_CHANGED_EVENT, BIOMETRIC_CHANNEL, KIOSK_ID, MOTOR_URL, type BiometricCacheNotice } from "@/lib/motor-huella"
import { waitMotorRetry } from "@/lib/motor-sse.mjs"
import { getKioskAudio, attachKioskAudioRecovery, type KioskAudio, type KioskAudioState } from "@/lib/kiosk-audio.mjs"
import { deliverEvent, validateEventPage } from "@/lib/biometric-protocol.mjs"
import type { HuellaMotorEvent, HuellaMotorEventsResponse } from "@/lib/types/asistencia-huella"
import { extractYmd, formatYmdForDisplay, getDaysUntilYmd } from "@/lib/timezone"

// ============================================================================
// CONSTANTES
// ============================================================================

const MOTOR_EVENTOS_URL = `${MOTOR_URL}/eventos`
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
  cacheState: string | null
  cacheStale: boolean
  lastSyncUtc: string | null
  lastSyncError: string | null
  queueError: string | null
  instanceId: string | null
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
  allowed: boolean
}

const ESTADO_MOTOR_INICIAL: EstadoMotorDiagnostico = {
  cacheCargada: null,
  huellasEnMemoria: null,
  lectorConectado: null,
  detectorActivo: null,
  cacheState: null,
  cacheStale: false,
  lastSyncUtc: null,
  lastSyncError: null,
  queueError: null,
  instanceId: null,
}

const calcularDiasRestantesMembresia = (fechaFin: string): number => {
  if (!fechaFin) return 999

  const fechaFinYmd = extractYmd(fechaFin)
  if (!fechaFinYmd) return 999
  return getDaysUntilYmd(fechaFinYmd)
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

  const fechaYmd = extractYmd(fecha)
  if (!fechaYmd) return "No disponible"

  return formatYmdForDisplay(fechaYmd, "es-MX", options)
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
      if (["activo", "active", "running", "listo", "ready", "scanning", "enrolling"].includes(normalized)) return true
      if (["inactivo", "inactive", "stopped", "detenido", "off", "waiting_cache", "waiting_reader", "queue_blocked"].includes(normalized)) return false
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
    cacheState: typeof root.cacheState === "string" ? root.cacheState : null,
    cacheStale: root.cacheStale === true,
    lastSyncUtc: typeof root.lastSyncUtc === "string" ? root.lastSyncUtc : null,
    lastSyncError: typeof root.lastSyncError === "string" ? root.lastSyncError : null,
    queueError: typeof root.queueError === "string" ? root.queueError : null,
    instanceId: typeof root.instanceId === "string" ? root.instanceId : null,
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
  const [errorMsg, setErrorMsg] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mensajeEscaneo, setMensajeEscaneo] = useState("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
  const [estadoMotor, setEstadoMotor] = useState<EstadoMotorDiagnostico>(ESTADO_MOTOR_INICIAL)
  const [ultimoCallbackAt, setUltimoCallbackAt] = useState("")
  const [ultimoEventoMotor, setUltimoEventoMotor] = useState("Sin eventos del motor todavía.")
  const [notificaciones, setNotificaciones] = useState<NotificacionAcceso[]>([])
  const [syncMessage, setSyncMessage] = useState("")
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sessionReason, setSessionReason] = useState<"missing" | "expired">("expired")
  const audioRef = useRef<KioskAudio | null>(null)
  const [audioState, setAudioState] = useState<KioskAudioState>("blocked")
  const mounted = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const sseAbortRef = useRef<AbortController | null>(null)
  const cursorRef = useRef(0)
  const instanceRef = useRef<string | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingRef = useRef(false)
  const syncingRef = useRef(false)
  const syncRequestedRef = useRef(false)
  const motorCacheMissingRef = useRef(false)
  const healthRef = useRef(false)
  const expiredRef = useRef(false)
  const pendingRef = useRef(false)
  const backoffRef = useRef(750)
  const notificationTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const shownEvents = useRef(new Set<string>())

  const stopForSession = (error: any) => {
    if (error?.status !== 401) return false
    expiredRef.current = true
    sseAbortRef.current?.abort()
    setSessionExpired(true)
    setSessionReason(AuthService.getToken() ? "expired" : "missing")
    setEstado("error")
    setErrorMsg(AuthService.getToken()
      ? "La sesión expiró. Los eventos siguen pendientes en el motor."
      : "No has iniciado sesión. Inicia sesión para continuar.")
    setMensajeEscaneo("Inicia sesión para continuar. Ningún ingreso ha sido autorizado sin respuesta del servidor.")
    return true
  }

  const encolarNotificacion = (tipo: TipoNotificacionAcceso, mensaje: string, socio: SocioData | null, allowed = false) => {
    const id = crypto.randomUUID()
    setNotificaciones(previous => [...previous.slice(-2), { id, tipo, mensaje, socio, allowed }])
    const timer = setTimeout(() => {
      if (mounted.current) setNotificaciones(previous => previous.filter(item => item.id !== id))
      notificationTimers.current = notificationTimers.current.filter(item => item !== timer)
    }, RESULT_NOTIFICATION_DURATION_MS)
    notificationTimers.current.push(timer)
  }

  const aplicarEstadoMotor = (payload: any) => {
      const diagnostic = extraerEstadoMotor(payload)
      if (!mounted.current) return
      setEstadoMotor(diagnostic)
      // One recovery push when a restarted motor reports an empty/uninitialized cache.
      // Failed pushes wait for a change, reconnection or explicit retry; no cloud polling.
      if (diagnostic.cacheCargada === false && !motorCacheMissingRef.current && !syncingRef.current) void sincronizar()
      motorCacheMissingRef.current = diagnostic.cacheCargada === false
      if (typeof payload.lastError === "string" && payload.lastError) setUltimoEventoMotor(payload.lastError)
      if (diagnostic.cacheCargada !== true || diagnostic.lectorConectado !== true || diagnostic.detectorActivo !== true || diagnostic.queueError) {
        setEstado("no-device")
        setErrorMsg(diagnostic.queueError || (diagnostic.cacheCargada !== true ? "Caché biométrica no inicializada. Sincroniza para reconocer huellas." : diagnostic.lectorConectado !== true ? "Lector desconectado. El motor intentará reconectarlo." : "El lector no está disponible para detección continua."))
      } else if (!pendingRef.current) {
        setEstado("idle")
        setErrorMsg("")
      }
  }

  const consultarEstadoMotor = async () => {
    if (!mounted.current || healthRef.current || expiredRef.current) return
    healthRef.current = true
    try {
      const response = await motorFetch("/estado", {}, { signal: abortRef.current?.signal })
      if (!response.ok) throw new Error("No se pudo consultar el estado del motor.")
      const payload = await response.json()
      aplicarEstadoMotor(payload)
    } catch (error: any) {
      if (!mounted.current || stopForSession(error)) return
      setEstadoMotor(ESTADO_MOTOR_INICIAL)
      setEstado("no-device")
      setErrorMsg("No se pudo contactar al motor local. Verifica que está abierto y que el navegador permita acceder al lector local.")
    } finally { healthRef.current = false }
  }

  const sincronizar = async () => {
    if (!mounted.current || expiredRef.current) return
    syncRequestedRef.current = true
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      do {
        syncRequestedRef.current = false
        setSyncMessage("Sincronizando caché…")
        try {
          const result = await sincronizarCacheMotorHuella(undefined, { signal: abortRef.current?.signal })
          if (mounted.current) setSyncMessage(`Caché sincronizada: ${result.totalCargadas} huellas.`)
        } catch (error: any) {
          if (!mounted.current || stopForSession(error)) return
          setSyncMessage(error?.message || "Sincronización fallida. Se conserva la caché anterior; el backend sigue autorizando cada ingreso.")
        }
        // A mutation arriving during a load must not be lost behind the older snapshot.
      } while (syncRequestedRef.current && mounted.current && !expiredRef.current)
    } finally { syncingRef.current = false }
  }

  const mostrarResultado = (event: HuellaMotorEvent, result: Awaited<ReturnType<typeof deliverEvent>>) => {
    const key = event.eventId || `${instanceRef.current}:${event.id}`
    if (shownEvents.current.has(key)) return
    shownEvents.current.add(key)
    if (shownEvents.current.size > 500) shownEvents.current.delete(shownEvents.current.values().next().value!)
    const presentation = result.presentation
    if (MOTOR_SSE) setUltimoEventoMotor(`${event.codigoSocio}: ${presentation.message}`)
    const data = result.payload?.data
    const socio = data?.socio && typeof data.socio.nombre_completo === "string" ? data as SocioData : null
    encolarNotificacion(presentation.type as TipoNotificacionAcceso, presentation.message, socio, presentation.allowed)
    audioRef.current?.play(presentation.type as TipoNotificacionAcceso)
    setMensajeEscaneo("Escuchando el sensor. Coloca tu dedo en cualquier momento.")
    setEstado("idle")
  }

  const procesarPagina = async (streamPage?: HuellaMotorEventsResponse): Promise<boolean> => {
    let payload = streamPage
    if (!payload) {
    const response = await motorFetch(`/eventos?after=${cursorRef.current}&take=20`, {}, { signal: abortRef.current?.signal })
    if (!response.ok) throw new Error("No se pudieron recuperar los eventos locales.")
    payload = await response.json() as HuellaMotorEventsResponse
    }
    const instance = payload.data?.instanceId
    if (payload.data?.cursorReset === true || instance && instanceRef.current && instance !== instanceRef.current) {
      // Durable IDs survive reboot, but restarting at zero recovers every pending event.
      instanceRef.current = instance || null
      cursorRef.current = 0
      return true
    }
    if (instance) instanceRef.current = instance
    if (BIOMETRIC_LEGACY && typeof payload.data?.latestId === "number" && payload.data.latestId < cursorRef.current) {
      cursorRef.current = 0
      return true
    }
    const events: HuellaMotorEvent[] = validateEventPage(payload, cursorRef.current)
    for (const event of events) {
      if (!mounted.current || expiredRef.current) return false
      setUltimoCallbackAt(event.capturedAtUtc || event.receivedAt)
      setUltimoEventoMotor(event.message || "Huella reconocida. Autorización pendiente.")
      if (BIOMETRIC_LEGACY && !event.codigoSocio) {
        if (event.kind === "error") encolarNotificacion("error", event.message || "Huella no reconocida", null)
        cursorRef.current = event.id
        continue
      }
      pendingRef.current = true
      setEstado("validating")
      setMensajeEscaneo("Huella reconocida. Autorización pendiente del servidor…")
      const result = await deliverEvent({ ...event, kioskId: KIOSK_ID }, async (body: object) => {
        const server = await biometricApiFetch("/asistencia/huellas/validar", { method: "POST", body: JSON.stringify(body), signal: abortRef.current?.signal })
        return { ok: server.ok, status: server.status, payload: await server.json() }
      }, async (receipt: string) => {
        const ack = await motorFetch("/eventos/ack", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt }) }, { signal: abortRef.current?.signal })
        const confirmed = await ack.json()
        if (!ack.ok || confirmed.success !== true) throw new Error("La asistencia se procesó, pero falta confirmar su entrega al motor. Se reintentará de forma segura.")
      }, BIOMETRIC_LEGACY)
      // Do not use latestId/nextCursor: only a completed, durably ACKed event advances this cursor.
      cursorRef.current = event.id
      pendingRef.current = false
      if (mounted.current) mostrarResultado(event, result)
    }
    return payload.data.hasMore === true || events.length === 20
  }

  const programarPolling = (delay: number) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    if (mounted.current && !expiredRef.current) pollTimerRef.current = setTimeout(() => { void consultarEventosMotor() }, delay)
  }

  const consultarEventosMotor = async () => {
    if (!mounted.current || pollingRef.current || expiredRef.current) return
    pollingRef.current = true
    let delay = EVENT_POLL_INTERVAL_MS
    try {
      // This reduces duplicate UI work across tabs. Backend uniqueness + signed ACK remain authoritative.
      const more = navigator.locks
        ? await navigator.locks.request(`hexodus-biometric-${KIOSK_ID}`, { ifAvailable: true }, async lock => lock ? procesarPagina() : false)
        : await procesarPagina()
      backoffRef.current = EVENT_POLL_INTERVAL_MS
      if (more) delay = 0
    } catch (error: any) {
      if (mounted.current && !stopForSession(error)) {
        backoffRef.current = Math.min(30000, Math.max(1500, backoffRef.current * 2))
        delay = backoffRef.current
        if (pendingRef.current) {
          setEstado("warning")
          setMensajeEscaneo("Huella reconocida, autorización o confirmación pendiente. Se reintentará al recuperar la conexión.")
        }
        setUltimoEventoMotor(error?.message || "Error temporal. Los eventos permanecen pendientes en el motor.")
      }
    } finally {
      pollingRef.current = false
      programarPolling(delay)
    }
  }

  const iniciarSse = () => {
    sseAbortRef.current?.abort()
    const controller = new AbortController()
    sseAbortRef.current = controller
    const signal = controller.signal
    const active = () => mounted.current && !expiredRef.current && !signal.aborted
    const listen = async () => {
      let delay = 1500
      while (active()) {
        const started = Date.now()
        try {
          await consumirEventosMotorSse(async (type, payload) => {
            if (!active()) return
            if (type === "ready") {
              // Every new stream replays only events still waiting for a signed ACK.
              cursorRef.current = 0
              instanceRef.current = payload.instanceId || null
            } else if (type === "status") aplicarEstadoMotor(payload)
            else if (type === "events") await procesarPagina(payload)
          }, { signal })
        } catch (error: any) {
          if (!active() || stopForSession(error)) return
          setUltimoEventoMotor(error?.message || "SSE desconectado. Los eventos siguen pendientes.")
          if (pendingRef.current) {
            setEstado("warning")
            setMensajeEscaneo("Autorizacion o confirmacion pendiente. Reconectando de forma segura.")
          } else {
            setEstado("no-device")
            setErrorMsg("Reconectando con el motor V2...")
          }
        }
        if (!active()) return
        delay = Date.now() - started > 5000 ? 1500 : Math.min(30000, delay * 2)
        await waitMotorRetry(delay, signal)
      }
    }
    // One stream consumer per kiosk/browser. A second tab waits and takes over on close.
    void (async () => {
      try {
        if (navigator.locks) await navigator.locks.request(`hexodus-biometric-${KIOSK_ID}`, { signal }, listen)
        else await listen()
      } catch (error) { if (!signal.aborted) setUltimoEventoMotor("No se pudo iniciar SSE. Reconecta el lector.") }
    })()
  }

  const inicializarMotor = async () => {
    if (!mounted.current) return
    if (!AuthService.getToken()) { stopForSession({ status: 401 }); return }
    expiredRef.current = false
    setSessionExpired(false)
    setEstado("connecting")
    // Keep the cursor during manual reconnect; process startup always begins at zero.
    await sincronizar()
    await consultarEstadoMotor()
    if (MOTOR_SSE) iniciarSse()
    else programarPolling(0)
  }

  useEffect(() => {
    mounted.current = true
    abortRef.current = new AbortController()
    audioRef.current = getKioskAudio()
    const unsubscribeAudio = audioRef.current.subscribe(setAudioState)
    const stopAudioRecovery = attachKioskAudioRecovery(audioRef.current, window, document)
    void inicializarMotor()
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000)
    const healthTimer = MOTOR_SSE ? null : setInterval(() => { void consultarEstadoMotor() }, MOTOR_HEALTHCHECK_INTERVAL_MS)
    const receiveNotice = (notice: BiometricCacheNotice) => {
      if (!notice || notice.kioskId !== KIOSK_ID || notice.motorUrl !== MOTOR_URL) return
      if (notice.type === "synchronized" && typeof notice.totalCargadas === "number") {
        setSyncMessage(`Caché sincronizada: ${notice.totalCargadas} huellas.`)
        void consultarEstadoMotor()
      } else if (notice.type === "changed") {
        void sincronizar()
      }
    }
    const changed = (event: Event) => receiveNotice((event as CustomEvent<BiometricCacheNotice>).detail)
    const online = () => { void sincronizar() }
    const logout = () => { stopForSession({ status: 401 }) }
    const storage = (event: StorageEvent) => { if (event.key === "auth_token" && !event.newValue) logout() }
    window.addEventListener(BIOMETRIC_CHANGED_EVENT, changed)
    window.addEventListener("auth:logout", logout)
    window.addEventListener("storage", storage)
    window.addEventListener("online", online)
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(BIOMETRIC_CHANNEL)
    if (channel) channel.onmessage = event => receiveNotice(event.data)
    return () => {
      mounted.current = false
      abortRef.current?.abort()
      sseAbortRef.current?.abort()
      clearInterval(clockTimer); if (healthTimer) clearInterval(healthTimer)
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      notificationTimers.current.forEach(clearTimeout)
      window.removeEventListener(BIOMETRIC_CHANGED_EVENT, changed)
      window.removeEventListener("auth:logout", logout)
      window.removeEventListener("storage", storage)
      window.removeEventListener("online", online)
      channel?.close()
      unsubscribeAudio()
      stopAudioRecovery()
      audioRef.current?.stop()
    }
  // Every long-lived operation reads mutable refs; no polling callback captures UI state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                  {sessionExpired || estado === "no-device" || estado === "connecting" ? (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-500 font-medium">
                        {sessionExpired ? sessionReason === "missing" ? "Sesión no iniciada" : "Sesión expirada" : estado === "connecting" ? "Inicializando..." : "Escaneo no disponible"}
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

      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-border/50 px-4 py-2">
        <p className="text-sm text-muted-foreground" role="status">
          {audioState === "ready" ? "Sonido activado" : audioState === "unavailable"
            ? "Audio no disponible. El registro de asistencia sigue activo."
            : audioState === "activating" ? "Preparando sonido…"
            : "El navegador bloqueó el sonido. Abre el acceso del kiosco o actívalo aquí."}
        </p>
        <button type="button" className="rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent disabled:opacity-50"
          disabled={audioState === "activating"}
          onClick={() => { void audioRef.current?.activate().then(ready => { if (ready && mounted.current) audioRef.current?.play("success") }) }}>
          {audioState === "activating" ? "Activando sonido…" : audioState === "ready" ? "Probar sonido" : "Activar sonido"}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {BIOMETRIC_LEGACY && <p className="mb-4 rounded-lg border border-amber-500 p-3 text-amber-300">Modo compatible activo: los eventos antiguos no ofrecen autenticidad ni recuperación garantizada.</p>}
          {sessionExpired && <p className="mb-4 rounded-lg border border-amber-500 p-3 text-amber-300">{sessionReason === "missing" ? "No has iniciado sesión." : "Tu sesión expiró."} Los eventos siguen pendientes. <a className="underline" href="/login">Iniciar sesión</a></p>}
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
                  <span className="font-semibold text-foreground">Ultimo evento local:</span>{" "}
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
                <span className="font-semibold text-foreground">Sincronización:</span>{" "}{syncMessage || "Sin sincronizar"}
              </p>
              <p>Estado de caché: {estadoMotor.cacheState === "valid_empty" ? "Válida, sin huellas" : estadoMotor.cacheState === "valid" ? "Válida" : estadoMotor.cacheState === "stale" || estadoMotor.cacheStale ? "Desactualizada" : estadoMotor.cacheState === "sync_failed" ? "Sincronización fallida" : "No inicializada"}</p>
              {estadoMotor.lastSyncUtc && <p>Última actualización: {new Date(estadoMotor.lastSyncUtc).toLocaleString("es-MX")}</p>}
              {estadoMotor.lastSyncError && <p className="text-amber-300">{estadoMotor.lastSyncError}</p>}
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
  const titulo = estaValidando ? "Autorización pendiente" : "Escuchando el lector"
  const subtitulo = estaValidando
    ? "Huella reconocida. Esperando la decisión del servidor."
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
            Escaneo no disponible
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
        ) : notificacion.tipo === "warning" && notificacion.allowed && notificacion.socio ? (
          <PantallaWarning socio={notificacion.socio} mensaje={notificacion.mensaje} />
        ) : notificacion.tipo === "warning" ? (
          <div className="rounded-3xl border-2 border-amber-500/50 p-12 text-center">
            <AlertTriangle className="mx-auto mb-6 h-20 w-20 text-amber-500" />
            <h2 className="mb-4 text-4xl font-bold text-amber-500">Registro recuperado</h2>
            <p className="text-xl">{notificacion.mensaje}</p>
            {notificacion.socio && <p className="mt-6 text-muted-foreground">{notificacion.socio.socio.nombre_completo}</p>}
          </div>
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
          titulo: "Registro recuperado",
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

function PantallaWarning({ socio, countdown, mensaje }: { socio: SocioData, countdown?: number, mensaje?: string }) {
  const horaEntrada = socio.asistencia?.timestamp
    ? new Date(socio.asistencia.timestamp).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "No disponible"

  const diasRestantes = calcularDiasRestantesMembresia(socio.socio.fecha_fin_membresia)
  const precision = formatearNivelConfianza(socio.asistencia?.match_score)
  const mensajeVencimiento = mensaje || (
    diasRestantes === 0
      ? "⏰ Tu membresía vence hoy"
      : `⏰ Tu membresía vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`)

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
  const tipo = normalizarTexto(mensaje).includes('vencid')
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
