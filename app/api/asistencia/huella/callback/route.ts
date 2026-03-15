import { NextRequest, NextResponse } from "next/server"

import { appendHuellaMotorEvent } from "@/lib/asistencia-huella-events"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.HUELLA_MOTOR_CALLBACK_SECRET?.trim()
  if (!expectedSecret) return true

  const providedSecret =
    request.headers.get("x-motor-secret") ||
    request.headers.get("x-callback-secret") ||
    request.nextUrl.searchParams.get("secret")

  return providedSecret === expectedSecret
}

function normalizeParsedPayload(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeParsedPayload(item))
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>]
  }

  if (typeof value === "string" && value.trim()) {
    return [{ message: value.trim() }]
  }

  return []
}

function parseCallbackBody(rawBody: string) {
  const trimmedBody = rawBody.trim()
  if (!trimmedBody) return []

  try {
    return normalizeParsedPayload(JSON.parse(trimmedBody))
  } catch {
    const payloads = trimmedBody
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return normalizeParsedPayload(JSON.parse(line))
        } catch {
          return [{ message: line }]
        }
      })

    return payloads
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized callback" },
      { status: 401 },
    )
  }

  try {
    const rawBody = await request.text()
    const payloads = parseCallbackBody(rawBody)

    if (payloads.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid callback payload" },
        { status: 400 },
      )
    }

    const eventos = []
    for (const payload of payloads) {
      const evento = await appendHuellaMotorEvent(payload)
      eventos.push(evento)
    }

    return NextResponse.json({
      success: true,
      count: eventos.length,
      eventIds: eventos.map((evento) => evento.id),
      lastEventId: eventos.at(-1)?.id ?? null,
    })
  } catch (error) {
    console.error("[HuellaCallback] Error processing callback:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process callback",
      },
      { status: 500 },
    )
  }
}
