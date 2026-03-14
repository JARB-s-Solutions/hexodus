import { NextResponse } from "next/server"

interface EventoBiometricoPayload {
  codigoSocio?: string
  fechaUtc?: string
  origen?: string
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EventoBiometricoPayload

    if (!payload?.codigoSocio) {
      return NextResponse.json(
        { ok: false, message: "codigoSocio requerido" },
        { status: 400 },
      )
    }

    // TODO: Integrar con backend real:
    // 1) Buscar socio por codigoSocio
    // 2) Registrar asistencia
    // 3) Notificar al frontend vía websocket/SSE
    console.info("Evento biométrico recibido", {
      codigoSocio: payload.codigoSocio,
      fechaUtc: payload.fechaUtc,
      origen: payload.origen,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error procesando callback biométrico", error)
    return NextResponse.json(
      { ok: false, message: "Payload inválido" },
      { status: 400 },
    )
  }
}
