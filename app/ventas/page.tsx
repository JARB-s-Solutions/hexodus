"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { VentasHeader } from "@/components/ventas/ventas-header"
import { KpiCards } from "@/components/ventas/kpi-cards"
import { VentasToolbar } from "@/components/ventas/ventas-toolbar"
import { AnalyticsToolbar } from "@/components/ventas/analytics-toolbar"
import { VentasTable } from "@/components/ventas/ventas-table"
import { VentasAnalytics } from "@/components/ventas/ventas-analytics"
import { CorteCaja } from "@/components/ventas/corte-caja"
import { NuevaVentaModal } from "@/components/ventas/nueva-venta-modal"
import { DetalleVentaModal } from "@/components/ventas/detalle-venta-modal"
import { ImprimirTicketVentaModal } from "@/components/ventas/imprimir-ticket-venta-modal"
import { VentasService } from "@/lib/services/ventas"
import type { 
  Venta, 
  VentasData, 
  DashboardStats, 
  SummaryBar, 
  DetalleVenta, 
  Pagination,
  AnalisisVentasData 
} from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/lib/contexts/auth-context"

type VentasTabKey = "historial" | "analytics" | "caja"

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

export default function VentasPage() {
  const { toast } = useToast()
  const { tienePermiso } = useAuthContext()
  const searchParams = useSearchParams()
  
  // Estados principales
  const [ventas, setVentas] = useState<Venta[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [summaryBar, setSummaryBar] = useState<SummaryBar | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [periodo, setPeriodo] = useState("hoy")
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Modals
  const [modalNuevaVenta, setModalNuevaVenta] = useState(false)
  const [detalleVentaId, setDetalleVentaId] = useState<number | null>(null)
  const [modalImprimirTicket, setModalImprimirTicket] = useState(false)
  const [detalleVentaParaImprimir, setDetalleVentaParaImprimir] = useState<DetalleVenta | null>(null)

  // Active tab — inicializa desde query param ?tab=caja|analytics|historial
  const initialTab = ((): VentasTabKey => {
    const tab = searchParams.get("tab")
    if (tab === "caja" || tab === "analytics" || tab === "historial") return tab
    return "historial"
  })()
  const [activeTab, setActiveTab] = useState<VentasTabKey>(initialTab)

  // Estados para análisis de ventas
  const [analisisData, setAnalisisData] = useState<AnalisisVentasData | null>(null)
  const [analisisLoading, setAnalisisLoading] = useState(false)
  const puedeCrearVenta = tienePermiso("ventas", "crear")
  const puedeVerAnalisis = tienePermiso("ventas", "verAnalisis")
  const puedeExportarVentas = tienePermiso("ventas", "exportar")
  const puedeImprimirTicket = tienePermiso("ventas", "imprimirTicket")
  const puedeVerCaja =
    tienePermiso("ventas", "crearCorte") ||
    tienePermiso("ventas", "verCortesAnteriores")
  const puedeCrearCorte = tienePermiso("ventas", "crearCorte")

  const tabsDisponibles = useMemo<Array<{ key: VentasTabKey; label: string }>>(() => {
    const tabs: Array<{ key: VentasTabKey; label: string }> = [{ key: "historial", label: "Historial" }]
    if (puedeVerAnalisis) tabs.push({ key: "analytics", label: "Análisis" })
    if (puedeVerCaja) tabs.push({ key: "caja", label: "Corte de Caja" })
    return tabs
  }, [puedeVerAnalisis, puedeVerCaja])

  useEffect(() => {
    if (!tabsDisponibles.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabsDisponibles[0]?.key ?? "historial")
    }
  }, [activeTab, tabsDisponibles])

  // Cargar historial de ventas cuando cambien filtros simples.
  // El rango personalizado sigue aplicándose manualmente con el botón.
  useEffect(() => {
    if (periodo === "personalizado") {
      return
    }

    const debounceMs = busqueda.trim() !== "" ? 500 : 0
    const timer = setTimeout(() => {
      cargarVentas(1, pagination.limit)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [periodo, metodoPagoFiltro, busqueda, pagination.limit])

  // Cargar análisis cuando se cambie al tab de analytics o cambien los filtros
  useEffect(() => {
    if (activeTab === "analytics" && puedeVerAnalisis) {
      cargarAnalisis()
    }
  }, [activeTab, periodo, fechaInicio, fechaFin, puedeVerAnalisis])

  async function cargarVentas(
    page?: number,
    limit?: number,
    filtrosOverride?: {
      periodo?: string
      fechaInicio?: string
      fechaFin?: string
      metodoPagoFiltro?: string
      busqueda?: string
    }
  ) {
    try {
      setLoading(true)
      const periodoActual = filtrosOverride?.periodo ?? periodo
      const fechaInicioActual = filtrosOverride?.fechaInicio ?? fechaInicio
      const fechaFinActual = filtrosOverride?.fechaFin ?? fechaFin
      const metodoPagoActual = filtrosOverride?.metodoPagoFiltro ?? metodoPagoFiltro
      const busquedaActual = filtrosOverride?.busqueda ?? busqueda

      const params: any = {
        page: page || pagination.currentPage,
        limit: limit || pagination.limit,
      }

      const periodoMap: Record<string, string> = {
        hoy: "Hoy",
        ayer: "Ayer",
        semana: "Esta Semana",
        mes: "Este Mes",
        trimestre: "Este Trimestre",
        anio: "Este Año",
        todo: "Todo",
        personalizado: "Personalizado",
      }
      
      // Filtro por período
      if (periodoActual === "personalizado") {
        params.periodo = "Personalizado"
        if (fechaInicioActual) params.fecha_inicio = fechaInicioActual
        if (fechaFinActual) params.fecha_fin = fechaFinActual
      } else {
        params.periodo = periodoMap[periodoActual] || periodoActual
      }
      
      // Filtro por método de pago (ahora va al backend)
      if (metodoPagoActual && metodoPagoActual !== "todos") {
        params.metodo_pago = metodoPagoActual
      }
      
      // Filtro por búsqueda (ahora va al backend)
      if (busquedaActual.trim()) {
        params.search = busquedaActual.trim()
      }
      
      console.log('📊 Cargando ventas con parámetros:', params)
      const data = await VentasService.getAll(params)
      setVentas(data.ventas)
      setDashboardStats(data.dashboardStats)
      setSummaryBar(data.summaryBar)
      setPagination(data.pagination)
      console.log('✅ Ventas cargadas:', data.ventas.length)
      console.log('📄 Paginación:', data.pagination)
    } catch (error: any) {
      console.error('❌ Error al cargar ventas:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las ventas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar análisis de ventas desde el API
  async function cargarAnalisis() {
    try {
      setAnalisisLoading(true)
      const params: any = {}
      
      // Mapear períodos en español a formato del backend
      const periodoMap: Record<string, string> = {
        "hoy": "Hoy",
        "ayer": "Ayer",
        "semana": "Esta Semana",
        "mes": "Este Mes",
        "trimestre": "Este Trimestre",
        "anio": "Este Año",
        "todo": "Todo",
        "personalizado": "Personalizado",
      }
      
      // Filtro por período
      if (periodo === "personalizado") {
        params.periodo = "Personalizado"
        if (fechaInicio) params.fecha_inicio = fechaInicio
        if (fechaFin) params.fecha_fin = fechaFin
      } else {
        // Siempre enviar el período, incluso cuando es "todo"
        params.periodo = periodoMap[periodo] || periodo
      }
      
      console.log('📊 Cargando análisis de ventas con parámetros:', params)
      const data = await VentasService.getAnalysis(params)
      console.log('✅ Análisis cargado:', {
        tendenciaVentas: data.tendenciaVentas.length,
        primeraFecha: data.tendenciaVentas[0]?.fecha,
        ultimaFecha: data.tendenciaVentas[data.tendenciaVentas.length - 1]?.fecha,
      })
      setAnalisisData(data)
    } catch (error: any) {
      console.error('❌ Error al cargar análisis:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el análisis de ventas",
        variant: "destructive",
      })
      // Establecer datos vacíos para evitar crashes
      setAnalisisData({
        comparacionActual: {
          actual: { total: 0, transacciones: 0 },
          anterior: { total: 0, transacciones: 0 },
          variacion_porcentaje: 0,
        },
        tendenciaVentas: [],
        topProductos: [],
        metodosPago: [],
        insights: ["No hay datos disponibles para el período seleccionado."],
      })
    } finally {
      setAnalisisLoading(false)
    }
  }

  // Handlers de paginación
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 Cambiando a página:', newPage)
    cargarVentas(newPage, pagination.limit)
  }, [pagination.limit, periodo, fechaInicio, fechaFin, metodoPagoFiltro, busqueda])

  const handleLimitChange = useCallback((newLimit: number) => {
    console.log('📊 Cambiando límite a:', newLimit)
    cargarVentas(1, newLimit) // Resetear a página 1 al cambiar límite
  }, [periodo, fechaInicio, fechaFin, metodoPagoFiltro, busqueda])

  // Ahora los datos vienen filtrados desde el backend, no necesitamos filtrado local
  const ventasFiltradas = ventas

  // KPI data desde el API
  const kpiData = useMemo(() => {
    if (!dashboardStats) {
      return {
        ventasHoy: 0,
        ventasAyer: 0,
        transaccionesHoy: 0,
        promedioTransaccion: 0,
        productosVendidosHoy: 0,
        productosVendidosAyer: 0,
        ventasMes: 0,
        metaMes: 0,
      }
    }

    return {
      ventasHoy: dashboardStats.ventasDia.total,
      ventasAyer: 0, // Calculado desde porcentajeVsAyer si es necesario
      transaccionesHoy: dashboardStats.transacciones.total,
      promedioTransaccion: dashboardStats.transacciones.promedioTicket,
      productosVendidosHoy: dashboardStats.productosVendidos.total,
      productosVendidosAyer: 0, // Calculado desde porcentajeVsAyer si es necesario
      ventasMes: dashboardStats.ventasMes.total,
      metaMes: dashboardStats.ventasMes.metaAlcanzada,
    }
  }, [dashboardStats])

  // Handlers
  const handleNuevaVenta = useCallback(
    async (data: { socio_id: number | null; metodo_pago_id: number; productos: { producto_id: number; cantidad: number }[] }) => {
      try {
        console.log('📤 Creando venta:', data)
        const resultado = await VentasService.create(data)
        
        console.log('✅ Venta creada:', resultado)
        
        toast({
          title: "¡Venta registrada!",
          description: `Venta ID: ${resultado.venta_id} - Total: ${formatCurrency(parseFloat(resultado.total_cobrado))}`,
        })
        
        setModalNuevaVenta(false)
        
        // Recargar ventas después de crear
        await cargarVentas()
        
        // Obtener detalle de la venta para imprimir
        try {
          console.log('📄 Obteniendo detalle de venta para imprimir...')
          const detalleVenta = await VentasService.getById(resultado.venta_id)
          if (puedeImprimirTicket) {
            setDetalleVentaParaImprimir(detalleVenta)
            setModalImprimirTicket(true)
          }
        } catch (errorDetalle: any) {
          console.error('❌ Error al obtener detalle para impresión:', errorDetalle)
          // No bloqueamos el flujo, solo notificamos
        }
      } catch (error: any) {
        console.error('❌ Error al crear venta:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo registrar la venta",
          variant: "destructive",
        })
      }
    },
    [toast, puedeImprimirTicket]
  )

  const handleLimpiarFiltros = useCallback(() => {
    console.log('🧹 Limpiando filtros...')
    setBusqueda("")
    setPeriodo("hoy")
    setMetodoPagoFiltro("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    if (!puedeExportarVentas) {
      return
    }

    if (ventas.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay ventas para exportar con los filtros actuales",
      })
      return
    }

    try {
      const headers = [
        "ID Venta",
        "Cliente",
        "Productos",
        "Total",
        "Fecha y Hora",
        "Metodo de Pago",
        "Estado",
      ]

      const rows = ventas.map((venta) => [
        venta.idVenta,
        venta.cliente,
        venta.productosResumen,
        formatCurrency(venta.total),
        formatDateTime(venta.fechaHora),
        venta.metodoPago,
        venta.status,
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const fecha = new Date().toISOString().split("T")[0]
      link.href = url
      link.download = `ventas_${fecha}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportacion completada",
        description: `Se exportaron ${ventas.length} ventas`,
      })
    } catch (error) {
      console.error("Error al exportar ventas:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      })
    }
  }, [ventas, toast, puedeExportarVentas])

  const handleAplicarFiltros = useCallback(() => {
    if (periodo === "personalizado" && fechaInicio && fechaFin) {
      console.log('🔍 Aplicando filtros personalizados:', { periodo, fechaInicio, fechaFin })
      cargarVentas(1, pagination.limit)
      toast({
        title: "Filtros aplicados",
        description: `Buscando ventas en el rango seleccionado`,
      })
    }
  }, [periodo, fechaInicio, fechaFin, pagination.limit])

  const handlePrintInvoice = useCallback((detalleVenta: DetalleVenta) => {
    console.log('📄 Imprimiendo invoice para venta:', detalleVenta.idVentaStr)
    setDetalleVentaParaImprimir(detalleVenta)
    setModalImprimirTicket(true)
    setDetalleVentaId(null) // Cerrar modal de detalle
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar activePage="ventas" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando ventas...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage="ventas" />

      <main className="flex-1 flex flex-col min-h-0">
        <VentasHeader />

        <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6 space-y-3">
          {/* KPIs */}
          <KpiCards data={kpiData} />

          {/* Summary Bar */}
          {summaryBar && (
            <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    Período: <span className="text-foreground font-semibold">{summaryBar.rango}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Total: <span className="text-primary font-bold">{formatCurrency(summaryBar.totalFiltrado)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Ventas: <span className="text-foreground font-medium">{summaryBar.ventasCount}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-card rounded-lg p-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              {tabsDisponibles.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {activeTab === "historial" && (
              <>
                {/* Toolbar with Filters */}
                <VentasToolbar
                  busqueda={busqueda}
                  onBusquedaChange={setBusqueda}
                  periodo={periodo}
                  onPeriodoChange={setPeriodo}
                  metodoPago={metodoPagoFiltro}
                  onMetodoPagoChange={setMetodoPagoFiltro}
                  fechaInicio={fechaInicio}
                  onFechaInicioChange={setFechaInicio}
                  fechaFin={fechaFin}
                  onFechaFinChange={setFechaFin}
                  onLimpiar={handleLimpiarFiltros}
                  onNuevaVenta={() => setModalNuevaVenta(true)}
                  onAplicarFiltros={handleAplicarFiltros}
                  onExportar={handleExportar}
                  totalVentas={pagination.totalRecords}
                  canCrearVenta={puedeCrearVenta}
                  canExportar={puedeExportarVentas}
                />

                {/* Table */}
                <VentasTable
                  ventas={ventasFiltradas}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  onVerDetalle={(venta) => setDetalleVentaId(venta.id)}
                  onExportar={handleExportar}
                />
              </>
            )}

            {activeTab === "analytics" && puedeVerAnalisis && (
              <>
                {/* Toolbar de filtros para análisis */}
                <AnalyticsToolbar
                  periodo={periodo}
                  onPeriodoChange={setPeriodo}
                  fechaInicio={fechaInicio}
                  onFechaInicioChange={setFechaInicio}
                  fechaFin={fechaFin}
                  onFechaFinChange={setFechaFin}
                  onActualizar={cargarAnalisis}
                  loading={analisisLoading}
                />

                {analisisData ? (
                  <VentasAnalytics
                    analisisData={analisisData}
                    periodoLabel={periodo === "personalizado" ? "Personalizado" : periodo}
                    loading={analisisLoading}
                  />
                ) : analisisLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando análisis...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">No hay datos de análisis disponibles</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "caja" && puedeVerCaja && (
              <CorteCaja
                ventasHoy={ventas}
                allVentas={ventas}
                fondoInicial={5000}
                canCrearCorte={puedeCrearCorte}
                canExportar={puedeExportarVentas}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <NuevaVentaModal
        open={modalNuevaVenta && puedeCrearVenta}
        onClose={() => setModalNuevaVenta(false)}
        onConfirm={handleNuevaVenta}
      />

      <DetalleVentaModal
        ventaId={detalleVentaId}
        open={!!detalleVentaId}
        onClose={() => setDetalleVentaId(null)}
        onPrintInvoice={puedeImprimirTicket ? handlePrintInvoice : undefined}
      />

      {puedeImprimirTicket && (
        <ImprimirTicketVentaModal
          open={modalImprimirTicket}
          onClose={() => {
            setModalImprimirTicket(false)
            setDetalleVentaParaImprimir(null)
          }}
          detalleVenta={detalleVentaParaImprimir}
        />
      )}
    </div>
  )
}
