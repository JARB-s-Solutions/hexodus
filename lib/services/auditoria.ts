// ================================================
// SERVICIO DE AUDITORÍA
// ================================================

import { apiGet } from '../api'

// ── Tipos ──────────────────────────────────────────────────

export interface AuditoriaUsuario {
  username: string
  nombreCompleto: string
}

export interface AuditoriaEntry {
  id: string
  timestamp: string
  usuarioId: number
  modulo: string
  accion: string
  descripcion: string
  detalles: Record<string, unknown>
  ip: string
  userAgent: string
  usuario: AuditoriaUsuario | null
}

export interface AuditoriaPaginacion {
  total: number
  paginas: number
  paginaActual: number
}

export interface AuditoriaResponse {
  success: boolean
  data: AuditoriaEntry[]
  pagination: AuditoriaPaginacion
}

export interface FiltrosAuditoria {
  page?: number
  limit?: number
  modulo?: string
  accion?: string
  usuarioId?: number
}

// ── Servicio ───────────────────────────────────────────────

class AuditoriaServiceClass {
  async obtenerAuditoria(filtros: FiltrosAuditoria = {}): Promise<AuditoriaResponse> {
    const params = new URLSearchParams()

    if (filtros.page)      params.append('page',      String(filtros.page))
    if (filtros.limit)     params.append('limit',     String(filtros.limit))
    if (filtros.modulo)    params.append('modulo',    filtros.modulo)
    if (filtros.accion)    params.append('accion',    filtros.accion)
    if (filtros.usuarioId) params.append('usuarioId', String(filtros.usuarioId))

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiGet<AuditoriaResponse>(`/auditoria${query}`)
  }
}

export const AuditoriaService = new AuditoriaServiceClass()
