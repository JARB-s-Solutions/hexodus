"use client"

import { useState, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ReportesHeader } from "@/components/reportes/reportes-header"
import { KpiReportes } from "@/components/reportes/kpi-reportes"
import { ReportesFilters } from "@/components/reportes/reportes-filters"
import { Comparaciones } from "@/components/reportes/comparaciones"
import { GraficasReportes } from "@/components/reportes/graficas-reportes"
import { InsightsReportes } from "@/components/reportes/insights-reportes"
import { DesgloseIngresos } from "@/components/reportes/desglose-ingresos"
import { HistorialReportes, type ReporteHistorial } from "@/components/reportes/historial-reportes"
import { GenerarReporteModal, type ReporteConfig } from "@/components/reportes/generar-reporte-modal"
import { formatCurrency, type TipoReporte } from "@/lib/reportes-data"
import { ReportesService } from "@/lib/services/reportes"

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mes")
  const [tipoReporte, setTipoReporte] = useState<TipoReporte | "todos">("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [activeTab, setActiveTab] = useState<"resumen" | "graficas" | "comparaciones" | "historial">("resumen")
  const [modalGenerar, setModalGenerar] = useState(false)
  const [reportesHistorial, setReportesHistorial] = useState<ReporteHistorial[]>([])

  // Estados para datos del backend - Gráficas
  const [graficasData, setGraficasData] = useState<any>(null)
  const [loadingGraficas, setLoadingGraficas] = useState(false)
  const [errorGraficas, setErrorGraficas] = useState<string | null>(null)

  // Estados para datos del backend - Resumen (KPIs)
  const [resumenData, setResumenData] = useState<any>(null)
  const [loadingResumen, setLoadingResumen] = useState(false)
  const [errorResumen, setErrorResumen] = useState<string | null>(null)

  // Estados para datos del backend - Comparaciones
  const [comparacionesData, setComparacionesData] = useState<any>(null)
  const [loadingComparaciones, setLoadingComparaciones] = useState(false)
  const [errorComparaciones, setErrorComparaciones] = useState<string | null>(null)
  const [tabComparacion, setTabComparacion] = useState("mes") // mes, trimestre, semestre, anual

  // ------ Debug: Verificar token al montar componente ------
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) {
      console.error('🔒 NO HAY TOKEN DE AUTENTICACIÓN GUARDADO')
      console.info('💡 Por favor inicia sesión para ver los datos financieros')
    } else {
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...')
    }
  }, [])

  // ------ Effect para cargar gráficas desde backend ------
  useEffect(() => {
    const cargarGraficas = async () => {
      setLoadingGraficas(true)
      setErrorGraficas(null)

      try {
        console.log('📊 Cargando gráficas con filtros:', {
          periodo,
          tipoReporte,
          fechaInicio,
          fechaFin,
        })

        const response = await ReportesService.getGraficas({
          periodo,
          tipoReporte: tipoReporte === 'todos' ? undefined : tipoReporte,
          fechaInicio: periodo === 'personalizado' ? fechaInicio : undefined,
          fechaFin: periodo === 'personalizado' ? fechaFin : undefined,
        })

        // Si no hay token, mostrar como error para que el usuario sepa
        if (response.message === 'Sin token de autenticación') {
          console.warn('⚠️  Sin token: se requiere autenticación')
          setErrorGraficas('Por favor inicia sesión para ver las gráficas financieras')
          setGraficasData(null)
        } else {
          const transformed = ReportesService.transformGraficasData(response)
          setGraficasData(transformed)
          console.log('✅ Gráficas cargadas y transformadas exitosamente')
        }
      } catch (error: any) {
        console.error('❌ Error cargando gráficas:', error)
        setErrorGraficas(error.message || 'Error al cargar las gráficas')
      } finally {
        setLoadingGraficas(false)
      }
    }

    cargarGraficas()
  }, [periodo, tipoReporte, fechaInicio, fechaFin])

  // ------ Effect para cargar resumen (KPIs) desde backend ------
  useEffect(() => {
    const cargarResumen = async () => {
      setLoadingResumen(true)
      setErrorResumen(null)

      try {
        console.log('📊 Cargando resumen con filtros:', {
          periodo,
          tipoReporte,
          fechaInicio,
          fechaFin,
        })

        const response = await ReportesService.getResumen({
          periodo,
          tipoReporte: tipoReporte === 'todos' ? undefined : tipoReporte,
          fechaInicio: periodo === 'personalizado' ? fechaInicio : undefined,
          fechaFin: periodo === 'personalizado' ? fechaFin : undefined,
        })

        // Si no hay token, mostrar como error
        if (response.message === 'Sin token de autenticación') {
          console.warn('⚠️  Sin token: se requiere autenticación')
          setErrorResumen('Por favor inicia sesión para ver los KPIs financieros')
          setResumenData(null)
        } else {
          console.log('🔍 Analizando estructura de respuesta:', response)
          
          // Verificar si tiene la estructura kpis_superiores (nueva)
          if (response.data.kpis_superiores) {
            console.log('✅ Estructura kpis_superiores detectada')
            
            // Transformar datos del backend al formato esperado por el componente
            const kpis = response.data.kpis_superiores
            const desglose = response.data.desglose_ingresos
            
            // Calcular valores anteriores a partir del porcentaje de cambio
            const calcularAnterior = (actual: number, porcentaje: number): number => {
              if (porcentaje === 0) return actual
              return actual / (1 + porcentaje / 100)
            }
            
            setResumenData({
              ventas_actual: desglose.grafica.ventas.total,
              ventas_anterior: calcularAnterior(
                desglose.grafica.ventas.total, 
                desglose.grafica.ventas.porcentaje_vs_anterior
              ),
              gastos_actual: kpis.gastos.total,
              gastos_anterior: calcularAnterior(kpis.gastos.total, kpis.gastos.porcentaje),
              utilidad_actual: kpis.utilidad_neta.total,
              utilidad_anterior: calcularAnterior(kpis.utilidad_neta.total, kpis.utilidad_neta.porcentaje),
              membresias_actual: kpis.membresias.total,
              membresias_anterior: calcularAnterior(kpis.membresias.total, kpis.membresias.porcentaje),
              socios_activos: kpis.membresias.socios_activos,
            })
          } else {
            // Formato legacy o diferente
            console.log('ℹ️  Usando estructura directa de response.data')
            setResumenData(response.data)
          }
          
          console.log('✅ KPIs transformados y cargados exitosamente')
        }
      } catch (error: any) {
        console.error('❌ Error cargando resumen:', error)
        setErrorResumen(error.message || 'Error al cargar el resumen')
      } finally {
        setLoadingResumen(false)
      }
    }

    cargarResumen()
  }, [periodo, tipoReporte, fechaInicio, fechaFin])

  // ------ Effect para cargar comparaciones desde backend ------
  useEffect(() => {
    const cargarComparaciones = async () => {
      setLoadingComparaciones(true)
      setErrorComparaciones(null)

      try {
        console.log('📊 Cargando comparaciones con filtros:', {
          periodo,
          tabComparacion,
        })

        const response = await ReportesService.getComparaciones({
          periodo,
          tabSeleccionada: tabComparacion,
        })

        // Si no hay token, mostrar como error
        if (response.message === 'Sin token de autenticación') {
          console.warn('⚠️  Sin token: se requiere autenticación')
          setErrorComparaciones('Por favor inicia sesión para ver las comparaciones financieras')
          setComparacionesData(null)
        } else {
          setComparacionesData(response.data.comparaciones)
          console.log('✅ Comparaciones cargadas exitosamente')
        }
      } catch (error: any) {
        console.error('❌ Error cargando comparaciones:', error)
        setErrorComparaciones(error.message || 'Error al cargar las comparaciones')
      } finally {
        setLoadingComparaciones(false)
      }
    }

    cargarComparaciones()
  }, [periodo, tabComparacion])

  // ------ Handlers ------
  const handleLimpiar = useCallback(() => {
    setPeriodo("mes")
    setTipoReporte("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    // TODO: Implementar exportación con datos del backend
    console.log('🔄 Exportar reporte')
    alert('Funcionalidad de exportación pendiente de implementar con datos del backend')
  }, [])

  const handleGenerarReporte = useCallback((config: ReporteConfig) => {
    //TODO: Implementar generación de reporte con backend
    console.log('🔄 Generar reporte:', config)
    
    const newReporte: ReporteHistorial = {
      id: `RPT-${String(reportesHistorial.length + 1).padStart(4, "0")}`,
      nombre: config.nombre,
      tipo: config.tipo === "completo" ? "completo" : config.tipo,
      periodo: `${config.fechaInicio} a ${config.fechaFin}`,
      fechaGenerado: new Date().toLocaleString("es-MX"),
      estado: "generado",
      formato: "Excel",
      resumen: {
        ventas: 0,
        gastos: 0,
        utilidad: 0,
      },
    }

    setReportesHistorial((prev) => [newReporte, ...prev])
    setModalGenerar(false)
  }, [reportesHistorial.length])

  const handleDescargarReporte = useCallback((reporte: ReporteHistorial) => {
    setReportesHistorial((prev) =>
      prev.map((r) => (r.id === reporte.id ? { ...r, estado: "descargado" as const } : r))
    )
    console.log('🔄 Descargar reporte:', reporte.id)
  }, [])

  const handleEliminarReporte = useCallback((id: string) => {
    setReportesHistorial((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="reportes" />

      <main className="flex-1 flex flex-col min-h-0">
        <ReportesHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          {loadingResumen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-5 animate-pulse"
                  style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
                >
                  <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : errorResumen ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-sm text-destructive font-medium">Error al cargar KPIs</p>
              <p className="text-xs text-muted-foreground mt-1">{errorResumen}</p>
            </div>
          ) : (
            <KpiReportes
              ventas={resumenData?.ventas_actual ?? 0}
              ventasAnterior={resumenData?.ventas_anterior ?? 0}
              gastos={resumenData?.gastos_actual ?? 0}
              gastosAnterior={resumenData?.gastos_anterior ?? 0}
              utilidad={resumenData?.utilidad_actual ?? 0}
              utilidadAnterior={resumenData?.utilidad_anterior ?? 0}
              membresias={resumenData?.membresias_actual ?? 0}
              membresiasAnterior={resumenData?.membresias_anterior ?? 0}
              socios={resumenData?.socios_activos ?? 0}
              labelAnterior="Período anterior"
            />
          )}

          {/* Tabs */}
          <div
            className="flex items-center gap-1 bg-card rounded-lg p-1 w-fit overflow-x-auto"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          >
            {(
              [
                { key: "resumen", label: "Resumen General" },
                { key: "graficas", label: "Graficas" },
                { key: "comparaciones", label: "Comparaciones" },
                { key: "historial", label: "Historial" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content layout: 1/4 filters + 3/4 main */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left - Filters */}
            <div className="lg:col-span-1">
              <ReportesFilters
                periodo={periodo}
                onPeriodoChange={setPeriodo}
                tipoReporte={tipoReporte}
                onTipoReporteChange={setTipoReporte}
                fechaInicio={fechaInicio}
                onFechaInicioChange={setFechaInicio}
                fechaFin={fechaFin}
                onFechaFinChange={setFechaFin}
                onLimpiar={handleLimpiar}
                onExportar={handleExportar}
                onNuevoReporte={() => setModalGenerar(true)}
              />
            </div>

            {/* Right - Main content */}
            <div className="lg:col-span-3">
              {/* ====== RESUMEN GENERAL TAB ====== */}
              {activeTab === "resumen" && (
                <div className="space-y-5">
                  <div className="bg-card rounded-xl p-8 text-center" style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Tab de Resumen</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta sección está en proceso de migración a datos del backend.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Por favor, utiliza los tabs de "Gráficas" y "Comparaciones" que ya están integrados con el backend.
                    </p>
                  </div>
                  
                  {/* TODO: Implementar resumen con endpoints del backend
                  - Desglose de ingresos
                  - Cards de resumen
                  - Insights
                  - Top categorías y planes
                  */}
                </div>
              )}

              {/* ====== GRAFICAS TAB ====== */}
              {activeTab === "graficas" && (
                <div>
                  {loadingGraficas ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Cargando gráficas...</p>
                      </div>
                    </div>
                  ) : errorGraficas ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                      <p className="text-sm text-destructive font-medium mb-2">Error al cargar gráficas</p>
                      <p className="text-xs text-muted-foreground">{errorGraficas}</p>
                    </div>
                  ) : graficasData ? (
                    <GraficasReportes
                      ventasPorMes={graficasData.ventasPorMes}
                      gastosPorMes={graficasData.gastosPorMes}
                      membresiasPorMes={graficasData.membresiasPorMes}
                      gastosPorCategoria={graficasData.gastosPorCategoria}
                      membresiasPorPlan={graficasData.membresiasPorPlan}
                      tipoReporte={tipoReporte}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                    </div>
                  )}
                </div>
              )}

              {/* ====== COMPARACIONES TAB ====== */}
              {activeTab === "comparaciones" && (
                <div className="space-y-5">
                  {loadingComparaciones ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Cargando comparaciones...</p>
                      </div>
                    </div>
                  ) : errorComparaciones ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                      <p className="text-sm text-destructive font-medium mb-2">Error al cargar comparaciones</p>
                      <p className="text-xs text-muted-foreground">{errorComparaciones}</p>
                    </div>
                  ) : comparacionesData && comparacionesData.length > 0 ? (
                    <>
                      <Comparaciones
                        items={comparacionesData}
                        labelActual="Período actual"
                        labelAnterior="Período anterior"
                      />
                      {/* TODO: Agregar InsightsReportes con datos reales cuando endpoint esté disponible */}
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-sm text-muted-foreground">No hay datos de comparaciones disponibles</p>
                    </div>
                  )}
                </div>
              )}

              {/* ====== HISTORIAL TAB ====== */}
              {activeTab === "historial" && (
                <HistorialReportes
                  reportes={reportesHistorial}
                  onDescargar={handleDescargarReporte}
                  onEliminar={handleEliminarReporte}
                />
              )}
            </div>
          </div>

          {/* Summary footer - TODO: Actualizar con datos reales del backend */}
          {/* <div
            className="bg-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-6 text-xs flex-wrap">
              <span className="text-muted-foreground">
                Periodo: <span className="text-foreground font-medium">{periodo}</span>
              </span>
            </div>
          </div> */}
        </div>
      </main>

      {/* Generate Report Modal */}
      <GenerarReporteModal
        open={modalGenerar}
        onClose={() => setModalGenerar(false)}
        onGenerar={handleGenerarReporte}
      />
    </div>
  )
}
