"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Cell,
} from "recharts"
import { Flame, AlertTriangle, TrendingUp } from "lucide-react"
import type { StockCritico } from "@/lib/dashboard-data"

// ─── Shared tooltip styles ────────────────────────────────────────────────────
const ttStyle = {
  backgroundColor: "rgba(12, 12, 16, 0.97)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
  padding: "10px 14px",
}
const ttLabelStyle = {
  color: "#fff",
  fontWeight: "600",
  fontSize: "12px",
  marginBottom: "5px",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
function formatDayLabel(dia: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(dia)) {
    return DAY_NAMES[new Date(dia + "T12:00:00").getDay()]
  }
  return dia
}

function fmtK(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
}

// ─── Heat-color for horas pico (cool → warm → hot) ────────────────────────────
function heatColor(ratio: number) {
  if (ratio >= 0.85) return "#FF3B3B"
  if (ratio >= 0.65) return "#FF6B1A"
  if (ratio >= 0.40) return "#FFB627"
  if (ratio >= 0.20) return "#00BFFF"
  return "rgba(0,191,255,0.28)"
}

// ─── Stock severity config ────────────────────────────────────────────────────
function stockCfg(item: StockCritico) {
  if (item.nivel === "danger" && item.cantidad <= 3) {
    return {
      gradient: "linear-gradient(90deg, #7f1d1d 0%, #dc2626 50%, #ff3b3b 100%)",
      glow: "0 0 14px rgba(255,59,59,0.65)",
      textColor: "#ff3b3b",
      bg: "rgba(255,59,59,0.06)",
      border: "rgba(255,59,59,0.18)",
      badge: "Crítico",
      badgeCls: "text-red-400 bg-red-500/10 border border-red-500/25",
    }
  }
  if (item.nivel === "danger") {
    return {
      gradient: "linear-gradient(90deg, #991b1b 0%, #ef4444 100%)",
      glow: "0 0 12px rgba(239,68,68,0.55)",
      textColor: "#ef4444",
      bg: "rgba(239,68,68,0.05)",
      border: "rgba(239,68,68,0.14)",
      badge: "Bajo",
      badgeCls: "text-red-400 bg-red-500/10 border border-red-500/20",
    }
  }
  return {
    gradient: "linear-gradient(90deg, #78350f 0%, #d97706 55%, #fbbf24 100%)",
    glow: "0 0 12px rgba(251,191,36,0.45)",
    textColor: "#fbbf24",
    bg: "rgba(251,191,36,0.05)",
    border: "rgba(251,191,36,0.15)",
    badge: "Alerta",
    badgeCls: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ventas vs. Periodo Anterior
// ─────────────────────────────────────────────────────────────────────────────
export function VentasChart({ data }: { data: { dia: string; actual: number; anterior: number }[] }) {
  const totalActual = data.reduce((s, d) => s + d.actual, 0)
  const totalAnterior = data.reduce((s, d) => s + d.anterior, 0)
  const diff = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0
  const isUp = diff >= 0

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ventas vs. Periodo Anterior</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Comparativa semanal</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">${totalActual.toLocaleString()}</p>
          <span
            className="text-[11px] font-semibold"
            style={{ color: isUp ? "#4ade80" : "#ff3b3b" }}
          >
            {isUp ? "+" : ""}{diff.toFixed(1)}% vs anterior
          </span>
        </div>
      </div>
      {/* Legend pills */}
      <div className="flex items-center gap-2 px-5 pb-1">
        <span className="flex items-center gap-1.5 text-[11px] text-foreground/70">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(180deg,#ff3b3b,#cc1515)" }} />
          Actual
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-white/20" />
          Anterior
        </span>
      </div>
      {/* Chart */}
      <div className="px-3 pb-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
            barCategoryGap="24%"
            barGap={-28}
          >
            <defs>
              <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF3B3B" />
                <stop offset="100%" stopColor="#cc1515" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gAnterior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(160,160,170,0.55)" />
                <stop offset="100%" stopColor="rgba(70,70,80,0.25)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="dia"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }} tickFormatter={fmtK} />
            <Tooltip
              contentStyle={ttStyle}
              labelStyle={ttLabelStyle}
              cursor={{ fill: "rgba(255,255,255,0.025)", radius: 4 }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === "actual" ? "Actual" : "Anterior",
              ]}
            />
            <Bar dataKey="anterior" fill="url(#gAnterior)" radius={[6, 6, 0, 0]} barSize={30} />
            <Bar dataKey="actual" fill="url(#gActual)" radius={[6, 6, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Horas Pico
// ─────────────────────────────────────────────────────────────────────────────
export function HorasPicoChart({ data }: { data: { hora: string; personas: number }[] }) {
  const safeData = data.length > 0 ? data : [{ hora: "--", personas: 0 }]
  const maxVal = Math.max(...safeData.map((d) => d.personas), 1)
  const picoHora = safeData.find((d) => d.personas === maxVal)
  const hourStart = Number(String(picoHora?.hora ?? "").split(":")[0])
  const hourEnd = Number.isFinite(hourStart) ? (hourStart + 1) % 24 : null

  const renderHorasTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const personas = Number(payload[0]?.value ?? 0)
    const valueColor = heatColor(personas / maxVal)

    return (
      <div style={ttStyle}>
        <p style={ttLabelStyle}>{label}</p>
        <p style={{ color: "#E5E7EB", margin: 0, fontSize: "12px" }}>
          Afluencia:{" "}
          <span style={{ color: valueColor, fontWeight: 700 }}>
            {personas} personas
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Horas Pico</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Afluencia del día</p>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Hoy
        </span>
      </div>
      <div className="px-3 pb-1 h-[215px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ top: 14, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 9 }} />
            <YAxis hide />
            <Tooltip
              content={renderHorasTooltip}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="personas" radius={[5, 5, 0, 0]} barSize={22}>
              {safeData.map((entry, i) => (
                <Cell key={i} fill={heatColor(entry.personas / maxVal)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Footer pill */}
      <div className="mx-4 mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-primary/15 bg-primary/[0.07]">
        <Flame className="h-4 w-4 text-primary shrink-0" />
        <span className="text-[12px] text-muted-foreground leading-snug">
          Pico máximo:{" "}
          <strong className="text-foreground">
            {Number.isFinite(hourStart)
              ? `${String(hourStart).padStart(2, "0")}:00 – ${String(hourEnd).padStart(2, "0")}:00`
              : "Sin datos"}
          </strong>{" "}
          con <strong className="text-primary">{maxVal}</strong> personas
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ingresos Diarios
// ─────────────────────────────────────────────────────────────────────────────
export function IngresosChart({ data }: { data: { dia: string; ingresos: number }[] }) {
  const fmtd = data.map((d) => ({ ...d, diaLabel: formatDayLabel(d.dia) }))
  const total = fmtd.reduce((s, d) => s + d.ingresos, 0)

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ingresos Diarios</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Últimos 7 días</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color: "#00BFFF" }}>${total.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total periodo</p>
        </div>
      </div>
      <div className="px-3 pb-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fmtd} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.32} />
                <stop offset="55%" stopColor="#00BFFF" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#00BFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="diaLabel" axisLine={false} tickLine={false} tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }} tickFormatter={fmtK} />
            <Tooltip
              contentStyle={ttStyle}
              labelStyle={ttLabelStyle}
              cursor={{ stroke: "rgba(0,191,255,0.22)", strokeWidth: 1, strokeDasharray: "5 4" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#00BFFF"
              strokeWidth={2.5}
              fill="url(#gIngresos)"
              dot={{ r: 3.5, fill: "#00BFFF", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#00BFFF", stroke: "rgba(0,191,255,0.35)", strokeWidth: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock Crítico
// ─────────────────────────────────────────────────────────────────────────────
export function StockCriticoCard({ items }: { items: StockCritico[] }) {
  const safeItems = items || []
  const maxCantidad = Math.max(...safeItems.map((i) => i.cantidad), 1)

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Stock Crítico</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Productos bajo mínimo</p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {safeItems.length} productos
        </span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {safeItems.length === 0 && (
          <p className="text-xs text-muted-foreground py-3 text-center">Sin productos críticos ✓</p>
        )}
        {safeItems.map((item) => {
          const cfg = stockCfg(item)
          // normalize relative to the item with highest stock (so bars fill the card)
          const barPct = Math.max((item.cantidad / maxCantidad) * 100, 5)

          return (
            <div
              key={item.nombre}
              className="rounded-xl px-4 py-3 border transition-colors"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              {/* Row: icon + name + badge + count */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.textColor }} />
                  <p className="text-sm font-medium text-foreground truncate">{item.nombre}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                    {cfg.badge}
                  </span>
                  <span className="text-base font-bold tabular-nums leading-none" style={{ color: cfg.textColor }}>
                    {item.cantidad}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${barPct}%`,
                    background: cfg.gradient,
                    boxShadow: cfg.glow,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
