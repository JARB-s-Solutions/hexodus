const MOTOR_URL = process.env.NEXT_PUBLIC_MOTOR_URL || "http://localhost:4000"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hexodusapi.vercel.app/api"

type HuellaSincronizada = {
  codigoSocio: string
  huellaTemplate: string
}

function decodificarTemplate(template: string) {
  if (!template) return ""

  if (template.trim().startsWith("<")) {
    return template
  }

  try {
    return atob(template)
  } catch {
    return ""
  }
}

export async function sincronizarCacheMotorHuella(token: string) {
  const resSync = await fetch(`${API_BASE}/asistencia/huellas/sincronizar`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!resSync.ok) {
    throw new Error("No se pudo sincronizar huellas desde el servidor.")
  }

  const dataSync = await resSync.json()
  if (!dataSync.success) {
    throw new Error(dataSync.message || "Error al sincronizar huellas.")
  }

  const sociosDb: HuellaSincronizada[] = Array.isArray(dataSync.data) ? dataSync.data : []

  const baseDeDatos = sociosDb.map((socio) => ({
    codigoSocio: socio.codigoSocio,
    huellaTemplate: decodificarTemplate(socio.huellaTemplate || ""),
  }))

  const resMotor = await fetch(`${MOTOR_URL}/cargar-cache`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseDeDatos }),
    cache: "no-store",
  })

  if (!resMotor.ok) {
    throw new Error("Error al cargar la cache de huellas en el motor biometrico.")
  }

  const dataMotor = await resMotor.json().catch(() => ({}))
  if (dataMotor && typeof dataMotor.success === "boolean" && !dataMotor.success) {
    throw new Error(dataMotor.message || "El motor no pudo cargar la cache de huellas.")
  }

  return {
    totalSincronizadas: baseDeDatos.length,
    totalCargadas: typeof dataMotor?.totalCargadas === "number" ? dataMotor.totalCargadas : baseDeDatos.length,
  }
}
