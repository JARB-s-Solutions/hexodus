"use client"

import { useEffect, useState } from "react"
import { X, Fingerprint, CheckCircle2, AlertCircle } from "lucide-react"

const MOTOR_URL = process.env.NEXT_PUBLIC_MOTOR_URL || "http://localhost:4000"

const MENSAJES_TRANSITORIOS = [
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
  "timeout",
  "time out",
  "tiempo agotado",
  "tiempo de espera",
  "esperando huella",
  "waiting for finger",
  "coloca tu dedo",
  "coloque su dedo",
  "ponga el dedo",
  "toque 1 de 4",
  "toque 2 de 4",
  "toque 3 de 4",
  "toque 4 de 4",
  "touch 1 of 4",
  "touch 2 of 4",
  "touch 3 of 4",
  "touch 4 of 4",
  "iniciando enrolamiento",
  "starting enrollment",
]

const MENSAJES_TERMINALES = [
  "error",
  "fallo",
  "failed",
  "cancel",
  "cancelado",
  "cancelled",
  "rechaz",
  "desconect",
  "denied",
  "permiso",
  "duplic",
  "inval",
]

interface CapturaHuellaModalProps {
  open: boolean
  onClose: () => void
  onCapture: (template: string) => void
}

const normalizarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const esMensajeTransitorio = (texto: string) => {
  const normalizado = normalizarTexto(texto)
  return MENSAJES_TRANSITORIOS.some((patron) => normalizado.includes(normalizarTexto(patron)))
}

const esMensajeTerminal = (texto: string) => {
  const normalizado = normalizarTexto(texto)
  return MENSAJES_TERMINALES.some((patron) => normalizado.includes(normalizarTexto(patron)))
}

const normalizarLineaStream = (linea: string) => linea.replace(/^data:\s*/i, "").trim()

const extraerTemplateDesdeTexto = (texto: string) => {
  const match = texto.match(/<Fmd[\s\S]*<\/Fmd>/i)
  return match?.[0]?.trim() || ""
}

