"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { VentasHeader } from "@/components/ventas/ventas-header"
import { KpiCards } from "@/components/ventas/kpi-cards"
import { VentasFilters } from "@/components/ventas/ventas-filters"
import { VentasTable } from "@/components/ventas/ventas-table"
import { VentasAnalytics } from "@/components/ventas/ventas-analytics"
import { CorteCaja } from "@/components/ventas/corte-caja"
import { NuevaVentaModal } from "@/components/ventas/nueva-venta-modal"
import { DetalleVentaModal } from "@/components/ventas/detalle-venta-modal"
import { ImprimirTicketVentaModal } from "@/components/ventas/imprimir-ticket-venta-modal"
import { VentasService } from "@/lib/services/ventas"
import type { Venta, VentasData, DashboardStats, SummaryBar, DetalleVenta } from "@/lib/types/ventas"
import { formatCurrency, formatDateTime } from "@/lib/types/ventas"
import { useToast } from "@/hooks/use-toast"

export default function VentasPage() {
  const { toast } = useToast()
  
  // Estados principales
  const [ventas, setVentas] = useState<Venta[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [summaryBar, setSummaryBar] = useState<SummaryBar | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [periodo, setPeriodo] = useState("todo")
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Modals
  const [modalNuevaVenta, setModalNuevaVenta] = useState(false)
  const [detalleVentaId, setDetalleVentaId] = useState<number | null>(null)
  const [modalImprimirTicket, setModalImprimirTicket] = useState(false)
  const [detalleVentaParaImprimir, setDetalleVentaParaImprimir] = useState<DetalleVenta | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState<"historial" | "analytics" | "caja">("historial")

  // Cargar ventas desde el API
  useEffect(() => {
    cargarVentas()
  }, [])

  async function cargarVentas() {
    try {
      setLoading(true)
      const data = await VentasService.getAll()
      setVentas(data.ventas)
      setDashboardStats(data.dashboardStats)
      setSummaryBar(data.summaryBar)
      console.log('✅ Ventas cargadas:', data.ventas.length)
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

  // Filtered data
  const ventasFiltradas = useMemo(() => {
    let filtered = [...ventas]

    // Payment method filter
    if (metodoPagoFiltro !== "todos") {
      filtered = filtered.filter((v) => v.metodoPago === metodoPagoFiltro)
    }

    // Search filter
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.idVenta.toLowerCase().includes(q) ||
          v.cliente.toLowerCase().includes(q) ||
          v.productosResumen.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [ventas, metodoPagoFiltro, busqueda])

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
          setDetalleVentaParaImprimir(detalleVenta)
          setModalImprimirTicket(true)
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
    [toast]
  )

  const handleLimpiarFiltros = useCallback(() => {
    setBusqueda("")
    setPeriodo("todo")
    setMetodoPagoFiltro("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    // TODO: Implementar exportación con nuevos tipos
    console.log('Exportar ventas:', ventasFiltradas)
  }, [ventasFiltradas])

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
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
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-0">
        <VentasHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          <KpiCards data={kpiData} />

          {/* Summary Bar */}
          {summaryBar && (
            <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
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
          <div className="flex items-center gap-1 bg-card rounded-lg p-1 w-fit" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            {(
              [
                { key: "historial", label: "Historial" },
                { key: "analytics", label: "Analisis" },
                { key: "caja", label: "Corte de Caja" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left column: filters */}
            <div className="lg:col-span-1">
              <VentasFilters
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
              />
            </div>

            {/* Right column: main content */}
            <div className="lg:col-span-3">
              {activeTab === "historial" && (
                <VentasTable
                  ventas={ventasFiltradas}
                  onVerDetalle={(venta) => setDetalleVentaId(venta.id)}
                  onExportar={handleExportar}
                />
              )}

              {activeTab === "analytics" && (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-muted-foreground text-center">Analytics - Próximamente</p>
                </div>
              )}

              {activeTab === "caja" && (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-muted-foreground text-center">Corte de Caja - Próximamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <NuevaVentaModal
        open={modalNuevaVenta}
        onClose={() => setModalNuevaVenta(false)}
        onConfirm={handleNuevaVenta}
      />

      <DetalleVentaModal
        ventaId={detalleVentaId}
        open={!!detalleVentaId}
        onClose={() => setDetalleVentaId(null)}
      />

      <ImprimirTicketVentaModal
        open={modalImprimirTicket}
        onClose={() => {
          setModalImprimirTicket(false)
          setDetalleVentaParaImprimir(null)
        }}
        detalleVenta={detalleVentaParaImprimir}
      />
    </div>
  )
}
