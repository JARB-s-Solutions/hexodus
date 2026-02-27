// ================================================
// TIPOS DE DATOS PARA SOCIOS
// ================================================

/**
 * Estado del socio
 */
export type EstadoSocio = 'activo' | 'inactivo' | 'suspendido'

/**
 * Estado de pago
 */
export type EstadoPago = 'pagado' | 'sin_pagar' | 'pendiente'

/**
 * Género
 */
export type Genero = 'Masculino' | 'Femenino' | 'Otro'

/**
 * Datos personales del socio
 */
export interface DatosPersonales {
  nombre_completo: string
  correo_electronico?: string
  numero_telefono?: string
  genero: Genero
  direccion?: string
}

/**
 * Detalles del contrato
 */
export interface DetallesContrato {
  contrato_firmado: boolean
  inicio_contrato?: string // ISO date
  fin_contrato?: string // ISO date
}

/**
 * Datos biométricos
 */
export interface Biometria {
  foto_perfil_url?: string
  face_encoding?: number[]
  face_encoding_updated_at?: string
  fingerprint_template?: string
  fingerprint_updated_at?: string
}

/**
 * Información de membresía del socio
 */
export interface MembresiaSocio {
  plan_id: number
  fecha_inicio: string // ISO date
  estado_pago: EstadoPago
  metodo_pago_id?: number
}

/**
 * Estructura completa para crear un socio
 */
export interface CreateSocioRequest {
  personal: DatosPersonales
  detalles_contrato: DetallesContrato
  biometria: Biometria
  membresia: MembresiaSocio
}

/**
 * Desglose de cobro
 */
export interface DesgloseCobro {
  precio_regular: number
  tiene_descuento: boolean
  ahorro: number
  total_a_pagar: number
}

/**
 * Request para cotizar
 */
export interface CotizarRequest {
  plan_id: number
  fecha_inicio: string
}

/**
 * Response de cotización
 */
export interface CotizacionResponse {
  message: string
  data: {
    plan_id: number
    nombre_plan: string
    duracion_dias: number
    fecha_inicio: string
    fecha_vencimiento: string
    desglose_cobro: DesgloseCobro
  }
}

/**
 * Response de creación de socio
 */
export interface CreateSocioResponse {
  message: string
  data: {
    socio_id: number
    codigo_socio: string
  }
}

/**
 * Estadísticas del dashboard de socios (desde GET /socios)
 */
export interface DashboardStatsSocios {
  total_socios: {
    valor: number
    etiqueta: string
  }
  socios_activos: {
    valor: number
    etiqueta: string
  }
  vencidos: {
    valor: number
    etiqueta: string
  }
  vencen_en_7_dias: {
    valor: number
    etiqueta: string
  }
}

/**
 * Socio en formato de lista (GET /socios)
 */
export interface SocioListItemAPI {
  socio_id: number
  clave: string
  nombre: string
  genero: string // "Masculino" | "Femenino" | "Otro"
  contacto: {
    telefono: string
    correo: string
  }
  membresia: string // Nombre del plan
  vencimiento: string // ISO date
  vigencia: string // "Activa" | "Vencida" | etc.
  estado_contrato: string // "vigente" | "vencido" | "sin_firma"
}

/**
 * Response de GET /socios (lista completa)
 */
export interface GetSociosResponse {
  message: string
  dashboard_stats: DashboardStatsSocios
  data: SocioListItemAPI[]
  pagination: {
    current_page: number
    limit: number
    total_records: number
    total_pages: number
  }
}

/**
 * Socio completo (desde la API)
 */
