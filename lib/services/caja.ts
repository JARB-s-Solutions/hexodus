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
 * Genera fechas inicial y final para un día específico
 * Útil para cerrar cajas antiguas del día que se abrieron
 */
function obtenerFechasDeDia(fechaReferencia: string): { fecha_inicial: string; fecha_final: string } {
  const fecha = new Date(fechaReferencia)
  const fecha_inicial = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0)
  const fecha_final = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999)

  console.log("📅 Calculando fechas para:", fechaReferencia)
  console.log("  Fecha inicial:", fecha_inicial.toISOString())
  console.log("  Fecha final:", fecha_final.toISOString())

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
   * Consultar caja con rango de fechas amplio (últimos 7 días)
   * Útil para detectar cajas antiguas sin cerrar
   * POST /api/caja/consultar
   */
  static async consultarCajaAmplio(): Promise<ConsultarCajaResponse> {
    console.log("🔍 Consultando caja con rango amplio (últimos 7 días)...")

    try {
      const ahora = new Date()
      const hace7Dias = new Date(ahora)
      hace7Dias.setDate(ahora.getDate() - 7)
      hace7Dias.setHours(0, 0, 0, 0)
      
      const finDeHoy = new Date(ahora)
      finDeHoy.setHours(23, 59, 59, 999)

      const data: ConsultarCajaData = {
        fecha_inicial: hace7Dias.toISOString(),
        fecha_final: finDeHoy.toISOString(),
      }

      console.log("  Rango:", data.fecha_inicial, "a", data.fecha_final)

      const response = await apiPost<ConsultarCajaResponse>("/caja/consultar", data)

      console.log("✅ Consulta amplia completada:")
      console.log("  Movimientos encontrados:", response.movimientos.length)

      return response
    } catch (error: any) {
      console.error("❌ Error consultando caja amplia:", error)
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
   * Cerrar caja antigua (de días anteriores)
   * Usa las fechas del día que se abrió la caja
   * POST /api/caja/cerrar
   */
  static async cerrarCajaAntigua(
    fechaApertura: string,
    observacion?: string
  ): Promise<CerrarCajaResponse> {
    console.log("🔒📅 Cerrando caja antigua...")
    console.log("  Fecha de apertura:", fechaApertura)

    try {
      // Obtener fechas del día que se abrió la caja
      const fechas = obtenerFechasDeDia(fechaApertura)
      const data: CerrarCajaData = {
        ...fechas,
        observacion: observacion || "Cierre automático de caja antigua",
      }

      console.log("  Rango:", fechas.fecha_inicial, "a", fechas.fecha_final)
      console.log("  Observación:", data.observacion)

      const response = await apiPost<CerrarCajaResponse>("/caja/cerrar", data)

      console.log("✅ Caja antigua cerrada exitosamente:")
      console.log("  Corte ID:", response.data.corte_id)
      console.log("  Total ingresos:", response.data.total_ingresos_amarrados)

      return response
    } catch (error: any) {
      console.error("❌ Error cerrando caja antigua:", error)
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
