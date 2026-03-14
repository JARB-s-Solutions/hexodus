export interface MotorEstadoResponse {
  cacheCargada: boolean
  huellasEnMemoria: number
  lectorConectado: boolean
  detectorContinuo: string
}

export interface CargarCacheSocio {
  codigoSocio: string
  huellaTemplate: string
}

export interface CargarCacheRequest {
  baseDeDatos: CargarCacheSocio[]
}

export interface CargarCacheResponse {
  success: boolean
  totalCargadas: number
}

export interface MotorMensajeEvento {
  tipo: "mensaje"
  texto: string
}

export interface MotorResultadoEvento {
  tipo: "resultado"
  success: boolean
  message?: string
  huellaTemplate?: string
  codigoSocio?: string
  confidence?: number
}

export type MotorEvento = MotorMensajeEvento | MotorResultadoEvento

export async function consumirNdjson(
  response: Response,
  onEvent: (event: MotorEvento) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("El navegador no soporta streams de respuesta.")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    let index = buffer.indexOf("\n")
    while (index >= 0) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)

      if (line) {
        try {
          const event = JSON.parse(line) as MotorEvento
          onEvent(event)
        } catch {
          // Ignorar líneas no JSON del stream
        }
      }

      index = buffer.indexOf("\n")
    }
  }

  const restante = buffer.trim()
  if (restante) {
    try {
      const event = JSON.parse(restante) as MotorEvento
      onEvent(event)
    } catch {
      // Ignorar remanente no JSON
    }
  }
}
