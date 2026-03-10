// ============================================================
// SERVICIO — ALERTAS DEL SISTEMA
// ============================================================

import { apiGet, apiPut, apiPatch } from '@/lib/api'
import type {
  AlertaConfig,
  AlertaConfigResponse,
  AlertasResponse,
  ResolverAlertaResponse,
  ActualizarConfigBody,
} from '@/lib/types/alertas'

export class AlertasService {
  /**
   * Obtener configuración actual de alertas
   * GET /api/alertas/configuracion
   */
  static async getConfiguracion(): Promise<AlertaConfig> {
    console.log('🔔 GET /api/alertas/configuracion - Cargando config de alertas')
    const response = await apiGet<AlertaConfigResponse>('/alertas/configuracion')
    if (!response.data) throw new Error('No se pudo obtener la configuración de alertas')
    return response.data
  }

  /**
   * Actualizar configuración de alertas
   * PUT /api/alertas/configuracion
   */
  static async actualizarConfiguracion(body: ActualizarConfigBody): Promise<AlertaConfig> {
    console.log('🔔 PUT /api/alertas/configuracion - Guardando config de alertas')
    const response = await apiPut<AlertaConfigResponse>('/alertas/configuracion', body)
    if (!response.data) throw new Error('Error al guardar la configuración de alertas')
    return response.data
  }

  /**
   * Obtener alertas activas del dashboard
   * GET /api/alertas
   */
  static async getAlertas(): Promise<AlertasResponse> {
    console.log('🔔 GET /api/alertas - Cargando alertas activas')
    return apiGet<AlertasResponse>('/alertas')
  }

  /**
   * Resolver o descartar una alerta
   * PATCH /api/alertas/:id/estado
   */
  static async resolverAlerta(
    id: string,
    estado: 'resuelta' | 'descartada',
    notas?: string
  ): Promise<ResolverAlertaResponse> {
    console.log(`🔔 PATCH /api/alertas/${id}/estado - Estado: ${estado}`)
    return apiPatch<ResolverAlertaResponse>(`/alertas/${id}/estado`, { estado, notas })
  }
}
