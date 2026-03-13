"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AsistenciaHeader } from "@/components/asistencia/asistencia-header"
import { KpiAsistenciaCards } from "@/components/asistencia/kpi-asistencia"
import { PanelEscaneo } from "@/components/asistencia/panel-escaneo"
import { HistorialRegistros } from "@/components/asistencia/historial-registros"
import { RegistroManualModal } from "@/components/asistencia/registro-manual-modal"
import { HistorialSocioModal } from "@/components/asistencia/historial-socio-modal"
import { HistorialSocioTab } from "@/components/asistencia/historial-socio-tab"
import { CobrarMembresiaModal } from "@/components/socios/cobrar-membresia-modal"
import { AsistenciaService } from "@/lib/services/asistencia"
import { SociosService } from "@/lib/services/socios"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/lib/contexts/auth-context"
import {
  DEFAULT_CONFIG,
  type RegistroAcceso,
  type ConfigRegistro,
  type KpiAsistencia,
  type EstadoMembresia,
} from "@/lib/asistencia-data"
import type { Socio as SocioTipo } from "@/lib/types/socios"

export default function AsistenciaPage() {
  const POLLING_INTERVAL_MS = 60000

  const router = useRouter()
  const { toast } = useToast()
  const { tienePermiso } = useAuthContext()
  const puedeRegistrarManual = tienePermiso("asistencia", "registrarManual")
  const puedeVerHistorial = tienePermiso("asistencia", "verHistorial")
  const puedeExportar = tienePermiso("asistencia", "exportar")
  const puedeCobrarAdeudos = tienePermiso("socios", "pagar")
  
  // Estados para tab activo
  const [tabActivo, setTabActivo] = useState<"hoy" | "historial" | "socio">("hoy")
  
  // Estados para registros de hoy
  const [registrosHoy, setRegistrosHoy] = useState<RegistroAcceso[]>([])
  const [loadingHoy, setLoadingHoy] = useState(false)
  const [errorHoy, setErrorHoy] = useState<string | null>(null)
  
  // Estados para historial completo
  const [registrosHistorial, setRegistrosHistorial] = useState<RegistroAcceso[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)
  const [paginaHistorial, setPaginaHistorial] = useState(1)
  const [totalPaginasHistorial, setTotalPaginasHistorial] = useState(1)
  const [totalRegistrosHistorial, setTotalRegistrosHistorial] = useState(0)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(50)
  
  // Estados para filtros de historial
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos")
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")
  
  // Estados para historial por socio
  const [socioSeleccionadoId, setSocioSeleccionadoId] = useState<number | null>(null)
  const [datosSocio, setDatosSocio] = useState<{
    id: number
    codigoSocio: string
    nombreCompleto: string
    fotoUrl?: string
  } | null>(null)
  const [asistenciasSocio, setAsistenciasSocio] = useState<RegistroAcceso[]>([])
  const [loadingSocio, setLoadingSocio] = useState(false)
  const [errorSocio, setErrorSocio] = useState<string | null>(null)
  
  // Estados comunes
  const [kpisData, setKpisData] = useState<KpiAsistencia>({
    asistentesHoy: 0,
    activosAhora: 0,
    denegados: 0,
    permanenciaPromedio: "0m",
  })
  const [config, setConfig] = useState<ConfigRegistro>(DEFAULT_CONFIG)
  const [pantallaAbierta, setPantallaAbierta] = useState(false)
  const [sistemaListo, setSistemaListo] = useState(false)
  const [modalRegistroManual, setModalRegistroManual] = useState(false)
  const [modalHistorialSocio, setModalHistorialSocio] = useState<string | null>(null)
  const [modalCobroAdeudoOpen, setModalCobroAdeudoOpen] = useState(false)
  const [socioAdeudo, setSocioAdeudo] = useState<SocioTipo | null>(null)
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [errorKpis, setErrorKpis] = useState<string | null>(null)

  useEffect(() => {
    if (tabActivo !== "hoy" && !puedeVerHistorial) {
      setTabActivo("hoy")
    }
  }, [tabActivo, puedeVerHistorial])
  
  const ventanaRef = useRef<Window | null>(null)

  const inferirEstadoMembresiaDesdeMotivo = useCallback((motivoCodigo?: string): EstadoMembresia => {
    const codigo = (motivoCodigo || '').toLowerCase()
    if (codigo.includes('vencida')) return 'vencida'
    if (codigo.includes('sin_membresia')) return 'sin_membresia'
    if (codigo.includes('sin_pago') || codigo.includes('pendiente')) return 'sin_pago'
    return 'permitido'
  }, [])

  const esRegistroDenegadoApi = useCallback((registro: { tipo?: string; estado_acceso?: string; notas?: string | null }) => {
    const tipo = String(registro.tipo || '').toUpperCase()
    const estadoAcceso = String(registro.estado_acceso || '').toLowerCase()
    const notasDenegado = String(registro.notas || '').toLowerCase().includes('denegado')
    return tipo === 'DENEGADO' || estadoAcceso === 'denegado' || notasDenegado
  }, [])

  const obtenerOverridesDenegacion = useCallback((): Record<string, {
    estadoMembresia?: EstadoMembresia
    motivo?: string
    socioId?: string
  }> => {
    if (typeof window === 'undefined') return {}

    try {
      return JSON.parse(localStorage.getItem('asistencia_denegaciones_override') || '{}')
    } catch {
      return {}
    }
  }, [])

  // Cargar asistencias del día actual (endpoint /hoy con campo 'hora')
  const cargarAsistenciasHoy = useCallback(async () => {
    try {
      setLoadingHoy(true)
      setErrorHoy(null)

      const response = await AsistenciaService.obtenerAsistenciasHoy()

      console.log('[cargarAsistenciasHoy] Response completa:', response)
      console.log('[cargarAsistenciasHoy] Primer registro:', response.data?.asistencias[0])

      if (response.success && response.data) {
        const overrides = obtenerOverridesDenegacion()

        // Transformar datos: /hoy tiene campo 'hora' (string "03:03:36") no 'timestamp'
        const registrosTransformados: RegistroAcceso[] = response.data.asistencias.map((r) => {
          // Determinar confianza
          console.log('[HOY] Registro:', {
            nombre: r.socio_nombre,
            confidence: r.confidence,
            confidenceType: typeof r.confidence,
            allKeys: Object.keys(r)
          })
          
          let confianzaStr = "N/A"
          if (r.confidence != null) {
            const conf = r.confidence
            confianzaStr = conf > 1 ? conf.toFixed(0) : (conf * 100).toFixed(0)
            console.log('[HOY] Confianza calculada:', confianzaStr)
          } else {
            console.warn('[HOY] No hay confidence para:', r.socio_nombre)
          }

          // Construir timestamp desde fecha + hora
          // fecha: "2026-03-09", hora: "03:03:36" -> "2026-03-09T03:03:36"
          const timestamp = `${response.data.fecha}T${r.hora}`
          const override = overrides[String(r.id)]
          const esDenegado = !!override || esRegistroDenegadoApi({ tipo: r.tipo, estado_acceso: (r as any).estado_acceso })
          const estadoMembresia = override?.estadoMembresia || inferirEstadoMembresiaDesdeMotivo((r as any).motivo_codigo)

          return {
            id: String(r.id),
            socioId: String(r.socio_id ?? r.codigo_socio),
            socioDbId: r.socio_id ? Number(r.socio_id) : undefined,
            nombreSocio: r.socio_nombre,
            tipo: esDenegado ? 'denegado' : 'permitido',
            motivo:
              override?.motivo ||
              (r as any).motivo_texto ||
              (esDenegado ? 'Acceso denegado' : (r.metodo === 'facial' ? 'Reconocimiento facial' : 'Registro manual')),
            confianza: confianzaStr,
            timestamp: timestamp,
            estadoMembresia,
            fotoUrl: r.foto_perfil_url,
            accionRecomendada: estadoMembresia === 'sin_pago'
              ? 'cobrar_adeudo'
              : estadoMembresia === 'vencida' || estadoMembresia === 'sin_membresia'
              ? 'renovar_membresia'
              : 'ninguna',
          }
        })

        setRegistrosHoy(registrosTransformados)

        // Usar resumen oficial del endpoint /asistencia/hoy para KPIs.
        setKpisData((prev) => ({
          asistentesHoy:
            typeof response.data.resumen?.entradas === 'number'
              ? response.data.resumen.entradas
              : registrosTransformados.filter((r) => r.tipo === 'permitido').length,
          activosAhora:
            typeof response.data.resumen?.socios_activos_ahora === 'number'
              ? response.data.resumen.socios_activos_ahora
              : prev.activosAhora,
          denegados:
            typeof (response.data.resumen as any)?.denegados === 'number'
              ? (response.data.resumen as any).denegados
              : registrosTransformados.filter((r) => r.tipo === 'denegado').length,
          permanenciaPromedio: prev.permanenciaPromedio,
        }))
      }
    } catch (error: any) {
      console.error("Error al cargar asistencias de hoy:", error)
      setErrorHoy(error.message || "Error al cargar asistencias de hoy")
      toast({
        title: "Error",
        description: "No se pudieron cargar las asistencias de hoy",
        variant: "destructive",
      })
    } finally {
      setLoadingHoy(false)
    }
  }, [toast, obtenerOverridesDenegacion])

  // Cargar historial completo (endpoint /asistencia con campo 'timestamp' y paginación)
  const cargarHistorialCompleto = useCallback(async (pagina: number = 1) => {
    try {
      setLoadingHistorial(true)
      setErrorHistorial(null)

      // Construir parámetros de filtro
      const filtros: any = {
        pagina,
        limite: registrosPorPagina,
      }

      // Agregar filtros opcionales
      if (filtroMetodo && filtroMetodo !== "todos") {
        filtros.metodo = filtroMetodo
      }

      if (fechaInicio) {
        filtros.fecha_inicio = fechaInicio
      }

      if (fechaFin) {
        filtros.fecha_fin = fechaFin
      }

      const response = await AsistenciaService.obtenerHistorial(filtros)

      console.log('[cargarHistorialCompleto] Response completa:', response)
      console.log('[cargarHistorialCompleto] Primer registro:', response.data?.asistencias[0])
      console.log('[cargarHistorialCompleto] Filtros aplicados:', filtros)

      if (response.success && response.data) {
        const overrides = obtenerOverridesDenegacion()

        // Transformar datos: /asistencia tiene campo 'timestamp' completo
        const registrosTransformados: RegistroAcceso[] = response.data.asistencias.map((r) => {
          // Determinar confianza
          console.log('[HISTORIAL] Registro:', {
            nombre: r.socio_nombre,
            confidence: r.confidence,
            confidenceType: typeof r.confidence,
            allKeys: Object.keys(r)
          })
          
          let confianzaStr = "N/A"
          if (r.confidence != null) {
            const conf = r.confidence
            confianzaStr = conf > 1 ? conf.toFixed(0) : (conf * 100).toFixed(0)
            console.log('[HISTORIAL] Confianza calculada:', confianzaStr)
          } else {
            console.warn('[HISTORIAL] No hay confidence para:', r.socio_nombre)
          }

          const override = overrides[String(r.id)]
          const esDenegado = !!override || esRegistroDenegadoApi({ tipo: r.tipo, estado_acceso: (r as any).estado_acceso, notas: r.notas })
          const estadoMembresia = override?.estadoMembresia || inferirEstadoMembresiaDesdeMotivo((r as any).motivo_codigo)

          return {
            id: String(r.id),
            socioId: String(r.socio_id), // Historial tiene socio_id
            socioDbId: Number(r.socio_id),
            nombreSocio: r.socio_nombre,
            tipo: esDenegado ? 'denegado' : 'permitido',
            motivo:
              override?.motivo ||
              (r as any).motivo_texto ||
              r.notas ||
              (esDenegado ? 'Acceso denegado' : (r.metodo === 'facial' ? 'Reconocimiento facial' : 'Registro manual')),
            confianza: confianzaStr,
            timestamp: r.timestamp, // Usar timestamp directamente
            estadoMembresia,
            fotoUrl: r.foto_perfil_url,
            accionRecomendada: estadoMembresia === 'sin_pago'
              ? 'cobrar_adeudo'
              : estadoMembresia === 'vencida' || estadoMembresia === 'sin_membresia'
              ? 'renovar_membresia'
              : 'ninguna',
          }
        })

        setRegistrosHistorial(registrosTransformados)
        setPaginaHistorial(response.data.pagination.page)
        setTotalPaginasHistorial(response.data.pagination.total_pages)
        setTotalRegistrosHistorial(response.data.pagination.total)
      }
    } catch (error: any) {
      console.error("Error al cargar historial completo:", error)
      setErrorHistorial(error.message || "Error al cargar historial completo")
      toast({
        title: "Error",
        description: "No se pudo cargar el historial completo",
        variant: "destructive",
      })
    } finally {
      setLoadingHistorial(false)
    }
  }, [toast, registrosPorPagina, filtroMetodo, fechaInicio, fechaFin, obtenerOverridesDenegacion])

  // Manejador para cambiar cantidad de registros por página
  const handleCambiarRegistrosPorPagina = useCallback((cantidad: number) => {
    setRegistrosPorPagina(cantidad)
    setPaginaHistorial(1) // Resetear a primera página
  }, [])

  // Manejadores de filtros
  const handleAplicarFiltros = useCallback(() => {
    setPaginaHistorial(1) // Resetear a primera página al aplicar filtros
    cargarHistorialCompleto(1)
  }, [cargarHistorialCompleto])

  const handleLimpiarFiltros = useCallback(() => {
    setFiltroMetodo("todos")
    setFechaInicio("")
    setFechaFin("")
    setPaginaHistorial(1)
    // Recargar con filtros limpios después de un pequeño delay
    setTimeout(() => {
      cargarHistorialCompleto(1)
    }, 0)
  }, [cargarHistorialCompleto])

  const handleCambiarFiltroMetodo = useCallback((metodo: string) => {
    setFiltroMetodo(metodo)
  }, [])

  const handleCambiarFechaInicio = useCallback((fecha: string) => {
    setFechaInicio(fecha)
  }, [])

  const handleCambiarFechaFin = useCallback((fecha: string) => {
    setFechaFin(fecha)
  }, [])

  // Cargar KPIs desde API
  const cargarKpis = useCallback(async () => {
    try {
      setLoadingKpis(true)
      setErrorKpis(null)

      const response = await AsistenciaService.obtenerKpis()

      if (response.success && response.data) {
        // Transformar datos de API a formato local
        setKpisData({
          asistentesHoy: response.data.entradas,
          activosAhora: response.data.socios_activos_ahora,
          denegados: (response.data as any).denegados ?? 0,
          permanenciaPromedio: "N/A",
        })
      }
    } catch (error: any) {
      console.error("Error al cargar KPIs:", error)
      setErrorKpis(error.message || "Error al cargar KPIs")
    } finally {
      setLoadingKpis(false)
    }
  }, [])

  // Recargar datos según tab activo
  const recargarDatos = useCallback(() => {
    if (tabActivo === "hoy") {
      cargarAsistenciasHoy()
    } else {
      cargarHistorialCompleto(paginaHistorial)
    }
    cargarKpis()
  }, [tabActivo, cargarAsistenciasHoy, cargarHistorialCompleto, cargarKpis, paginaHistorial])

  // Simulate system ready after mount
  useEffect(() => {
    const timer = setTimeout(() => setSistemaListo(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    cargarAsistenciasHoy() // Por defecto cargar "hoy"
    cargarKpis()
  }, [cargarAsistenciasHoy, cargarKpis])

  // Cargar datos al cambiar de tab
  useEffect(() => {
    if (tabActivo === "hoy") {
      cargarAsistenciasHoy()
    } else {
      cargarHistorialCompleto(1) // Cargar página 1 al abrir historial
    }
  }, [tabActivo, cargarAsistenciasHoy, cargarHistorialCompleto, registrosPorPagina])

  // Polling para actualizar datos cada 30 segundos (solo tab activo)
  useEffect(() => {
    const interval = setInterval(() => {
      if (tabActivo === "hoy") {
        cargarAsistenciasHoy()
      } else {
        cargarHistorialCompleto(paginaHistorial)
      }
      cargarKpis()
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [tabActivo, cargarAsistenciasHoy, cargarHistorialCompleto, cargarKpis, paginaHistorial, POLLING_INTERVAL_MS])

  // Check if client window is still open
  useEffect(() => {
    const interval = setInterval(() => {
      if (ventanaRef.current && ventanaRef.current.closed) {
        ventanaRef.current = null
        setPantallaAbierta(false)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for messages from scanner window
  useEffect(() => {
    const abrirCobroAdeudo = async (registro: RegistroAcceso) => {
      const socioId = registro.socioDbId

      if (!puedeCobrarAdeudos) return

      if (!socioId || Number.isNaN(Number(socioId))) {
        toast({
          title: "No se pudo abrir cobro",
          description: "No se recibió el ID del socio para registrar el pago pendiente.",
          variant: "destructive",
        })
        return
      }

      try {
        const socioCompleto = await SociosService.getById(Number(socioId))
        setSocioAdeudo(socioCompleto)
        setModalCobroAdeudoOpen(true)
      } catch (error: any) {
        console.error('Error cargando socio para cobro de adeudo:', error)
        toast({
          title: "Error al abrir cobro",
          description: error.message || "No se pudo cargar la información del socio",
          variant: "destructive",
        })
      }
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.tipo === "registro_acceso") {
        const nuevoRegistro = event.data.datos as RegistroAcceso
        
        // Agregar registro al array de "hoy" (siempre son registros nuevos de hoy)
        setRegistrosHoy((prev) => [nuevoRegistro, ...prev.filter((r) => r.id !== nuevoRegistro.id)])
        
        // Si estamos en el tab de historial, también se agrega ahí
        if (tabActivo === "historial") {
          setRegistrosHistorial((prev) => [nuevoRegistro, ...prev.filter((r) => r.id !== nuevoRegistro.id)])
        }
        
        // Mostrar notificación
        toast({
          title: nuevoRegistro.tipo === "permitido" ? "Acceso Permitido" : "Acceso Denegado",
          description: `${nuevoRegistro.nombreSocio} - ${nuevoRegistro.motivo}`,
          variant: nuevoRegistro.tipo === "permitido" ? "default" : "destructive",
        })

        // Forzar sincronización inmediata de KPIs y lista del día desde backend.
        void cargarAsistenciasHoy()
        void cargarKpis()

        if (puedeCobrarAdeudos && nuevoRegistro.tipo === 'denegado' && nuevoRegistro.accionRecomendada === 'cobrar_adeudo') {
          abrirCobroAdeudo(nuevoRegistro)
        }
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [toast, tabActivo, cargarAsistenciasHoy, cargarKpis, puedeCobrarAdeudos])

  // Save config to localStorage for scanner window
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("config_registro_cliente", JSON.stringify(config))
    }
  }, [config])

  const handleAbrirPantalla = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.focus()
      return
    }

    const ancho = screen.width
    const alto = screen.height
    const ventana = window.open(
      "/asistencia/escaneo",
      "VentanaEscaneo",
      `width=${ancho},height=${alto},left=0,top=0,fullscreen=yes,location=no,menubar=no,toolbar=no,status=no`
    )

    if (ventana) {
      ventanaRef.current = ventana
      setPantallaAbierta(true)

      // Send config once window is loaded
      ventana.addEventListener("load", () => {
        setTimeout(() => {
          ventana.postMessage(
            { tipo: "configuracion", config },
            window.location.origin
          )
        }, 1000)
      })
    }
  }, [config])

  const handleCerrarPantalla = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.close()
      ventanaRef.current = null
      setPantallaAbierta(false)
    }
  }, [])

  const handleLimpiarHistorial = useCallback(() => {
    if (confirm("¿Deseas limpiar el historial de registros?")) {
      if (tabActivo === "hoy") {
        setRegistrosHoy([])
      } else {
        setRegistrosHistorial([])
      }
      toast({
        title: "Historial limpiado",
        description: "Se han eliminado todos los registros de la vista actual",
      })
    }
  }, [toast, tabActivo])

  const handleConfigChange = useCallback(
    (newConfig: ConfigRegistro) => {
      setConfig(newConfig)
      // Sync with client window
      if (ventanaRef.current && !ventanaRef.current.closed) {
        ventanaRef.current.postMessage(
          { tipo: "configuracion", config: newConfig },
          window.location.origin
        )
      }
    },
    []
  )

  const handleRegistroExitoso = useCallback((registroData: any) => {
    console.log('[handleRegistroExitoso] Datos recibidos:', registroData)
    
    // La estructura del backend de registro manual es plana, no anidada
    if (!registroData || !registroData.nombre || !registroData.tipo) {
      console.warn('[handleRegistroExitoso] Estructura de respuesta inesperada:', registroData)
      toast({
        title: "Registro exitoso",
        description: "La asistencia fue registrada correctamente",
      })
      // Recargar los registros del tab actual
      if (tabActivo === "hoy") {
        cargarAsistenciasHoy()
      } else {
        cargarHistorialCompleto(paginaHistorial)
      }
      cargarKpis()
      return
    }

    // Transformar registro de API (estructura plana) a formato local
    const nuevoRegistro: RegistroAcceso = {
      id: String(registroData.id),
      socioId: registroData.clave || String(registroData.socio_id),
      nombreSocio: registroData.nombre,
      tipo: String(registroData.tipo).toUpperCase() === 'DENEGADO' ? 'denegado' : 'permitido',
      motivo: registroData.notas || 'Registro manual',
      confianza: "Manual",
      timestamp: registroData.timestamp,
      estadoMembresia: 'permitido',
    }

    // Agregar a registros de hoy (siempre son registros nuevos del día)
    setRegistrosHoy((prev) => [nuevoRegistro, ...prev])
    
    // Si estamos en historial, también agregar ahí
    if (tabActivo === "historial") {
      setRegistrosHistorial((prev) => [nuevoRegistro, ...prev])
    }

    // Recargar KPIs
    setTimeout(() => cargarKpis(), 500)

    toast({
      title: "✅ Registro exitoso",
      description: `${registroData.tipo === 'IN' ? 'Entrada' : 'Salida'} registrada para ${registroData.nombre}`,
    })
  }, [toast, cargarKpis, cargarAsistenciasHoy, cargarHistorialCompleto, tabActivo, paginaHistorial])

  const handleVerHistorialSocio = useCallback((socioId: string) => {
    setModalHistorialSocio(socioId)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="asistencia" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
        <AsistenciaHeader 
          onRegistroManual={puedeRegistrarManual ? () => setModalRegistroManual(true) : undefined}
          onRegistroHuella={() => router.push('/asistencia/huella')}
        />

        {/* KPIs */}
        <KpiAsistenciaCards 
          data={kpisData} 
          loading={loadingKpis}
          error={errorKpis}
          onRecargar={cargarKpis}
        />

        {/* Main content: Control + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
          {/* Left: Scanner control + config */}
          <div className="lg:col-span-1">
            <PanelEscaneo
              config={config}
              onConfigChange={handleConfigChange}
              pantallaAbierta={pantallaAbierta}
              sistemaListo={sistemaListo}
              onAbrirPantalla={handleAbrirPantalla}
              onCerrarPantalla={handleCerrarPantalla}
            />
          </div>

          {/* Right: History with Tabs */}
          <div className="lg:col-span-2">
            {/* Tabs Navigation */}
            <div 
              className="flex items-center gap-1 bg-card rounded-lg p-1 mb-4" 
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            >
              <button
                onClick={() => setTabActivo("hoy")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  tabActivo === "hoy"
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Asistencias de Hoy ({registrosHoy.length})
              </button>
              {puedeVerHistorial && (
                <>
                  <button
                    onClick={() => setTabActivo("historial")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      tabActivo === "historial"
                        ? "bg-primary text-primary-foreground glow-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Historial Completo ({totalRegistrosHistorial})
                  </button>
                  <button
                    onClick={() => setTabActivo("socio")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      tabActivo === "socio"
                        ? "bg-primary text-primary-foreground glow-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Historial por Socio
                  </button>
                </>
              )}
            </div>
            
            {/* Tab Content */}
            {tabActivo === "hoy" && (
              <HistorialRegistros
                registros={registrosHoy}
                onLimpiar={handleLimpiarHistorial}
                loading={loadingHoy}
                error={errorHoy}
                onRecargar={cargarAsistenciasHoy}
                canExportar={puedeExportar}
                onVerHistorialSocio={puedeVerHistorial ? handleVerHistorialSocio : undefined}
              />
            )}
            
            {tabActivo === "historial" && puedeVerHistorial && (
              <HistorialRegistros
                registros={registrosHistorial}
                onLimpiar={handleLimpiarHistorial}
                loading={loadingHistorial}
                error={errorHistorial}
                onRecargar={() => cargarHistorialCompleto(paginaHistorial)}
                onVerHistorialSocio={handleVerHistorialSocio}
                canExportar={puedeExportar}
                // Props de paginación
                paginaActual={paginaHistorial}
                totalPaginas={totalPaginasHistorial}
                totalRegistros={totalRegistrosHistorial}
                registrosPorPagina={registrosPorPagina}
                onCambiarPagina={cargarHistorialCompleto}
                onCambiarRegistrosPorPagina={handleCambiarRegistrosPorPagina}
                // Props de filtros avanzados
                mostrarFiltrosAvanzados={true}
                filtroMetodo={filtroMetodo}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onCambiarFiltroMetodo={handleCambiarFiltroMetodo}
                onCambiarFechaInicio={handleCambiarFechaInicio}
                onCambiarFechaFin={handleCambiarFechaFin}
                onAplicarFiltros={handleAplicarFiltros}
                onLimpiarFiltros={handleLimpiarFiltros}
              />
            )}
            
            {tabActivo === "socio" && puedeVerHistorial && (
              <HistorialSocioTab 
                onError={(mensaje) => toast({
                  title: "Error",
                  description: mensaje,
                  variant: "destructive"
                })}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      <RegistroManualModal
        open={modalRegistroManual}
        onOpenChange={setModalRegistroManual}
        onRegistroExitoso={handleRegistroExitoso}
      />

      <HistorialSocioModal
        open={modalHistorialSocio !== null}
        onOpenChange={(open) => !open && setModalHistorialSocio(null)}
        socioId={modalHistorialSocio}
        canExportar={puedeExportar}
      />

      {puedeCobrarAdeudos && (
        <CobrarMembresiaModal
          open={modalCobroAdeudoOpen}
          onClose={() => {
            setModalCobroAdeudoOpen(false)
            setSocioAdeudo(null)
          }}
          socio={socioAdeudo}
          onSuccess={() => {
            setModalCobroAdeudoOpen(false)
            setSocioAdeudo(null)
            recargarDatos()
            toast({
              title: "Pago registrado",
              description: "El adeudo fue pagado correctamente. Puedes reintentar el acceso del socio.",
            })
          }}
        />
      )}
    </div>
  )
}