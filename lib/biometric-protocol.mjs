const MAX_TEMPLATE_BYTES = 64 * 1024

// DPUruNet.Fmd.SerializeXml emits <Fid>, despite the managed class name.
export function isTemplateXml(xml) {
  return typeof xml === "string" && new TextEncoder().encode(xml).length <= MAX_TEMPLATE_BYTES &&
    !/<!\s*(?:DOCTYPE|ENTITY)\b|\u0000/i.test(xml) &&
    /^\s*(?:<\?xml\b[^?]*\?>\s*)?<(Fid|Fmd)(?:\s[^<>]*?)?>[\s\S]*<\/\1>\s*$/i.test(xml)
}

/** Parse JSON first: extracting XML from a JSON string keeps its escape sequences. */
export function parseEnrollmentLine(line, allowLegacy = false) {
  const text = line.replace(/^data:\s*/i, "").trim()
  if (!text) return null
  if (text.length > MAX_TEMPLATE_BYTES * 2) throw new Error("La respuesta de captura supera el límite permitido.")
  let payload
  try { payload = JSON.parse(text) }
  catch {
    if (allowLegacy && isTemplateXml(text)) return { template: text, proof: null, message: "", terminal: true }
    if (allowLegacy) return { template: null, proof: null, message: text, terminal: false }
    throw new Error("El motor envió una respuesta de captura inválida.")
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Respuesta de captura inválida.")
  if (payload.success === false) throw new Error(payload.code === "HUELLA_DUPLICADA" ? "Esta huella ya está registrada en otro socio. Verifica el registro antes de continuar." : payload.message || payload.mensaje || "No se pudo completar la captura.")
  const template = payload.huellaTemplate ?? payload.huella_template ?? payload.fingerprintTemplate ?? payload.fingerprint_template ?? payload.template ?? payload.templateXml ?? payload.templateXML ?? payload.xml
  if (typeof template === "string" && template) {
    if (!isTemplateXml(template)) throw new Error("El motor entregó una plantilla XML inválida.")
    if (!allowLegacy && (typeof payload.enrollmentProof !== "string" || !payload.enrollmentProof)) throw new Error("La captura no incluye comprobación de duplicados. Actualiza el motor.")
    return { template, proof: payload.enrollmentProof || null, message: "", terminal: true }
  }
  return { template: null, proof: null, message: String(payload.texto || payload.message || payload.mensaje || "Esperando huella…"), terminal: false }
}

export function encodeTemplateUtf8(xml) {
  const bytes = new TextEncoder().encode(xml)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** The backend is the only authority. Recovered receipts never authorize a new passage. */
export function accessPresentation(payload, legacy = false, httpOk = true) {
  if (!httpOk) return { type: "error", message: payload?.message || "Acceso denegado", allowed: false }
  const data = payload?.data
  if (data?.recovered === true) return { type: "warning", message: "Asistencia recuperada y registrada. Este resultado no autoriza un nuevo ingreso.", allowed: false }
  if (payload?.success === true && data?.decision === "permitido") return {
    type: data.motivo_codigo === "proximo_vencer" ? "warning" : "success",
    message: data.motivo_texto || "Acceso permitido", allowed: true,
  }
  if (payload?.success === true && data?.decision === "denegado") return { type: "error", message: data.motivo_texto || "Acceso denegado", allowed: false }
  if (legacy && payload?.success === true) return { type: "success", message: "Acceso permitido (modo compatible)", allowed: true }
  throw new Error("El servidor no entregó una decisión de acceso válida.")
}

/** Receipt must be durably ACKed before cursor advances. A retry reuses the same eventProof. */
export async function deliverEvent(event, send, ack, legacy = false) {
  if (!legacy && (typeof event.eventProof !== "string" || !event.eventId)) throw new Error("Evento sin prueba biométrica. Actualiza el motor.")
  const response = await send(legacy ? { codigoSocio: event.codigoSocio, tipo: "IN", kioskId: event.kioskId } : { eventProof: event.eventProof })
  if (!response.ok) {
    if (legacy && response.status === 403) return { payload: response.payload, presentation: accessPresentation(response.payload, true, false) }
    const error = new Error(response.payload?.message || "Huella reconocida, autorización pendiente. Se reintentará sin duplicar la asistencia.")
    error.status = response.status
    throw error
  }
  // A receipt replayed long after capture is history, even if its original decision allowed access.
  // This does not recalculate membership: it prevents displaying an old permission as a new passage.
  const captured = Date.parse(event.capturedAtUtc || event.receivedAt || "")
  const displayPayload = !legacy && Number.isFinite(captured) && Date.now() - captured > 120000
    ? { ...response.payload, data: { ...response.payload.data, recovered: true } }
    : response.payload
  const presentation = accessPresentation(displayPayload, legacy)
  if (!legacy) {
    if (typeof response.payload.receipt !== "string" || !response.payload.receipt) throw new Error("La respuesta no incluye confirmación de persistencia; el evento sigue pendiente.")
    await ack(response.payload.receipt)
  }
  return { payload: response.payload, presentation }
}

export function validateEventPage(payload, cursor) {
  if (payload?.success !== true || !Array.isArray(payload?.data?.eventos)) throw new Error("Respuesta de eventos inválida.")
  const events = payload.data.eventos
  let previous = cursor
  for (const event of events) {
    if (!Number.isSafeInteger(event.id) || event.id <= previous) throw new Error("El motor entregó eventos fuera de orden.")
    previous = event.id
  }
  return events
}
