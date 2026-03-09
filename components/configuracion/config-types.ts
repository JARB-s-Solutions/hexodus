export interface ConfigState {
  // Apariencia
  colorPrincipal: string
  colorSecundario: string
  modoTema: "dark" | "light" | "auto"
  nombreSistema: string

  // Idioma
  idiomaSistema: string
  zonaHoraria: string
  formatoFecha: string

  // Notificaciones / Alertas del Sistema
  notifVencimientos: boolean
  notifVencimientoDias: number
  notifInventario: boolean
  notifStockMinimo: number
  notifInactividad: boolean
  notifInactividadDias: number
  notifPagosPendientes: boolean

  // Backups
  backupAuto: boolean
  backupFrecuencia: string
  backupRetencion: string

  // Avanzado
  cacheSistema: boolean
  compresion: boolean
  lazyLoading: boolean

  // Datos del Ticket / Gimnasio
  gimnasioNombre: string
  gimnasioDomicilio: string
  gimnasioTelefono: string
  gimnasioRFC: string
  gimnasioLogo: string  // URL del logo
  ticketFooter: string
  ticketMensajeAgradecimiento: string
}

export const defaultConfig: ConfigState = {
  colorPrincipal: "#FF3B3B",
  colorSecundario: "#00BFFF",
  modoTema: "dark",
  nombreSistema: "HEXODUS",

  idiomaSistema: "es-MX",
  zonaHoraria: "America/Mexico_City",
  formatoFecha: "DD/MM/YYYY",

  notifVencimientos: true,
  notifVencimientoDias: 7,
  notifInventario: true,
  notifStockMinimo: 10,
  notifInactividad: true,
  notifInactividadDias: 15,
  notifPagosPendientes: true,

  backupAuto: true,
  backupFrecuencia: "diario",
  backupRetencion: "30",

  cacheSistema: true,
  compresion: true,
  lazyLoading: true,

  gimnasioNombre: "GYM FITNESS",
  gimnasioDomicilio: "Av. Principal #123, Col. Centro, CP 12345",
  gimnasioTelefono: "+52 123 456 7890",
  gimnasioRFC: "GYM123456ABC",
  gimnasioLogo: "/assets/images/icon.png",
  ticketFooter: "¡Gracias por tu visita!",
  ticketMensajeAgradecimiento: "Te esperamos pronto",
}
