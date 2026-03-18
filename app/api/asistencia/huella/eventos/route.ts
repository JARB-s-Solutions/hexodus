import { NextRequest, NextResponse } from "next/server"

import { getHuellaMotorEvents } from "@/lib/asistencia-huella-events"
import type { HuellaMotorEventsResponse } from "@/lib/types/asistencia-huella"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
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
