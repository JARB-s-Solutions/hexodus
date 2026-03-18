import type { HuellaMotorEvent, HuellaMotorEventKind } from "@/lib/types/asistencia-huella"

const GLOBAL_EVENTS_KEY = "__hexodus_huella_motor_events__"
const GLOBAL_MAX_EVENTS = 200

type HuellaMotorEventStore = {
  events: HuellaMotorEvent[]
}

const WAIT_PATTERNS = [
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
  "no se detecto la huella",
  "timeout",
  "time out",
  "tiempo agotado",
  "tiempo de espera",
  "waiting for finger",
  "esperando huella",
  "listo para registrar",
  "listening",
  "escuchando",
]

const INFO_PATTERNS = [
  "lector usb conectado",
  "en espera permanente",
  "servicio de escucha continua iniciado",
  "cache cargada",
  "motor escuchando",
  "motor listo",
  "hardware",
  "servicio iniciado",
  "pre-calentado",
  "precalentado",
]

const ERROR_PATTERNS = [
  "no reconocida",
  "not recognized",
  "not found",
  "sin coincidencia",
  "membresia vencida",
  "membership expired",
  "denegado",
  "fallo",
  "error",
]

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function includesAnyPattern(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(normalizeText(pattern)))
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

function pickBoolean(...values: unknown[]): boolean | null {
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

function resolveKind(params: {
  codigoSocio: string | null
  success: boolean
  message: string | null
  eventType: string | null
}): HuellaMotorEventKind {
  const normalizedMessage = normalizeText(params.message || "")
  const normalizedType = normalizeText(params.eventType || "")

  if (params.codigoSocio) {
    return "match"
  }

  if (
    includesAnyPattern(normalizedMessage, WAIT_PATTERNS) ||
    normalizedType.includes("wait") ||
    normalizedType.includes("listen") ||
    normalizedType.includes("idle")
  ) {
    return "wait"
  }

  if (
    includesAnyPattern(normalizedMessage, INFO_PATTERNS) ||
    normalizedType.includes("status") ||
    normalizedType.includes("info") ||
    normalizedType.includes("log") ||
    normalizedType.includes("hardware") ||
    normalizedType.includes("cache")
  ) {
    return "info"
  }

  if (
    !params.success ||
    includesAnyPattern(normalizedMessage, ERROR_PATTERNS) ||
    normalizedType.includes("error") ||
    normalizedType.includes("fail")
  ) {
    return "error"
  }

  return "info"
}

function normalizePayload(payload: Record<string, unknown>) {
  const data = asRecord(payload.data)
  const result = asRecord(payload.result)
  const payloadData = asRecord(payload.payload)
  const match = asRecord(payload.match)
  const socio = asRecord(payload.socio)
  const nestedSocio = asRecord(data.socio)

  const codigoSocio = pickString(
    payload.codigoSocio,
    payload.codigo_socio,
    payload.CodigoSocio,
    payload.codigo,
    payload.idSocio,
    payload.id_socio,
    payloadData.codigoSocio,
    payloadData.codigo_socio,
    payloadData.CodigoSocio,
    result.codigoSocio,
    result.codigo_socio,
    result.CodigoSocio,
    match.codigoSocio,
    match.codigo_socio,
    match.CodigoSocio,
    data.codigoSocio,
    data.codigo_socio,
    socio.codigo_socio,
    nestedSocio.codigo_socio,
  )

  const confidence = pickNumber(
    payload.confidence,
    payload.matchScore,
    payload.match_score,
    payload.score,
    payload.similarity,
    payload.similitud,
    payload.porcentaje,
    payloadData.confidence,
    payloadData.matchScore,
    result.confidence,
    result.matchScore,
    result.match_score,
    match.confidence,
    match.matchScore,
    match.match_score,
    data.confidence,
    data.match_score,
  )

  const message = pickString(
    payload.message,
    payload.mensaje,
    payload.text,
    payload.texto,
    payload.status,
    payload.detail,
    payload.detalle,
    payload.error,
    payload.reason,
    payload.log,
    payloadData.message,
    payloadData.mensaje,
    payloadData.text,
    payloadData.texto,
    result.message,
    result.mensaje,
    result.text,
    result.texto,
    match.message,
    match.mensaje,
    data.message,
    data.mensaje,
  )

  const eventType = pickString(
    payload.tipo,
    payload.type,
    payload.event,
    payload.eventType,
    payload.kind,
    payload.Tipo,
    payload.Type,
    payload.EventType,
    payloadData.tipo,
    payloadData.type,
    result.tipo,
    result.type,
    match.tipo,
    match.type,
    data.tipo,
    data.type,
  )

  const success =
    pickBoolean(
      payload.success,
      payload.ok,
      payload.matchFound,
      payload.match_found,
      payload.encontrado,
      payloadData.success,
      result.success,
      result.ok,
      match.success,
      data.success,
    ) ?? Boolean(codigoSocio)

  const kind = resolveKind({
    codigoSocio,
    success,
    message,
    eventType,
  })

  return {
    codigoSocio,
    confidence,
    message,
    success,
    kind,
  }
}

function createEventId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}

function getEventStore(): HuellaMotorEventStore {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_EVENTS_KEY]?: HuellaMotorEventStore
  }

  if (!globalScope[GLOBAL_EVENTS_KEY]) {
    globalScope[GLOBAL_EVENTS_KEY] = {
      events: [],
    }
  }

  return globalScope[GLOBAL_EVENTS_KEY]
}

function readStoredEvents(): HuellaMotorEvent[] {
  const store = getEventStore()
  return [...store.events].sort((a, b) => a.id - b.id)
}

function writeStoredEvent(event: HuellaMotorEvent) {
  const store = getEventStore()
  store.events.push(event)

  if (store.events.length > GLOBAL_MAX_EVENTS) {
    store.events.splice(0, store.events.length - GLOBAL_MAX_EVENTS)
  }
}

export async function appendHuellaMotorEvent(rawPayload: Record<string, unknown>) {
  const normalized = normalizePayload(rawPayload)

  const event: HuellaMotorEvent = {
    id: createEventId(),
    receivedAt: new Date().toISOString(),
    codigoSocio: normalized.codigoSocio,
    confidence: normalized.confidence,
    success: normalized.success,
    message: normalized.message,
    kind: normalized.kind,
    source: "motor",
    raw: rawPayload,
  }

  writeStoredEvent(event)

  return event
}

export async function getHuellaMotorEvents(afterId = 0, take = 20) {
  const events = readStoredEvents()
  const latestId = events.at(-1)?.id ?? 0
  const filteredEvents = take <= 0
    ? []
    : events.filter((event) => event.id > afterId).slice(0, take)

  return {
    latestId,
    eventos: filteredEvents,
  }
}
