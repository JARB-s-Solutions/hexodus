import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api"
import type {
  MovimientosResponse,
  Movimiento,
  MovimientoKpis,
  GetMovimientosParams,
  CreateMovimientoData,
  CreateMovimientoResponse,
  UpdateMovimientoData,
  PaginationInfo,
  Concepto,
  ConceptosResponse,
  CreateConceptoData,
  CreateConceptoResponse,
  PeriodoComparacionAPI,
  ComparacionResponse,
  ComparacionData,
} from "@/lib/types/movimientos"
import {
  mapMovimientosFromAPI,
  mapKpisFromAPI,
} from "@/lib/types/movimientos"

/**
 * Servicio para gestionar movimientos (ingresos y egresos)
 */
export class MovimientosService {
  /**
   * Obtener todos los movimientos con filtros opcionales
   */
  static async getAll(
    params?: GetMovimientosParams
  ): Promise<{
    movimientos: Movimiento[]
    kpis: MovimientoKpis
    pagination: PaginationInfo
  }> {
    // Construir query parameters
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.tipo && params.tipo !== "Todos") {
      queryParams.append("tipo", params.tipo)
    }
    if (params?.metodo_pago) {
      queryParams.append("metodo_pago", params.metodo_pago)
    }
    if (params?.search) queryParams.append("search", params.search)
    if (params?.fecha_inicio) {
      queryParams.append("fecha_inicio", params.fecha_inicio)
    }
    if (params?.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)

    const queryString = queryParams.toString()
    const endpoint = queryString
      ? `/movimientos?${queryString}`
      : "/movimientos"

    console.log("📊 Llamando a:", endpoint)

    const response = await apiGet<MovimientosResponse>(endpoint)

    console.log("✅ Respuesta API movimientos:", {
      total_registros: response.pagination.total_records,
      movimientos_count: response.data.length,
      stats: response.dashboard_stats,
    })

    // Mapear datos de API a formato frontend
    const movimientos = mapMovimientosFromAPI(response.data)
    const kpis = mapKpisFromAPI(response.dashboard_stats)

