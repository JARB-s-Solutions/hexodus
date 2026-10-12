// Incremental UTF-8 SSE parser. Await each handler: never authorize events concurrently.
export async function readMotorSse(body, onFrame, onActivity = () => {}) {
  if (!body) throw new Error("El motor no entrego un flujo SSE.")
  const reader = body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let buffer = ""
  let event = "message"
  let data = []
  let bytes = 0
  async function line(value) {
    if (!value) {
      if (data.length) await onFrame(event, JSON.parse(data.join("\n")))
      event = "message"; data = []; bytes = 0
      return
    }
    if (value.startsWith(":")) return
    const colon = value.indexOf(":")
    const field = colon < 0 ? value : value.slice(0, colon)
    let content = colon < 0 ? "" : value.slice(colon + 1)
    if (content.startsWith(" ")) content = content.slice(1)
    if (field === "event") event = content
    if (field === "data") {
      bytes += content.length
      if (bytes > 1024 * 1024) throw new Error("Evento SSE demasiado grande.")
      data.push(content)
    }
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break // An incomplete frame is replayed from the durable queue on reconnect.
      onActivity()
      buffer += decoder.decode(value, { stream: true })
      let newline
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const next = buffer.slice(0, newline).replace(/\r$/, "")
        buffer = buffer.slice(newline + 1)
        await line(next)
      }
      if (buffer.length > 1024 * 1024) throw new Error("Evento SSE demasiado grande.")
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}

export function waitMotorRetry(ms, signal) {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return }
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve() }
    const timer = setTimeout(finish, ms)
    signal.addEventListener("abort", finish, { once: true })
  })
}
