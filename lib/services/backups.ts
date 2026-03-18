import { apiGet, apiPost } from '@/lib/api'

export interface BackupGenerado {
  id: number
  tipo: string
  archivo: string
  rutaLocal: string
  rutaRemota: string
  tamanoMb: string
  checksum: string | null
  status: string
  error: string | null
  generadoPor: number | null
  generadoEn: string
  usuario?: {
    nombreCompleto: string
  } | null
}

interface CrearBackupResponse {
  success: boolean
  message: string
  data: BackupGenerado
}

interface HistorialBackupsResponse {
  success: boolean
  data: BackupGenerado[]
}

interface DescargarBackupResponse {
  success: boolean
  message: string
  downloadUrl: string
}

interface RestaurarBackupResponse {
  success: boolean
  message: string
}

export class BackupsService {
  /**
   * Genera un nuevo backup manual en la nube.
   * POST /api/backups
   */
  static async generarBackup(): Promise<BackupGenerado> {
    const response = await apiPost<CrearBackupResponse>('/backups')

    if (!response.success || !response.data) {
      throw new Error(response.message || 'No se pudo generar el backup')
    }

    return response.data
  }

  /**
   * Obtiene el historial de backups.
   * GET /api/backups
   */
  static async obtenerHistorial(): Promise<BackupGenerado[]> {
    const response = await apiGet<HistorialBackupsResponse>('/backups')

    if (!response.success || !Array.isArray(response.data)) {
      throw new Error('No se pudo obtener el historial de backups')
    }

    return response.data
  }

  /**
   * Obtiene una URL segura de descarga para un backup.
   * GET /api/backups/descargar/:archivo
   */
  static async obtenerUrlDescarga(nombreArchivo: string): Promise<string> {
    const response = await apiGet<DescargarBackupResponse>(`/backups/descargar/${encodeURIComponent(nombreArchivo)}`)

    if (!response.success || !response.downloadUrl) {
      throw new Error(response.message || 'No se pudo generar la URL de descarga')
    }

    return response.downloadUrl
  }

  /**
   * Restaura la base de datos a partir de un archivo de backup.
   * POST /api/backups/restaurar
   */
  static async restaurarBackup(nombreArchivo: string): Promise<string> {
    const response = await apiPost<RestaurarBackupResponse>('/backups/restaurar', {
      archivo: nombreArchivo,
    })

    if (!response.success) {
      throw new Error(response.message || 'No se pudo restaurar el backup')
    }

    return response.message || 'Backup restaurado correctamente'
  }
}
