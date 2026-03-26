// ============================================================
// SERVICIO DE CONFIGURACIÓN GLOBAL (APARIENCIA + TICKET)
// ============================================================

import { ApiError, apiDelete, apiGet, apiPatch, apiPut } from '@/lib/api'

export type ModoTema = 'dark' | 'light' | 'auto'

export interface ConfiguracionApariencia {
  colorPrincipal: string
  colorSecundario: string
  modoTema: ModoTema
  nombreSistema: string
  logoSistema: string | null
}

export interface ConfiguracionGimnasio {
  gimnasioNombre: string
  gimnasioDomicilio: string
  gimnasioTelefono: string
  gimnasioRFC: string
  gimnasioLogo: string
  ticketFooter: string
  ticketMensajeAgradecimiento: string
}

export interface ConfiguracionSistemaData extends ConfiguracionApariencia {
  gimnasioNombre: string
  gimnasioDomicilio: string
  gimnasioTelefono: string
  gimnasioRFC: string
  gimnasioLogo: string | null
  ticketFooter: string
  ticketMensajeAgradecimiento: string
  updatedAt?: string
}

export interface ConfiguracionSistemaResponse {
  success?: boolean
  message: string
  data: ConfiguracionSistemaData
}

export interface ConfiguracionResponse {
  message: string
  data: ConfiguracionGimnasio
}

const DEFAULT_CONFIG_SISTEMA: ConfiguracionSistemaData = {
  colorPrincipal: '#FF3B3B',
  colorSecundario: '#00BFFF',
  modoTema: 'dark',
  nombreSistema: 'HEXODUS',
  logoSistema: null,
  gimnasioNombre: 'GYM FITNESS',
  gimnasioDomicilio: 'Av. Principal #123, Col. Centro, CP 12345',
  gimnasioTelefono: '+52 123 456 7890',
  gimnasioRFC: 'XAXX010101000',
  gimnasioLogo: null,
  ticketFooter: '¡Gracias por tu visita!',
  ticketMensajeAgradecimiento: 'Te esperamos pronto',
}

function normalizarModoTema(value: unknown): ModoTema {
  if (value === 'light' || value === 'auto') return value
  return 'dark'
}

function normalizarConfiguracion(data?: Partial<ConfiguracionSistemaData>): ConfiguracionSistemaData {
  return {
    colorPrincipal: data?.colorPrincipal || DEFAULT_CONFIG_SISTEMA.colorPrincipal,
    colorSecundario: data?.colorSecundario || DEFAULT_CONFIG_SISTEMA.colorSecundario,
    modoTema: normalizarModoTema(data?.modoTema),
    nombreSistema: data?.nombreSistema || DEFAULT_CONFIG_SISTEMA.nombreSistema,
    logoSistema: data?.logoSistema ?? DEFAULT_CONFIG_SISTEMA.logoSistema,
    gimnasioNombre: data?.gimnasioNombre || DEFAULT_CONFIG_SISTEMA.gimnasioNombre,
    gimnasioDomicilio: data?.gimnasioDomicilio || DEFAULT_CONFIG_SISTEMA.gimnasioDomicilio,
    gimnasioTelefono: data?.gimnasioTelefono || DEFAULT_CONFIG_SISTEMA.gimnasioTelefono,
    gimnasioRFC: data?.gimnasioRFC || DEFAULT_CONFIG_SISTEMA.gimnasioRFC,
    gimnasioLogo: data?.gimnasioLogo ?? DEFAULT_CONFIG_SISTEMA.gimnasioLogo,
    ticketFooter: data?.ticketFooter || DEFAULT_CONFIG_SISTEMA.ticketFooter,
    ticketMensajeAgradecimiento:
      data?.ticketMensajeAgradecimiento || DEFAULT_CONFIG_SISTEMA.ticketMensajeAgradecimiento,
    updatedAt: data?.updatedAt,
  }
}

function mapearErrorConfiguracion(error: unknown, fallback: string): Error {
  if (error instanceof ApiError) {
    const rawErrors = error.errors as unknown
    if (Array.isArray(rawErrors) && rawErrors.length > 0) {
      const detalle = rawErrors.find((item) => typeof item === 'object' && item !== null) as
        | { detail?: string }
        | undefined
      if (detalle?.detail) return new Error(detalle.detail)
    }
    return new Error(error.message || fallback)
  }

  if (error instanceof Error) {
    return new Error(error.message || fallback)
  }

  return new Error(fallback)
}

function validarBase64Logo(campo: 'logoSistema' | 'gimnasioLogo', value?: string | null): void {
  if (!value) return
  const lower = value.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    if (campo === 'gimnasioLogo') {
      throw new Error(
        'El campo gimnasioLogo no permite enlaces (URLs). Debe ser una imagen en Base64 para poder imprimirse en el ticket.'
      )
    }
    throw new Error('El campo logoSistema no permite enlaces (URLs). Debe ser una imagen en Base64.')
  }
}

