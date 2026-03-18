export type HuellaMotorEventKind = "match" | "wait" | "info" | "error"

export interface HuellaMotorEvent {
  id: number
  receivedAt: string
  codigoSocio: string | null
  confidence: number | null
  success: boolean
  message: string | null
  kind: HuellaMotorEventKind
  source: "motor"
  raw: Record<string, unknown>
}

export interface HuellaMotorEventsResponse {
  success: boolean
  data: {
    eventos: HuellaMotorEvent[]
    latestId: number
  }
}
