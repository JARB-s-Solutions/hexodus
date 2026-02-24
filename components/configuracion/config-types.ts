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

  // Notificaciones
  notifPush: boolean
  notifEmail: boolean
  notifSounds: boolean
  notifSocios: boolean
  notifVencimientos: boolean
  notifVentas: boolean
  notifInventario: boolean

  // Avanzado
  backupAuto: boolean
  backupFrecuencia: string
  cacheSistema: boolean
  compresion: boolean
  lazyLoading: boolean
}

export const defaultConfig: ConfigState = {
  colorPrincipal: "#FF3B3B",
  colorSecundario: "#00BFFF",
  modoTema: "dark",
  nombreSistema: "HEXODUS",

  idiomaSistema: "es-MX",
  zonaHoraria: "America/Mexico_City",
  formatoFecha: "DD/MM/YYYY",

  notifPush: true,
  notifEmail: true,
  notifSounds: false,
  notifSocios: true,
  notifVencimientos: true,
  notifVentas: true,
  notifInventario: true,

  backupAuto: true,
  backupFrecuencia: "daily",
  cacheSistema: true,
  compresion: true,
  lazyLoading: true,
}