export interface SocioAPI {
  socio_id: number
  codigo_socio: string
  uuid_socio?: string
  nombre_completo: string
  correo_electronico: string
  numero_telefono: string
  genero: Genero
  direccion: string
  foto_perfil_url?: string
  face_encoding?: number[]
  face_encoding_updated_at?: string
  fingerprint_template?: string
  fingerprint_updated_at?: string
  contrato_firmado: boolean
  inicio_contrato?: string
  fin_contrato?: string
  plan_id: number
  nombre_plan?: string
  fecha_inicio_membresia: string
  fecha_vencimiento_membresia: string
  estado_pago: EstadoPago
  estado_socio: EstadoSocio
  created_at?: string
  updated_at?: string
}

/**
 * Socio para usar en el frontend (camelCase)
 */
export interface Socio {
  id: number
  codigoSocio: string
  uuidSocio?: string
  nombre: string
  correo: string
  telefono: string
  genero: Genero
  direccion: string
  fotoPerfil?: string
  faceEncoding?: number[]
  faceEncodingUpdatedAt?: string
  fingerprintTemplate?: string
  fingerprintUpdatedAt?: string
  firmoContrato: boolean
  inicioContrato?: string
  finContrato?: string
  planId: number
  nombrePlan?: string
  fechaInicioMembresia: string
  fechaVencimientoMembresia: string
  estadoPago: EstadoPago
  estadoSocio: EstadoSocio
  createdAt?: string
  updatedAt?: string
}

/**
 * Método de pago
 */
export interface MetodoPago {
  metodo_pago_id: number
  nombre: string
  descripcion?: string
  activo: boolean
}

/**
 * Mapear socio de API a Frontend
 */
export function mapSocioFromAPI(api: SocioAPI): Socio {
  return {
    id: api.socio_id,
    codigoSocio: api.codigo_socio,
    uuidSocio: api.uuid_socio,
    nombre: api.nombre_completo,
    correo: api.correo_electronico,
    telefono: api.numero_telefono,
    genero: api.genero,
    direccion: api.direccion,
    fotoPerfil: api.foto_perfil_url,
    faceEncoding: api.face_encoding,
    faceEncodingUpdatedAt: api.face_encoding_updated_at,
    fingerprintTemplate: api.fingerprint_template,
    fingerprintUpdatedAt: api.fingerprint_updated_at,
    firmoContrato: api.contrato_firmado,
    inicioContrato: api.inicio_contrato,
    finContrato: api.fin_contrato,
    planId: api.plan_id,
    nombrePlan: api.nombre_plan,
    fechaInicioMembresia: api.fecha_inicio_membresia,
    fechaVencimientoMembresia: api.fecha_vencimiento_membresia,
    estadoPago: api.estado_pago,
    estadoSocio: api.estado_socio,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

/**
 * Mapear socio de lista (GET /socios) a formato Frontend
 */
export function mapSocioListItemFromAPI(api: SocioListItemAPI): Socio {
  // Mapear género al formato esperado por el frontend
  let genero: Genero = 'Masculino'
  if (api.genero === 'Femenino') genero = 'Femenino'
  else if (api.genero === 'Otro') genero = 'Otro'
  
  // Determinar estado del socio según vigencia
  let estadoSocio: EstadoSocio = 'activo'
  if (api.vigencia.toLowerCase().includes('vencida')) estadoSocio = 'inactivo'
  
  return {
    id: api.socio_id,
    codigoSocio: api.clave,
    nombre: api.nombre,
    correo: api.contacto.correo,
    telefono: api.contacto.telefono,
    genero: genero,
    direccion: '', // No viene en la lista
    nombrePlan: api.membresia,
    fechaVencimientoMembresia: api.vencimiento,
    fechaInicioMembresia: '', // No viene en la lista
    estadoSocio: estadoSocio,
    firmoContrato: api.estado_contrato === 'vigente',
    planId: 0, // No viene en la lista
    estadoPago: 'pagado', // Asumimos pagado si está activo
  }
}

/**
 * Response genérica de lista de socios
 */
export interface SociosListResponse {
  message: string
  data: SocioAPI[]
  total?: number
}

/**
 * Response genérica de un socio
 */
export interface SocioResponse {
  message: string
  data: SocioAPI
}
