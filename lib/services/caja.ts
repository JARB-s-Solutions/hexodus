import { apiPost } from "@/lib/api"
import type {
  AbrirCajaData,
  AbrirCajaResponse,
  ConsultarCajaData,
  ConsultarCajaResponse,
  CerrarCajaData,
  CerrarCajaResponse,
} from "@/lib/types/caja"

/**
 * Genera fechas inicial y final para el día actual
 */
function obtenerFechasDelDia(): { fecha_inicial: string; fecha_final: string } {
  const ahora = new Date()
  const fecha_inicial = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0)
  const fecha_final = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)

  return {
    fecha_inicial: fecha_inicial.toISOString(),
    fecha_final: fecha_final.toISOString(),
  }
}

/**
 * Servicio para gestionar operaciones de caja
 * (apertura, cierre, consulta de estado)
 */
export class CajaService {
  /**
   * Abrir caja con monto inicial
   * POST /api/caja/abrir
   */
  static async abrirCaja(montoInicial: number): Promise<AbrirCajaResponse> {
    console.log("🔓 Abriendo caja con monto inicial:", montoInicial)

    try {
      const data: AbrirCajaData = {
        monto_inicial: montoInicial,
      }

      const response = await apiPost<AbrirCajaResponse>("/caja/abrir", data)

      console.log("✅ Caja abierta exitosamente:")
      console.log("  Corte ID:", response.data.corte_id)
      console.log("  Fecha apertura:", response.data.fecha_apertura)

      return response
    } catch (error: any) {
      console.error("❌ Error abriendo caja:", error)
      
      // Mejorar mensaje de error
      if (error.message?.includes("Ya existe un turno")) {
        throw new Error("Ya hay una caja abierta. Debes cerrarla primero.")
      }
      
      throw error
    }
  }

  /**
   * Consultar estado de la caja del día actual
   * POST /api/caja/consultar
   */
  static async consultarCaja(): Promise<ConsultarCajaResponse> {
    console.log("📊 Consultando estado de caja del día...")

    try {
      const fechas = obtenerFechasDelDia()
      const data: ConsultarCajaData = fechas

      console.log("  Rango:", fechas.fecha_inicial, "a", fechas.fecha_final)

      const response = await apiPost<ConsultarCajaResponse>("/caja/consultar", data)

      console.log("✅ Estado de caja obtenido:")
      console.log("  Efectivo inicial:", response.resumen.efectivo_inicial)
      console.log("  Efectivo final:", response.resumen.efectivo_final)
      console.log("  Movimientos:", response.movimientos.length)

      return response
    } catch (error: any) {
      console.error("❌ Error consultando caja:", error)
      throw error
    }
  }

  /**
   * Cerrar caja del día actual
   * POST /api/caja/cerrar
   */
  static async cerrarCaja(observacion?: string): Promise<CerrarCajaResponse> {
    console.log("🔒 Cerrando caja del día...")

    try {
      const fechas = obtenerFechasDelDia()
      const data: CerrarCajaData = {
        ...fechas,
        observacion,
      }

      console.log("  Rango:", fechas.fecha_inicial, "a", fechas.fecha_final)
      if (observacion) console.log("  Observación:", observacion)

      const response = await apiPost<CerrarCajaResponse>("/caja/cerrar", data)

      console.log("✅ Caja cerrada exitosamente:")
      console.log("  Corte ID:", response.data.corte_id)
      console.log("  Total ingresos:", response.data.total_ingresos_amarrados)

      return response
    } catch (error: any) {
      console.error("❌ Error cerrando caja:", error)
      throw error
    }
  }

  /**
   * Verificar si hay una caja abierta (movimiento de apertura)
   * Retorna true si encuentra movimiento de "Apertura / Fondo de Caja"
   */
  static async verificarCajaAbierta(): Promise<boolean> {
    try {
      const response = await this.consultarCaja()
      
      // Buscar si hay movimiento de apertura
      const hayApertura = response.movimientos.some(
        (mov) => mov.concepto === "Apertura / Fondo de Caja" && mov.tipo === "ingreso"
      )

      console.log("🔍 Verificación de apertura:", hayApertura ? "Caja ABIERTA" : "Caja CERRADA")
      
      return hayApertura
    } catch (error) {
      console.error("❌ Error verificando caja:", error)
      // Si hay error, asumir que no está abierta
      return false
    }
  }
}