export class ConfiguracionService {
  /**
   * GET /configuracion/sistema
   */
  static async obtenerConfiguracionUnificada(): Promise<ConfiguracionSistemaResponse> {
    try {
      const response = await apiGet<ConfiguracionSistemaResponse>('/configuracion/sistema')
      return {
        ...response,
        data: normalizarConfiguracion(response.data),
      }
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'No se pudo obtener la configuración del sistema')
    }
  }

  /**
   * Compatibilidad con consumidores que solo necesitan datos de ticket/gimnasio.
   */
  static async obtenerConfiguracion(): Promise<ConfiguracionResponse> {
    const response = await this.obtenerConfiguracionUnificada()
    const data = response.data

    return {
      message: response.message,
      data: {
        gimnasioNombre: data.gimnasioNombre,
        gimnasioDomicilio: data.gimnasioDomicilio,
        gimnasioTelefono: data.gimnasioTelefono,
        gimnasioRFC: data.gimnasioRFC,
        gimnasioLogo: data.gimnasioLogo || '',
        ticketFooter: data.ticketFooter,
        ticketMensajeAgradecimiento: data.ticketMensajeAgradecimiento,
      },
    }
  }

  /**
   * PUT /configuracion/sistema
   */
  static async actualizarConfiguracionTotal(
    body: Omit<ConfiguracionSistemaData, 'updatedAt'>
  ): Promise<ConfiguracionSistemaResponse> {
    validarBase64Logo('logoSistema', body.logoSistema)
    validarBase64Logo('gimnasioLogo', body.gimnasioLogo)

    try {
      const response = await apiPut<ConfiguracionSistemaResponse>('/configuracion/sistema', body)
      return {
        ...response,
        data: normalizarConfiguracion(response.data),
      }
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'Error al actualizar la configuración global')
    }
  }

  /**
   * PATCH /configuracion/sistema/apariencia
   */
  static async actualizarSoloApariencia(
    body: Partial<ConfiguracionApariencia>
  ): Promise<ConfiguracionSistemaResponse> {
    validarBase64Logo('logoSistema', body.logoSistema)

    try {
      const response = await apiPatch<ConfiguracionSistemaResponse>(
        '/configuracion/sistema/apariencia',
        body
      )
      return {
        ...response,
        data: normalizarConfiguracion(response.data),
      }
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'Error al actualizar la apariencia del sistema')
    }
  }

  /**
   * PATCH /configuracion/sistema/ticket
   */
  static async actualizarSoloTicket(
    body: Partial<ConfiguracionGimnasio>
  ): Promise<ConfiguracionSistemaResponse> {
    validarBase64Logo('gimnasioLogo', body.gimnasioLogo)

    try {
      const response = await apiPatch<ConfiguracionSistemaResponse>(
        '/configuracion/sistema/ticket',
        body
      )
      return {
        ...response,
        data: normalizarConfiguracion(response.data),
      }
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'Error al actualizar los datos del ticket')
    }
  }

  /**
   * Compatibilidad con flujo actual de guardado de ticket.
   */
  static async guardarConfiguracion(config: ConfiguracionGimnasio): Promise<ConfiguracionResponse> {
    const response = await this.actualizarSoloTicket(config)
    const data = response.data

    return {
      message: response.message,
      data: {
        gimnasioNombre: data.gimnasioNombre,
        gimnasioDomicilio: data.gimnasioDomicilio,
        gimnasioTelefono: data.gimnasioTelefono,
        gimnasioRFC: data.gimnasioRFC,
        gimnasioLogo: data.gimnasioLogo || '',
        ticketFooter: data.ticketFooter,
        ticketMensajeAgradecimiento: data.ticketMensajeAgradecimiento,
      },
    }
  }

  /**
   * DELETE /configuracion/sistema/logo-apariencia
   */
  static async eliminarLogoApariencia(): Promise<{ success?: boolean; message: string }> {
    try {
      return await apiDelete<{ success?: boolean; message: string }>(
        '/configuracion/sistema/logo-apariencia'
      )
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'No se pudo eliminar el logo de apariencia')
    }
  }

  /**
   * DELETE /configuracion/sistema/logo-ticket
   */
  static async eliminarLogoTicket(): Promise<{ success?: boolean; message: string }> {
    try {
      return await apiDelete<{ success?: boolean; message: string }>(
        '/configuracion/sistema/logo-ticket'
      )
    } catch (error) {
      throw mapearErrorConfiguracion(error, 'No se pudo eliminar el logo del ticket')
    }
  }

  /**
   * Mantiene compatibilidad con la UI actual de "restablecer" sin endpoint dedicado.
   */
  static async restaurarDefecto(): Promise<ConfiguracionResponse> {
    return {
      message: 'Configuración restablecida localmente',
      data: {
        gimnasioNombre: DEFAULT_CONFIG_SISTEMA.gimnasioNombre,
        gimnasioDomicilio: DEFAULT_CONFIG_SISTEMA.gimnasioDomicilio,
        gimnasioTelefono: DEFAULT_CONFIG_SISTEMA.gimnasioTelefono,
        gimnasioRFC: DEFAULT_CONFIG_SISTEMA.gimnasioRFC,
        gimnasioLogo: DEFAULT_CONFIG_SISTEMA.gimnasioLogo || '',
        ticketFooter: DEFAULT_CONFIG_SISTEMA.ticketFooter,
        ticketMensajeAgradecimiento: DEFAULT_CONFIG_SISTEMA.ticketMensajeAgradecimiento,
      },
    }
  }
}
