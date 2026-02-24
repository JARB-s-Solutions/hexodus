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
import {
  generateVentas,
  getVentasPorPeriodo,
  getTotalVentas,
  formatCurrency,
  type Venta,
  type MetodoPago,
  type ProductoVenta,
} from "@/lib/ventas-data"
import { exportVentasToCSV } from "@/lib/export-excel"

// Use a fixed reference date for demo data generation so the seeded PRNG
// produces identical results on both server and client (avoids hydration mismatch).
// Date.UTC ensures the same absolute timestamp regardless of host timezone.
const FIXED_REFERENCE = new Date(Date.UTC(2026, 1, 21, 12, 0, 0)) // Feb 21, 2026 noon UTC
const allVentas = generateVentas(200, FIXED_REFERENCE)

// Use the fixed reference for all date calculations so that server and client
// always agree on "today", preventing hydration mismatches.
const FIXED_TODAY = "2026-02-21"
const FIXED_YESTERDAY = "2026-02-20"

// Format date using UTC methods to match the UTC-based data generation
function formatLocalDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getToday(): string {
  return FIXED_TODAY
}

function getYesterday(): string {
  return FIXED_YESTERDAY
}

function getDateRange(periodo: string): { inicio: string; fin: string; anteriorInicio: string; anteriorFin: string; label: string } {
  const now = FIXED_REFERENCE
  const today = FIXED_TODAY

  switch (periodo) {
    case "hoy": {
      const yesterday = getYesterday()
      return {
        inicio: today,
        fin: today,
        anteriorInicio: yesterday,
        anteriorFin: yesterday,
        label: "Diaria",
      }
    }
    case "ayer": {
      const yesterday = getYesterday()
      const dayBefore = new Date(now)
      dayBefore.setUTCDate(dayBefore.getUTCDate() - 2)
      return {
        inicio: yesterday,
        fin: yesterday,
        anteriorInicio: formatLocalDate(dayBefore),
        anteriorFin: formatLocalDate(dayBefore),
        label: "Diaria",
      }
    }
    case "semana": {
      const startOfWeek = new Date(now)
      startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay())
      const prevWeekEnd = new Date(startOfWeek)
      prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1)
      const prevWeekStart = new Date(prevWeekEnd)
      prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 6)
      return {
        inicio: formatLocalDate(startOfWeek),
        fin: today,
        anteriorInicio: formatLocalDate(prevWeekStart),
        anteriorFin: formatLocalDate(prevWeekEnd),
        label: "Semanal",
      }
    }
    case "mes": {
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const prevMonthEnd = new Date(startOfMonth)
      prevMonthEnd.setUTCDate(prevMonthEnd.getUTCDate() - 1)
      const prevMonthStart = new Date(Date.UTC(prevMonthEnd.getUTCFullYear(), prevMonthEnd.getUTCMonth(), 1))
      return {
        inicio: formatLocalDate(startOfMonth),
        fin: today,
        anteriorInicio: formatLocalDate(prevMonthStart),
        anteriorFin: formatLocalDate(prevMonthEnd),
        label: "Mensual",
      }
    }
    case "trimestre": {
      const currentQuarter = Math.floor(now.getUTCMonth() / 3)
      const startOfQuarter = new Date(Date.UTC(now.getUTCFullYear(), currentQuarter * 3, 1))
      const prevQuarterEnd = new Date(startOfQuarter)
      prevQuarterEnd.setUTCDate(prevQuarterEnd.getUTCDate() - 1)
      const prevQuarterStart = new Date(Date.UTC(prevQuarterEnd.getUTCFullYear(), Math.floor(prevQuarterEnd.getUTCMonth() / 3) * 3, 1))
      return {
        inicio: formatLocalDate(startOfQuarter),
        fin: today,
        anteriorInicio: formatLocalDate(prevQuarterStart),
        anteriorFin: formatLocalDate(prevQuarterEnd),
        label: "Trimestral",
      }
    }
    case "semestre": {
      const currentSemester = now.getUTCMonth() < 6 ? 0 : 1
      const startOfSemester = new Date(Date.UTC(now.getUTCFullYear(), currentSemester * 6, 1))
      const prevSemEnd = new Date(startOfSemester)
      prevSemEnd.setUTCDate(prevSemEnd.getUTCDate() - 1)
      const prevSemStart = new Date(Date.UTC(prevSemEnd.getUTCFullYear(), prevSemEnd.getUTCMonth() < 6 ? 0 : 6, 1))
      return {
        inicio: formatLocalDate(startOfSemester),
        fin: today,
        anteriorInicio: formatLocalDate(prevSemStart),
        anteriorFin: formatLocalDate(prevSemEnd),
        label: "Semestral",
      }
    }
    case "anual": {
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
      const prevYearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1))
      const prevYearEnd = new Date(Date.UTC(now.getUTCFullYear() - 1, 11, 31))
      return {
        inicio: formatLocalDate(startOfYear),
        fin: today,
        anteriorInicio: formatLocalDate(prevYearStart),
        anteriorFin: formatLocalDate(prevYearEnd),
        label: "Anual",
      }
    }
    default:
      return {
        inicio: formatLocalDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        fin: today,
        anteriorInicio: formatLocalDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))),
        anteriorFin: formatLocalDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))),
        label: "Mensual",
      }
  }
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>(allVentas)

  // Filters
  const [busqueda, setBusqueda] = useState("")
  const [periodo, setPeriodo] = useState("mes")
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Modals
  const [modalNuevaVenta, setModalNuevaVenta] = useState(false)
  const [detalleVenta, setDetalleVenta] = useState<Venta | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState<"historial" | "analytics" | "caja">("historial")

  // Filtered data
  const dateRange = useMemo(() => {
    if (periodo === "personalizado" && fechaInicio && fechaFin) {
      const daysDiff = Math.floor(
        (new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
      )
      const anteriorFin = new Date(fechaInicio + "T12:00:00Z")
      anteriorFin.setUTCDate(anteriorFin.getUTCDate() - 1)
      const anteriorInicio = new Date(anteriorFin)
      anteriorInicio.setUTCDate(anteriorInicio.getUTCDate() - daysDiff)
      return {
        inicio: fechaInicio,
        fin: fechaFin,
anteriorInicio: formatLocalDate(anteriorInicio),
  anteriorFin: formatLocalDate(anteriorFin),
        label: "Personalizado",
      }
    }
    return getDateRange(periodo)
  }, [periodo, fechaInicio, fechaFin])

  const ventasFiltradas = useMemo(() => {
    let filtered = [...ventas]

    // Date filter
    filtered = filtered.filter((v) => v.fecha >= dateRange.inicio && v.fecha <= dateRange.fin)

    // Payment method filter
    if (metodoPagoFiltro !== "todos") {
      filtered = filtered.filter((v) => v.metodoPago === metodoPagoFiltro)
    }

    // Search filter
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          v.cliente.toLowerCase().includes(q) ||
          v.productos.some((p) => p.nombre.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [ventas, dateRange, metodoPagoFiltro, busqueda])

  const ventasPeriodoAnterior = useMemo(() => {
    return getVentasPorPeriodo(ventas, dateRange.anteriorInicio, dateRange.anteriorFin)
  }, [ventas, dateRange])

  // KPI data
  const today = getToday()
  const yesterday = getYesterday()

  const ventasHoy = useMemo(() => ventas.filter((v) => v.fecha === today), [ventas, today])
  const ventasAyer = useMemo(() => ventas.filter((v) => v.fecha === yesterday), [ventas, yesterday])

  const kpiData = useMemo(() => {
    const totalHoy = getTotalVentas(ventasHoy)
    const totalAyer = getTotalVentas(ventasAyer)
    const productosHoy = ventasHoy.reduce((sum, v) => sum + v.productos.reduce((s, p) => s + p.cantidad, 0), 0)
    const productosAyer = ventasAyer.reduce((sum, v) => sum + v.productos.reduce((s, p) => s + p.cantidad, 0), 0)
    const startOfMonth = formatLocalDate(new Date(Date.UTC(FIXED_REFERENCE.getUTCFullYear(), FIXED_REFERENCE.getUTCMonth(), 1)))
    const ventasMes = getVentasPorPeriodo(ventas, startOfMonth, today)
    const totalMes = getTotalVentas(ventasMes)

    return {
      ventasHoy: totalHoy,
      ventasAyer: totalAyer,
      transaccionesHoy: ventasHoy.length,
      promedioTransaccion: ventasHoy.length > 0 ? totalHoy / ventasHoy.length : 0,
      productosVendidosHoy: productosHoy,
      productosVendidosAyer: productosAyer,
      ventasMes: totalMes,
      metaMes: 300000,
    }
  }, [ventas, ventasHoy, ventasAyer, today])

  // Handlers
  const handleNuevaVenta = useCallback(
    (data: { cliente: string; metodoPago: MetodoPago; productos: ProductoVenta[] }) => {
      const newVenta: Venta = {
        id: `V-${String(ventas.length + 1).padStart(4, "0")}`,
        cliente: data.cliente,
        productos: data.productos,
        total: data.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
        fecha: getToday(),
        hora: new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        metodoPago: data.metodoPago,
      }
      setVentas((prev) => [newVenta, ...prev])
      setModalNuevaVenta(false)
    },
    [ventas.length]
  )

  const handleLimpiarFiltros = useCallback(() => {
    setBusqueda("")
    setPeriodo("mes")
    setMetodoPagoFiltro("todos")
    setFechaInicio("")
    setFechaFin("")
  }, [])

  const handleExportar = useCallback(() => {
    exportVentasToCSV(ventasFiltradas, "ventas_reporte")
  }, [ventasFiltradas])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-0">
        <VentasHeader />

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-5">
          {/* KPIs */}
          <KpiCards data={kpiData} />

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
                  onVerDetalle={setDetalleVenta}
                  onExportar={handleExportar}
                />
              )}

              {activeTab === "analytics" && (
                <VentasAnalytics
                  ventasActuales={ventasFiltradas}
                  ventasPeriodoAnterior={ventasPeriodoAnterior}
                  periodoLabel={dateRange.label}
                />
              )}

              {activeTab === "caja" && (
                <CorteCaja ventasHoy={ventasHoy} allVentas={ventas} fondoInicial={5000} />
              )}
            </div>
          </div>

          {/* Summary footer */}
          <div
            className="bg-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-6 text-xs">
              <span className="text-muted-foreground">
                Rango: <span className="text-foreground font-medium">{dateRange.inicio}</span> a{" "}
                <span className="text-foreground font-medium">{dateRange.fin}</span>
              </span>
              <span className="text-muted-foreground">
                Total filtrado:{" "}
                <span className="text-primary font-bold">{formatCurrency(getTotalVentas(ventasFiltradas))}</span>
              </span>
              <span className="text-muted-foreground">
                Ventas: <span className="text-foreground font-medium">{ventasFiltradas.length}</span>
              </span>
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
        venta={detalleVenta}
        open={!!detalleVenta}
        onClose={() => setDetalleVenta(null)}
      />
    </div>
  )
}
