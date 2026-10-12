import { isTemplateXml } from "./biometric-protocol.mjs"
import { readMotorSse } from "./motor-sse.mjs"
import { AuthService } from "./auth"

export const MOTOR_URL = process.env.NEXT_PUBLIC_MOTOR_URL || "http://localhost:4000"
export const MOTOR_SSE = process.env.NEXT_PUBLIC_MOTOR_TRANSPORT !== "polling"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hexodusapi.vercel.app/api"
export const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || "KIOSKO-HUELLA-01"
export const BIOMETRIC_LEGACY = process.env.NEXT_PUBLIC_BIOMETRIC_LEGACY === "true"
export const BIOMETRIC_CHANGED_EVENT = "hexodus:biometric-changed"
export const BIOMETRIC_CHANNEL = "hexodus-biometric-changes"

type MotorOptions = { scope?: "kiosk" | "enrollment"; codigoSocio?: string; signal?: AbortSignal }
type Capability = { motorToken: string; expiresAtUtc: string }
const capabilities = new Map<string, Capability>()
const pendingCapabilities = new Map<string, Promise<Capability>>()

export class BiometricHttpError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message) }
}

export function exigirSesionBiometrica(): string {
  const token = AuthService.getToken()
  if (!token) throw new BiometricHttpError("La sesión expiró. Inicia sesión para procesar las asistencias pendientes.", 401)
  try {
    const part = token.split(".")[1]
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")))
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) throw new Error("expired")
  } catch {
    capabilities.clear()
    AuthService.clearAuthData()
    throw new BiometricHttpError("La sesión expiró. Inicia sesión; los eventos siguen pendientes en el motor.", 401)
  }
  return token
}

async function boundedFetch(url: string, init: RequestInit, timeoutMs = 20000, streamResponse = false): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  init.signal?.addEventListener("abort", onAbort, { once: true })
  if (init.signal?.aborted) controller.abort()
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (streamResponse) return response // Enrollment owns its full-stream AbortController.
    const body = await response.arrayBuffer()
    return new Response([204, 205, 304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers })
  }
  finally { clearTimeout(timer); init.signal?.removeEventListener("abort", onAbort) }
}

export async function biometricApiFetch(path: string, init: RequestInit = {}) {
  const response = await boundedFetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...Object.fromEntries(new Headers(init.headers)), Authorization: `Bearer ${exigirSesionBiometrica()}` },
  })
  if (response.status === 401) {
    capabilities.clear()
    AuthService.clearAuthData()
    throw new BiometricHttpError("La sesión expiró. Inicia sesión; los eventos siguen pendientes en el motor.", 401)
  }
  return response
}

