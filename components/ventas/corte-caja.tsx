"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  PlusCircle,
  Eye,
  Trash2,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import type { Venta, MetodoPago } from "@/lib/types/ventas"
import { formatCurrency } from "@/lib/types/ventas"
import { CajaService } from "@/lib/services/caja"
import type { CorteCaja as CorteCajaType, GetCortesResponse, Movimiento, CorteDetalle } from "@/lib/types/caja"
import { useToast } from "@/hooks/use-toast"

// Helper functions para corte de caja (temporal hasta integración con API)
function getMetodoPagoLabel(metodo: MetodoPago | string): string {
  return metodo
}

function getVentasPorMetodo(ventas: Venta[]): { metodo: string; cantidad: number; total: number }[] {
  const metodosMap: Record<string, { cantidad: number; total: number }> = {}
  ventas.forEach((v) => {
    if (!metodosMap[v.metodoPago]) {
      metodosMap[v.metodoPago] = { cantidad: 0, total: 0 }
    }
    metodosMap[v.metodoPago].cantidad += 1
    metodosMap[v.metodoPago].total += v.total
  })
  return Object.entries(metodosMap)
    .map(([metodo, data]) => ({ metodo, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

function parseFecha(fecha?: string | null): Date | null {
  if (!fecha) return null
  if (fecha.toLowerCase().includes("caja abierta")) return null

  const date = new Date(fecha)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatFecha(fecha?: string | null, fallback = "Sin fecha"): string {
  const date = parseFecha(fecha)
  if (!date) return fallback
  return date.toLocaleDateString("es-MX")
}

function formatFechaHora(fecha?: string | null, fallback = "Sin fecha"): string {
  const date = parseFecha(fecha)
  if (!date) return fallback
  return date.toLocaleString("es-MX")
}

function formatFechaHoraCorta(fecha?: string | null, fallback = "Sin fecha"): string {
  const date = parseFecha(fecha)
  if (!date) return fallback
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ====== Types ======

// Usamos los tipos del API directamente
type CorteCajaRecord = CorteCajaType

interface CorteCajaProps {
  ventasHoy: Venta[]
  allVentas: Venta[]
  fondoInicial: number
  canCrearCorte?: boolean
  canExportar?: boolean
}

interface MovimientoConsultaRow {
  id: number
  fecha: string
  hora: string
  concepto: string
  tipo: string
  tipoPago: string
  usuario: string
  ingreso: number
  egreso: number
}

// ====== Main Component ======

export function CorteCaja({
  ventasHoy,
  allVentas,
  fondoInicial,
  canCrearCorte = true,
  canExportar = true,
}: CorteCajaProps) {
  const { toast } = useToast()
  
  // Estados de datos del API
  const [cortes, setCortes] = useState<CorteCajaRecord[]>([])
  const [dashboardStats, setDashboardStats] = useState<GetCortesResponse["dashboard_stats"] | null>(null)
  const [pagination, setPagination] = useState<GetCortesResponse["pagination"]>({
    current_page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")

  // Modals
  const [showNuevoModal, setShowNuevoModal] = useState(false)
  const [selectedCorte, setSelectedCorte] = useState<CorteCajaRecord | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [corteDetalle, setCorteDetalle] = useState<CorteDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Cargar cortes desde el API
  const cargarCortes = useCallback(async (page?: number) => {
    try {
      setLoading(true)
      console.log("🔄 Cargando cortes de caja...")
      
      const params: any = {
        page: page || pagination.current_page,
        limit: 10,
      }
      
      // Agregar filtros de fecha si existen
      if (filtroFechaInicio) {
        params.fecha_inicio = filtroFechaInicio
      }
      
      if (filtroFechaFin) {
        params.fecha_fin = filtroFechaFin
      }
      
      const resultado = await CajaService.getCortes(params)
      
      setCortes(resultado.cortes)
      setDashboardStats(resultado.dashboardStats)
      setPagination(resultado.pagination)
      
      console.log("✅ Cortes cargados:", resultado.cortes.length)
    } catch (error: any) {
      console.error("❌ Error al cargar cortes:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los cortes de caja",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filtroFechaInicio, filtroFechaFin, pagination.current_page, toast])

  // Cargar cortes al montar el componente
  useEffect(() => {
    cargarCortes()
  }, [])

  // Effective cash in register (calculado desde ventasHoy)
  const totalEfectivo = useMemo(() => {
    return ventasHoy
      .filter((v) => v.metodoPago === "Efectivo")
      .reduce((sum, v) => sum + v.total, 0)
  }, [ventasHoy])
  
  // Usar dashboardStats si está disponible, sino calcular
  const efectivoEnCaja = dashboardStats 
    ? dashboardStats.efectivo_caja.total 
    : fondoInicial + totalEfectivo

  // Cargar detalle de un corte específico
  const cargarDetalle = useCallback(async (corteId: number) => {
    try {
      setLoadingDetalle(true)
      console.log("🔄 Cargando detalle del corte:", corteId)
      
      const detalle = await CajaService.getCorteDetalle(corteId)
      
      setCorteDetalle(detalle)
      setShowDetalleModal(true)
      
      console.log("✅ Detalle cargado con", detalle.movimientos.length, "movimientos")
    } catch (error: any) {
      console.error("❌ Error al cargar detalle:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el detalle del corte",
        variant: "destructive",
      })
    } finally {
      setLoadingDetalle(false)
    }
  }, [toast])

  // Handlers de paginación
  const handlePageChange = useCallback((newPage: number) => {
    console.log("📄 Cambiando a página:", newPage)
    setPagination((prev) => ({ ...prev, current_page: newPage }))
    cargarCortes(newPage)
  }, [cargarCortes])

  // Handlers
  const handleEliminar = useCallback(() => {
    if (!selectedCorte) return
    // TODO: Implementar eliminación con API
    setCortes((prev) => prev.filter((c) => c.id !== selectedCorte.id))
    setSelectedCorte(null)
    toast({
      title: "Corte eliminado",
      description: "El corte ha sido eliminado (funcionalidad demo)",
      variant: "destructive",
    })
  }, [selectedCorte, toast])

  const handleExportar = useCallback(() => {
    const headers = [
      "Folio",
      "Fecha Inicio",
      "Fecha Final",
      "Ingresos",
      "Egresos",
      "Caja Inicial",
      "Caja Final",
      "Usuario",
      "Fecha Creacion",
      "Observacion",
      "Status",
    ]
    const rows = cortes.map((c) => [
      c.folio,
      c.fechaInicio,
      c.fechaFin ?? "Caja abierta",
      c.ingresos.toFixed(2),
      c.egresos.toFixed(2),
      c.cajaInicial.toFixed(2),
      c.cajaFinal.toFixed(2),
      c.usuario,
      c.fechaCreacion,
      c.observacion,
      c.status,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cortes_caja_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Exportación exitosa",
      description: `${cortes.length} cortes exportados a Excel`,
    })
  }, [cortes, toast])

  const handleBuscar = useCallback(() => {
    console.log("🔍 Aplicando filtros de fecha...")
    setPagination((prev) => ({ ...prev, current_page: 1 }))
    cargarCortes(1)
  }, [cargarCortes])

  const handleNuevoCorte = useCallback(() => {
    console.log("✅ Corte creado exitosamente, recargando lista...")
    setShowNuevoModal(false)
    // Recargar la lista de cortes desde la página 1
    setPagination((prev) => ({ ...prev, current_page: 1 }))
    cargarCortes(1)
  }, [cargarCortes])

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Corte de Caja
          </h3>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {canCrearCorte && (
            <button
              onClick={() => setShowNuevoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase bg-primary text-primary-foreground glow-primary glow-primary-hover transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo
            </button>
          )}
          <button
            onClick={() => {
              if (selectedCorte) cargarDetalle(selectedCorte.id)
            }}
            disabled={!selectedCorte || loadingDetalle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingDetalle ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Ver Detalle
          </button>
          <div className="flex-1" />
          {canCrearCorte && (
            <button
              onClick={handleEliminar}
              disabled={!selectedCorte}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          )}
          {canExportar && (
            <button
              onClick={handleExportar}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-success text-success hover:bg-success/10 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar a Excel
            </button>
          )}
        </div>

        {/* Date Filters + Efectivo en Caja */}
        <div className="flex flex-wrap items-end gap-4 mb-5 pb-5 border-b border-border">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Fecha inicio
              </label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Fecha fin
              </label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleBuscar}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase bg-accent text-accent-foreground glow-accent glow-accent-hover transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
          </div>

          <div className="flex-1" />

          {/* Efectivo en Caja */}
          <div className="flex items-center gap-3 bg-background rounded-lg px-4 py-2.5">
            <DollarSign className="h-5 w-5 text-success" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Efectivo en caja
              </span>
              <span className="text-lg font-bold text-success">{formatCurrency(efectivoEnCaja)}</span>
            </div>
          </div>
        </div>

        {/* Cortes Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8" />
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha inicio
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha final
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Egresos
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Caja inicial
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Caja final
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha creacion
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Observacion
                  </th>
                </tr>
              </thead>
              <tbody>
                {cortes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-10 text-xs text-muted-foreground"
                    >
                      No hay cortes registrados
                    </td>
                  </tr>
                ) : (
                  cortes.map((corte) => {
                    const isSelected = selectedCorte?.id === corte.id
                    const fechaInicio = formatFecha(corte.fechaInicio)
                    const fechaFin = formatFecha(corte.fechaFin, "Caja abierta")
                    const fechaCreacion = formatFechaHora(corte.fechaCreacion)
                    
                    return (
                      <tr
                        key={corte.id}
                        onClick={() => setSelectedCorte(isSelected ? null : corte)}
                        onDoubleClick={() => {
                          setSelectedCorte(corte)
                          cargarDetalle(corte.id)
                        }}
                        className={`border-b border-border/40 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/10 border-accent/30"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <div
                            className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-accent bg-accent"
                                : "border-border"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-foreground font-medium">{corte.folio}</td>
                        <td className="py-3 pr-3 text-xs text-foreground">{fechaInicio}</td>
                        <td className="py-3 pr-3 text-xs text-foreground">{fechaFin}</td>
                        <td className="py-3 pr-3 text-xs font-semibold text-success">
                          {formatCurrency(corte.ingresos)}
                        </td>
                        <td className="py-3 pr-3 text-xs font-semibold text-destructive">
                          {formatCurrency(corte.egresos)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-accent font-medium">
                          {formatCurrency(corte.cajaInicial)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-accent font-medium">
                          {formatCurrency(corte.cajaFinal)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-foreground">{corte.usuario}</td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground">{fechaCreacion}</td>
                        <td className="py-3 text-xs text-muted-foreground truncate max-w-[140px]">
                          {corte.observacion || "-"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && !loading && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {pagination.total_records} corte{pagination.total_records !== 1 ? "s" : ""} registrado{pagination.total_records !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-foreground font-medium px-2">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Efectivo en Caja */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "#4BB543" }} />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Efectivo en Caja</span>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          {loading ? (
            <div className="flex items-center py-2">
              <Loader2 className="h-6 w-6 text-success animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-success">
                {formatCurrency(dashboardStats?.efectivo_caja.total ?? efectivoEnCaja)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  Fondo: {formatCurrency(dashboardStats?.efectivo_caja.fondo ?? fondoInicial)}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  {dashboardStats && dashboardStats.efectivo_caja.variacion >= 0 ? "+" : ""}
                  {formatCurrency(dashboardStats?.efectivo_caja.variacion ?? totalEfectivo)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Total Hoy */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Hoy</span>
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          {loading ? (
            <div className="flex items-center py-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(
                  dashboardStats?.total_hoy.total ?? ventasHoy.reduce((s, v) => s + v.total, 0)
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                {dashboardStats?.total_hoy.transacciones ?? ventasHoy.length} transacciones
              </p>
            </>
          )}
        </div>

        {/* Cortes Realizados */}
        <div
          className="bg-card rounded-xl p-4 relative overflow-hidden"
          style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cortes Realizados</span>
            <Calendar className="h-4 w-4 text-accent" />
          </div>
          {loading ? (
            <div className="flex items-center py-2">
              <Loader2 className="h-6 w-6 text-accent animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-accent">
                {dashboardStats?.cortes_realizados.total ?? cortes.length}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Ultimo:{" "}
                {dashboardStats?.cortes_realizados.ultimo
                  ? formatFechaHoraCorta(dashboardStats.cortes_realizados.ultimo, "N/A")
                  : formatFechaHoraCorta(cortes[0]?.fechaCreacion, "N/A")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Nuevo Corte Modal */}
      {showNuevoModal && (
        <NuevoCorteModal
          onClose={() => setShowNuevoModal(false)}
          onSuccess={handleNuevoCorte}
        />
      )}

      {/* Detalle Corte Modal */}
      {showDetalleModal && corteDetalle && (
        <DetalleCorteModal
          corte={corteDetalle}
          onClose={() => {
            setShowDetalleModal(false)
            setCorteDetalle(null)
          }}
        />
      )}
    </div>
  )
}

// ====== Nuevo Corte Modal ======

function NuevoCorteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  
  // Fechas por defecto: día actual
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  
  const [fechaInicio, setFechaInicio] = useState(startOfDay.toISOString())
  const [fechaFin, setFechaFin] = useState(endOfDay.toISOString())
  const [observacion, setObservacion] = useState("")
  const [consulted, setConsulted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [movimientos, setMovimientos] = useState<MovimientoConsultaRow[]>([])
  const [ingresos, setIngresos] = useState(0)
  const [egresos, setEgresos] = useState(0)
  const [efectivoInicial, setEfectivoInicial] = useState(0)
  const [efectivoFinal, setEfectivoFinal] = useState(0)

  const handleConsultar = useCallback(async () => {
    setLoading(true)
    try {
      console.log("📊 Consultando movimientos:", fechaInicio, "→", fechaFin)
      
      const response = await CajaService.consultarCaja({
        fecha_inicial: fechaInicio,
        fecha_final: fechaFin,
      })
      
      console.log("✅ Response:", response)
      
      // Adaptar MovimientoCaja a estructura UI
      const movs = response.movimientos.map((m: any) => {
        const fecha = new Date(m.fecha)
        return {
          id: m.id,
          fecha: fecha.toLocaleDateString("es-MX"),
          hora: fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
          concepto: m.concepto,
          tipo: m.tipo,
          tipoPago: m.tipo === "ingreso" ? "Ingreso" : "Egreso",
          usuario: m.usuario,
          ingreso: m.tipo === "ingreso" ? m.monto : 0,
          egreso: m.tipo === "egreso" ? m.monto : 0,
        }
      })
      
      setMovimientos(movs)
      setIngresos(response.resumen.total_ingresos)
      setEgresos(response.resumen.total_egresos)
      setEfectivoInicial(response.resumen.efectivo_inicial)
      setEfectivoFinal(response.resumen.efectivo_final)
      setConsulted(true)
      
      toast({
        title: "Consulta exitosa",
        description: `${movs.length} movimiento${movs.length !== 1 ? "s" : ""} encontrado${movs.length !== 1 ? "s" : ""}`,
      })
    } catch (error: any) {
      console.error("❌ Error en consulta:", error)
      toast({
        title: "Error al consultar",
        description: error.message || "No se pudo consultar el rango de fechas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin, toast])

  const handleRealizarCorte = useCallback(async () => {
    if (!consulted || movimientos.length === 0) {
      toast({
        title: "Advertencia",
        description: "Debes consultar los movimientos primero",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    try {
      console.log("💰 Creando corte de caja...")
      console.log("  Fechas:", fechaInicio, "→", fechaFin)
      console.log("  Observación:", observacion)
      
      const response = await CajaService.cerrarCaja({
        fecha_inicial: fechaInicio,
        fecha_final: fechaFin,
        observacion: observacion || undefined,
      })
      
      console.log("✅ Corte creado:", response.data.corte_id)
      
      toast({
        title: "¡Corte realizado!",
        description: `Corte de caja creado exitosamente (ID: ${response.data.corte_id})`,
      })
      
      // Llamar callback de éxito (cierra modal + recarga lista)
      onSuccess()
    } catch (error: any) {
      console.error("❌ Error al crear corte:", error)
      toast({
        title: "Error al crear corte",
        description: error.message || "No se pudo realizar el corte de caja",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [consulted, movimientos, fechaInicio, fechaFin, observacion, onSuccess, toast])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pb-6 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-4xl overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Creacion de Corte de Caja
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Datos del Corte */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Datos del Corte
            </h4>

            <div className="bg-background rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                    Fecha Inicial
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaInicio.slice(0, 16)}
                    onChange={(e) => {
                      const isoDate = new Date(e.target.value).toISOString()
                      setFechaInicio(isoDate)
                    }}
                    className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                    Fecha Final
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaFin.slice(0, 16)}
                    onChange={(e) => {
                      const isoDate = new Date(e.target.value).toISOString()
                      setFechaFin(isoDate)
                    }}
                    className="px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleConsultar}
                  disabled={loading || !fechaInicio || !fechaFin}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase bg-accent text-accent-foreground glow-accent glow-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Consultar
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Observacion
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Agregar una observacion (opcional)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-xs placeholder:text-muted-foreground focus:border-accent focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informacion Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              Informacion
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total de Ingresos
                </p>
                <p className={`text-lg font-bold ${consulted && ingresos > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {formatCurrency(ingresos)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total de Egresos
                </p>
                <p className={`text-lg font-bold ${consulted && egresos > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {formatCurrency(egresos)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Efectivo en caja inicial
                </p>
                <p className={`text-lg font-bold ${consulted ? "text-accent" : "text-muted-foreground"}`}>
                  {formatCurrency(efectivoInicial)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Efectivo en caja final
                </p>
                <p className={`text-lg font-bold ${consulted ? (efectivoFinal >= efectivoInicial ? "text-accent" : "text-warning") : "text-muted-foreground"}`}>
                  {formatCurrency(efectivoFinal)}
                </p>
              </div>
            </div>

            {/* Movimientos Table */}
            <div className="bg-background rounded-lg overflow-hidden">
              {!consulted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecciona un rango de fechas y haz clic en{" "}
                    <span className="text-accent font-medium">Consultar</span> para ver los movimientos
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 text-accent animate-spin" />
                </div>
              ) : movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No hay movimientos en el rango seleccionado</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Concepto
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Tipo de pago
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                          Ingresos
                        </th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                          Egresos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((m, idx) => (
                        <tr
                          key={`${m.fecha}-${m.hora}-${idx}`}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                            {m.fecha} {m.hora}
                          </td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.concepto}</td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.tipoPago}</td>
                          <td className="px-3 py-2 text-xs text-foreground">{m.usuario}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-right">
                            <span className={m.ingreso > 0 ? "text-success" : "text-muted-foreground"}>
                              {formatCurrency(m.ingreso)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-right">
                            <span className={m.egreso > 0 ? "text-destructive" : "text-muted-foreground"}>
                              {formatCurrency(m.egreso)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRealizarCorte}
              disabled={!consulted || movimientos.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase bg-success text-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: consulted && movimientos.length > 0 ? "0 0 15px rgba(75, 181, 67, 0.4)" : "none" }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Realizar Corte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====== Detalle Corte Modal ======

function DetalleCorteModal({
  corte,
  onClose,
}: {
  corte: CorteDetalle
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-card rounded-xl w-full max-w-3xl overflow-hidden animate-slide-up"
        style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-accent flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Detalle del Corte {corte.folio}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fecha Inicio</p>
              <p className="text-sm font-medium text-foreground">
                {formatFechaHora(corte.fechaInicio)}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fecha Final</p>
              <p className="text-sm font-medium text-foreground">
                {formatFechaHora(corte.fechaFin, "Caja abierta")}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Usuario</p>
              <p className="text-sm font-medium text-foreground">{corte.usuario}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Creado</p>
              <p className="text-sm font-medium text-foreground">
                {formatFechaHora(corte.creado)}
              </p>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Ingresos</p>
              <p className="text-lg font-bold text-success">{formatCurrency(corte.totalIngresos)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Egresos</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(corte.totalEgresos)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Caja Inicial</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(corte.cajaInicial)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Caja Final</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(corte.cajaFinal)}</p>
            </div>
          </div>

          {/* Observacion */}
          {corte.observaciones && (
            <div className="bg-background rounded-lg p-3 mb-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Observacion</p>
              <p className="text-sm text-foreground">{corte.observaciones}</p>
            </div>
          )}

          {/* Movimientos */}
          <div className="bg-background rounded-lg overflow-hidden mb-5">
            <div className="px-3 py-2.5 border-b border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Movimientos ({corte.movimientos.length})
              </h4>
            </div>
            {corte.movimientos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin movimientos registrados</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.movimientos.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {m.folioMovimiento}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                          {formatFechaHoraCorta(m.fecha)}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{m.concepto}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{m.usuario}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                              m.tipo === "ingreso"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-right">
                          <span className={m.tipo === "ingreso" ? "text-success" : "text-destructive"}>
                            {m.tipo === "ingreso" ? "+" : "-"}
                            {formatCurrency(m.monto)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Close */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