    return {
      movimientos,
      kpis,
      pagination: response.pagination,
    }
  }

  /**
   * Crear un nuevo movimiento (ingreso o gasto)
   */
  static async create(data: CreateMovimientoData): Promise<CreateMovimientoResponse> {
    console.log("📝 Creando movimiento:", data)

    try {
      const response = await apiPost<CreateMovimientoResponse>("/movimientos", data)

      console.log("✅ Movimiento creado exitosamente:", response)
      return response
    } catch (error: any) {
      console.error("❌ Error capturado en MovimientosService.create")
      console.error("  - Error type:", error.constructor.name)
      console.error("  - Error status:", error.status)
      console.error("  - Error message:", error.message)
      console.error("  - Error completo:", error)

      // Manejar errores específicos del backend
      if (error.status === 403) {
        const mensaje = error.message || 
          "Operación denegada: La caja está cerrada. Debes realizar la apertura de caja primero."
        console.error("  → Lanzando error 403:", mensaje)
        throw new Error(mensaje)
      }

      if (error.status === 400) {
        // Puede ser fondos insuficientes u otro error de validación
        const mensaje = error.message || "Error de validación. Verifica los datos ingresados."
        console.error("  → Lanzando error 400:", mensaje)
        throw new Error(mensaje)
      }

      if (error.status === 404) {
        const mensaje = "El concepto seleccionado no existe."
        console.error("  → Lanzando error 404:", mensaje)
        throw new Error(mensaje)
      }

      // Error genérico
      const mensajeGenerico = error.message || "No se pudo registrar el movimiento. Intenta de nuevo."
      console.error("  → Lanzando error genérico:", mensajeGenerico)
      throw new Error(mensajeGenerico)
    }
  }

  /**
   * Actualizar un movimiento existente
   */
  static async update(
    id: number,
    data: CreateMovimientoData
  ): Promise<void> {
    console.log("✏️ Actualizando movimiento:", id, data)

    try {
      await apiPut<{
        message: string
      }>(`/movimientos/${id}`, data)

      console.log("✅ Movimiento actualizado")
    } catch (error: any) {
      console.error("❌ Error actualizando movimiento:", error)

      // Manejar errores específicos
      if (error.status === 403) {
        throw new Error("Operación denegada: La caja está cerrada.")
      }

      if (error.status === 400) {
        throw new Error(error.message || "Error de validación. Verifica los datos ingresados.")
      }

      if (error.status === 404) {
        throw new Error("El movimiento no existe o el concepto no es válido.")
      }

      throw new Error(error.message || "No se pudo actualizar el movimiento.")
    }
  }

  /**
   * Eliminar un movimiento
   */
  static async delete(id: number): Promise<void> {
    console.log("🗑️ Eliminando movimiento:", id)

    await apiDelete<{
      message: string
    }>(`/movimientos/${id}`)

    console.log("✅ Movimiento eliminado")
  }

  /**
   * Obtener un movimiento por ID
   */
  static async getById(id: number): Promise<Movimiento | null> {
    console.log("🔍 Obteniendo movimiento:", id)

    try {
      const response = await apiGet<{
        message: string
        movimiento: any
      }>(`/movimientos/${id}`)

      console.log("✅ Movimiento encontrado:", response)

      const { mapMovimientoFromAPI } = await import("@/lib/types/movimientos")
      return mapMovimientoFromAPI(response.movimiento)
    } catch (error) {
      console.error("❌ Error obteniendo movimiento:", error)
      return null
    }
  }

  /**
   * Obtener todos los conceptos de movimientos
   */
  static async getConceptos(): Promise<Concepto[]> {
    console.log("📋 Obteniendo conceptos...")

    try {
      const response = await apiGet<ConceptosResponse>("/conceptos")

      console.log("✅ Conceptos obtenidos:", response.data.length)
      console.log("  Conceptos:", response.data)

      return response.data
    } catch (error: any) {
      console.error("❌ Error obteniendo conceptos:", error)
      
      // Retornar conceptos hardcoded como fallback
      const { CONCEPTOS_INGRESO, CONCEPTOS_GASTO } = await import("@/lib/types/movimientos")
      const fallbackConceptos = [...CONCEPTOS_INGRESO, ...CONCEPTOS_GASTO]
      
      console.warn("⚠️ Usando conceptos hardcoded como fallback:", fallbackConceptos.length)
      
      return fallbackConceptos
    }
  }

  /**
   * Crear un nuevo concepto (ingreso o egreso)
   * POST /api/conceptos
   */
  static async createConcepto(data: CreateConceptoData): Promise<Concepto> {
    console.log("➕ Creando concepto:", data)

    try {
      const response = await apiPost<CreateConceptoResponse>("/conceptos", data)

      console.log("✅ Concepto creado:", response.data)
      console.log("  ID:", response.data.id)
      console.log("  Nombre:", response.data.nombre)
      console.log("  Tipo:", response.data.tipo)
      console.log("  Status:", response.data.status)

      // Convertir la respuesta al formato Concepto
      const concepto: Concepto = {
        id: response.data.id,
        nombre: response.data.nombre,
        tipo: response.data.tipo,
        status: response.data.status,
      }

      return concepto
    } catch (error: any) {
      console.error("❌ Error creando concepto:", error)
      throw error
    }
  }

  /**
   * Obtener comparación de movimientos por período
   * GET /api/movimientos/comparacion?periodo={periodo}
   */
  static async getComparacion(periodo: PeriodoComparacionAPI): Promise<ComparacionData> {
    console.log("📊 Obteniendo comparación para período:", periodo)

    try {
      const response = await apiGet<ComparacionResponse>(
        `/movimientos/comparacion?periodo=${encodeURIComponent(periodo)}`
      )

      console.log("✅ Comparación obtenida:", response.message)
      console.log("  Labels:", response.data.labels_columnas)
      console.log("  Filas:", response.data.filas.length)

      return response.data
    } catch (error: any) {
      console.error("❌ Error obteniendo comparación:", error)
      throw error
    }
  }
}