async function getCapability(options: MotorOptions = {}, force = false): Promise<string> {
  if (BIOMETRIC_LEGACY) return ""
  const token = exigirSesionBiometrica()
  const key = `${token}:${options.scope || "kiosk"}:${options.codigoSocio || ""}`
  const cached = capabilities.get(key)
  if (!force && cached && Date.parse(cached.expiresAtUtc) - Date.now() > 60000) return cached.motorToken
  let request = pendingCapabilities.get(key)
  if (!request) {
    request = (async () => {
      const response = await biometricApiFetch("/asistencia/huellas/sesion", {
        method: "POST",
        body: JSON.stringify({ kioskId: KIOSK_ID, scope: options.scope || "kiosk", codigoSocio: options.codigoSocio }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success || typeof payload.data?.motorToken !== "string" || !Number.isFinite(Date.parse(payload.data?.expiresAtUtc))) {
        throw new BiometricHttpError(payload.message || "No tienes permiso para utilizar este lector.", response.status)
      }
      capabilities.set(key, payload.data)
      return payload.data as Capability
    })()
    pendingCapabilities.set(key, request)
  }
  try { return (await request).motorToken }
  finally { pendingCapabilities.delete(key) }
}

export async function motorFetch(path: string, init: RequestInit = {}, options: MotorOptions = {}): Promise<Response> {
  const request = async (force: boolean) => {
    const capability = await getCapability(options, force)
    const requestOptions: RequestInit & { targetAddressSpace: "loopback" } = {
      ...init, cache: "no-store", signal: options.signal || init.signal,
      targetAddressSpace: "loopback",
      headers: { ...Object.fromEntries(new Headers(init.headers)), ...(capability ? { "X-Motor-Token": capability } : {}) },
    }
    return boundedFetch(`${MOTOR_URL}${path}`, requestOptions, path.startsWith("/enrolar") ? 180000 : 20000, path.startsWith("/enrolar"))
  }
  let response = await request(false)
  if (!BIOMETRIC_LEGACY && response.status === 401) response = await request(true)
  if (response.status === 401 || response.status === 403) {
    throw new BiometricHttpError("El motor rechazó la autorización. Verifica la sesión, el dispositivo y el origen permitido.", response.status)
  }
  return response
}

export async function consumirEventosMotorSse(onFrame: (type: string, payload: any) => Promise<void>, options: MotorOptions = {}) {
  if (BIOMETRIC_LEGACY) throw new Error("SSE requiere una sesion biometrica autenticada.")
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener("abort", abort, { once: true })
  if (options.signal?.aborted) abort()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const arm = (ms: number) => { if (timeout) clearTimeout(timeout); timeout = setTimeout(abort, ms) }
  try {
    const request = async (force: boolean) => {
      const capability = await getCapability(options, force)
      const init: RequestInit & { targetAddressSpace: "loopback" } = {
        cache: "no-store", signal: controller.signal, targetAddressSpace: "loopback",
        headers: { Accept: "text/event-stream", "X-Motor-Token": capability },
      }
      arm(15000)
      return fetch(`${MOTOR_URL}/eventos/stream`, init)
    }
    let response = await request(false)
    if (response.status === 401) { await response.body?.cancel(); response = await request(true) }
    if (!response.ok) {
      await response.body?.cancel()
      throw new BiometricHttpError("No se pudo abrir SSE. Verifica que este ejecutandose el motor V2.", response.status)
    }
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      await response.body?.cancel()
      throw new Error("El motor no responde con SSE. Revisa la version iniciada.")
    }
    arm(45000)
    await readMotorSse(response.body, async (type: string, payload: any) => {
      // API/ACK handlers have their own timeouts. Do not mistake backpressure for a dead stream.
      if (timeout) clearTimeout(timeout)
      try { await onFrame(type, payload) } finally { arm(45000) }
    }, () => arm(45000))
  } finally {
    if (timeout) clearTimeout(timeout)
    options.signal?.removeEventListener("abort", abort)
    controller.abort()
  }
}

export async function sincronizarCacheMotorHuella(_token?: string, options: MotorOptions = {}) {
  const response = await biometricApiFetch(`/asistencia/huellas/sincronizar${BIOMETRIC_LEGACY ? "" : `?kioskId=${encodeURIComponent(KIOSK_ID)}`}`, { signal: options.signal })
  const payload = await response.json()
  if (!response.ok || !payload.success) throw new BiometricHttpError(payload.message || "No se pudo actualizar la caché. Se conserva la versión anterior.", response.status)
  let body: object
  if (BIOMETRIC_LEGACY) {
    if (!Array.isArray(payload.data)) throw new Error("La respuesta de sincronización no contiene una lista válida.")
    const baseDeDatos = payload.data.map((socio: { codigoSocio: string; huellaTemplate: string }) => {
      if (typeof socio.codigoSocio !== "string" || typeof socio.huellaTemplate !== "string") throw new Error("Plantilla inválida en sincronización.")
      const xml = socio.huellaTemplate.trim().startsWith("<") ? socio.huellaTemplate : new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(socio.huellaTemplate), c => c.charCodeAt(0)))
      if (!isTemplateXml(xml)) throw new Error("Formato de plantilla inválido. La caché anterior se conserva.")
      return { codigoSocio: socio.codigoSocio, huellaTemplate: xml }
    })
    body = { baseDeDatos }
  } else {
    if (typeof payload.snapshot !== "string" || !payload.snapshot) throw new Error("El servidor no entregó un snapshot biométrico firmado.")
    body = { snapshot: payload.snapshot }
  }
  const local = await motorFetch("/cargar-cache", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, options)
  const result = await local.json()
  if (!local.ok || result.success !== true || typeof result.totalCargadas !== "number") throw new BiometricHttpError(result.message || "El motor rechazó la caché. Se conserva la versión anterior.", local.status)
  const loaded = { totalCargadas: result.totalCargadas, revision: result.revision }
  notificarCambioBiometrico(loaded)
  return loaded
}

export type BiometricCacheNotice = {
  type: "changed" | "synchronized"
  kioskId: string
  motorUrl: string
  totalCargadas?: number
}

// A completed push updates the kiosk display without fetching the same list again.
// Only status crosses tabs; never templates, tokens or member data.
export function notificarCambioBiometrico(loaded?: { totalCargadas: number }) {
  if (typeof window === "undefined") return
  const notice: BiometricCacheNotice = {
    type: loaded ? "synchronized" : "changed",
    kioskId: KIOSK_ID,
    motorUrl: MOTOR_URL,
    ...(loaded ? { totalCargadas: loaded.totalCargadas } : {}),
  }
  window.dispatchEvent(new CustomEvent(BIOMETRIC_CHANGED_EVENT, { detail: notice }))
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(BIOMETRIC_CHANNEL)
    channel.postMessage(notice)
    channel.close()
  }
}
