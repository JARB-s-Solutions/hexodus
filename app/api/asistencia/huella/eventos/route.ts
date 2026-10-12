import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { getHuellaMotorEvents } from "@/lib/asistencia-huella-events"
import type { HuellaMotorEventsResponse } from "@/lib/types/asistencia-huella"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (process.env.HUELLA_LEGACY_CLOUD_ENABLED !== "true") return NextResponse.json({ success: false, error: "Legacy event polling disabled" }, { status: 410 })
  // Optional server-to-server legacy integration; this secret never belongs in a browser.
  const expected = Buffer.from(process.env.HUELLA_MOTOR_CALLBACK_SECRET || "")
  const provided = Buffer.from(request.headers.get("x-motor-secret") || "")
  if (!expected.length || provided.length !== expected.length || !timingSafeEqual(provided, expected)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const afterParam = Number(request.nextUrl.searchParams.get("after") || "0")
  const takeParam = Number(request.nextUrl.searchParams.get("take") || "20")

  const after = Number.isFinite(afterParam) && afterParam > 0 ? afterParam : 0
  const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 0), 50) : 20

  const data = await getHuellaMotorEvents(after, take)

  const response: HuellaMotorEventsResponse = {
    success: true,
    data,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