const extraerTemplate = (payload: Record<string, unknown>) => {
  const candidates = [
    payload.huellaTemplate,
    payload.huella_template,
    payload.fingerprintTemplate,
    payload.fingerprint_template,
    payload.template,
    payload.templateXml,
    payload.templateXML,
    payload.xml,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

export function CapturaHuellaModal({ open, onClose, onCapture }: CapturaHuellaModalProps) {
  const [status, setStatus] = useState("Listo para capturar")
  const [capturing, setCapturing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStatus("Listo para capturar")
      setCapturing(false)
      setSuccess(false)
      setError(null)
    }
  }, [open])

  const handleCapturar = async () => {
    setCapturing(true)
    setError(null)
    setSuccess(false)
    setStatus("Iniciando conexion con el motor biometrico...")

    try {
      const res = await fetch(`${MOTOR_URL}/enrolar`, {
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error("El motor biometrico rechazo la captura de huella.")
      }

      if (!res.body) {
        throw new Error("El navegador no soporta streams de respuesta.")
      }

      const streamReader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")

      let buffer = ""
      let templateCapturado = ""
      let ultimoMensaje = ""
      let mensajeErrorTerminal = ""

      while (true) {
        const { done, value } = await streamReader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lineas = buffer.split("\n")
        buffer = lineas.pop() || ""

        for (const linea of lineas) {
          const contenido = normalizarLineaStream(linea)
          if (!contenido) continue

          const templateEnTextoPlano = extraerTemplateDesdeTexto(contenido)
          if (templateEnTextoPlano) {
            templateCapturado = templateEnTextoPlano
            break
          }

          try {
            const data = JSON.parse(contenido) as Record<string, unknown>
            const tipo = String(data.tipo || data.type || "").trim().toLowerCase()
            const mensaje = String(data.texto || data.message || data.mensaje || "").trim()

            if (mensaje) {
              ultimoMensaje = mensaje
            }

            if (tipo === "mensaje" || tipo === "status" || tipo === "info") {
              setStatus(mensaje || "Esperando huella...")
              continue
            }

            const template = extraerTemplate(data)
            const successFlag = typeof data.success === "boolean"
              ? data.success
              : Boolean(template)

            if (template && successFlag) {
              templateCapturado = template
              break
            }

            if (tipo === "resultado" || tipo === "result" || typeof data.success === "boolean") {
              if (!successFlag) {
                const detalle = mensaje || ultimoMensaje || ""

                if (!detalle || esMensajeTransitorio(detalle) || !esMensajeTerminal(detalle)) {
                  setStatus(detalle || "Esperando huella. Coloca tu dedo en el sensor...")
                  continue
                }

                mensajeErrorTerminal = detalle
                break
              }
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) {
              throw parseErr
            }

            ultimoMensaje = contenido

            if (!esMensajeTerminal(contenido) || esMensajeTransitorio(contenido)) {
              setStatus(contenido)
              continue
            }

            mensajeErrorTerminal = contenido
            break
          }
        }

        if (templateCapturado || mensajeErrorTerminal) {
          break
        }
      }

      if (!templateCapturado && buffer.trim()) {
        try {
          const contenidoFinal = normalizarLineaStream(buffer.trim())
          const templatePlanoFinal = extraerTemplateDesdeTexto(contenidoFinal)

          if (templatePlanoFinal) {
            templateCapturado = templatePlanoFinal
          } else {
            const data = JSON.parse(contenidoFinal) as Record<string, unknown>
            const template = extraerTemplate(data)
            if (template) {
              templateCapturado = template
            } else if (typeof data.success === "boolean" && !data.success) {
              const detalle = String(data.message || data.mensaje || ultimoMensaje || "").trim()
              if (detalle && esMensajeTerminal(detalle) && !esMensajeTransitorio(detalle)) {
                mensajeErrorTerminal = detalle
              }
            }
          }
        } catch {
          const contenidoFinal = normalizarLineaStream(buffer.trim())
          if (contenidoFinal && esMensajeTerminal(contenidoFinal) && !esMensajeTransitorio(contenidoFinal)) {
            mensajeErrorTerminal = contenidoFinal
          }
        }
      }

      if (!templateCapturado) {
        throw new Error(mensajeErrorTerminal || ultimoMensaje || "No se pudo capturar la huella.")
      }

      const huellaEnBase64 = btoa(templateCapturado)
      setStatus("Huella capturada exitosamente")
      setSuccess(true)
      setCapturing(false)

      setTimeout(() => {
        onCapture(huellaEnBase64)
        onClose()
      }, 800)
    } catch (err: any) {
      console.error("Error en captura de huella:", err)
      const msg = err?.message?.includes("fetch")
        ? "No se pudo conectar al motor biometrico. Verifica que este corriendo en el puerto 4000."
        : (err?.message || "Error desconocido al capturar huella.")
      setError(msg)
      setStatus("Error al capturar")
      setCapturing(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !capturing) onClose() }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl animate-slide-up"
        style={{
          background: "linear-gradient(180deg, rgba(22,24,36,0.97), rgba(18,20,32,0.95))",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="flex items-center justify-between border-b border-border/30 px-6 py-4"
          style={{ background: "linear-gradient(180deg, rgba(13,18,36,0.70), rgba(12,15,28,0.28))" }}
        >
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Fingerprint className="h-5 w-5 text-accent" />
            Captura de Huella Dactilar
          </h3>
          <button
            onClick={onClose}
            disabled={capturing}
            className="text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6 text-center">
          <div className="flex justify-center">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${
              success
                ? "border-2 border-[#22C55E] bg-[#22C55E]/10"
                : error
                ? "border-2 border-red-500 bg-red-500/10"
                : "border-2 border-accent bg-accent/10"
            } ${capturing ? "animate-pulse" : ""}`}>
              {success ? (
                <CheckCircle2 className="h-12 w-12 text-[#22C55E]" />
              ) : error ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Fingerprint className="h-12 w-12 text-accent" />
              )}
            </div>
          </div>

          <div>
            <p className={`text-lg font-semibold ${
              success ? "text-[#22C55E]" : error ? "text-red-500" : "text-foreground"
            }`}>
              {status}
            </p>
            {error && (
              <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          {!capturing && !success && !error && (
            <div className="rounded-xl border border-border/30 bg-card/30 p-4 text-left text-sm text-muted-foreground">
              <p className="mb-2 font-semibold">Instrucciones:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Conecta el lector de huellas al equipo</li>
                <li>Haz clic en "Capturar Huella"</li>
                <li>Coloca tu dedo en el sensor cuando se solicite</li>
                <li>Manten el dedo firme hasta que se complete</li>
              </ol>
            </div>
          )}

          {!success && (
            <button
              type="button"
              onClick={handleCapturar}
              disabled={capturing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:from-primary/90 hover:to-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {capturing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Capturando...
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5" />
                  Capturar Huella
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
