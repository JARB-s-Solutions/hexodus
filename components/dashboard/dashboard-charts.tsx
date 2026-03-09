"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
  Cell,
} from "recharts"
import { Flame } from "lucide-react"
import type { StockCritico } from "@/lib/dashboard-data"

// ============================================================================
// Ventas vs Periodo Anterior (Bar Chart)
// ============================================================================

interface VentasChartProps {
  data: { dia: string; actual: number; anterior: number }[]
}

const chartTooltipStyle = {
  backgroundColor: "rgba(28, 28, 32, 0.95)",
  border: "1px solid rgba(255, 59, 59, 0.3)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
}

const chartTooltipLabelStyle = {
  color: "#FFFFFF",
  fontWeight: "500",
  marginBottom: "4px",
}

export function VentasChart({ data }: VentasChartProps) {
  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in-up">
      <div className="px-5 pt-4 pb-0">
        <h3 className="text-sm font-semibold text-foreground">Ventas vs. Periodo Anterior</h3>
      </div>
      <div className="px-4 pb-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="dia"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={chartTooltipStyle} 
              labelStyle={chartTooltipLabelStyle}
              cursor={{ fill: "transparent" }} 
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="actual" name="Actual" fill="#FF3B3B" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar dataKey="anterior" name="Anterior" fill="rgba(120,120,130,0.6)" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================================
// Horas Pico (Bar Chart)
// ============================================================================

interface HorasPicoChartProps {
  data: { hora: string; personas: number }[]
}

export function HorasPicoChart({ data }: HorasPicoChartProps) {
  const safeData = data.length > 0 ? data : [{ hora: "--", personas: 0 }]
  const maxVal = Math.max(...safeData.map((d) => d.personas))
  const picoHora = safeData.find((d) => d.personas === maxVal)

  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in-up">
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <h3 className="text-sm font-semibold text-foreground">Horas Pico</h3>
        <span className="text-xs text-muted-foreground">Hoy</span>
      </div>
      <div className="px-4 pb-2 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="hora"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 9 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={{ color: "#FFFFFF" }}
              cursor={{ fill: "transparent" }}
              formatter={(value: number) => [
                <span key="value" style={{ color: "#FF3B3B", fontWeight: "600" }}>
                  {value} personas
                </span>,
                ""
              ]}
            />
            <Bar dataKey="personas" radius={[4, 4, 0, 0]} barSize={16}>
              {safeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.personas === maxVal ? "#FF3B3B" : "rgba(0,191,255,0.15)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border">
        <Flame className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">
          {"Pico maximo: "}
          <strong className="text-foreground">{picoHora?.hora}:00 - {String(Number(picoHora?.hora || 0) + 1).padStart(2, "0")}:00</strong>
          {" con "}
          <strong className="text-primary">{maxVal}</strong>
          {" personas"}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Ingresos Diarios (Area/Line Chart)
// ============================================================================

interface IngresosChartProps {
  data: { dia: string; ingresos: number }[]
}

export function IngresosChart({ data }: IngresosChartProps) {
  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in-up">
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <h3 className="text-sm font-semibold text-foreground">Ingresos Diarios</h3>
        <span className="text-xs text-muted-foreground">Ultimos 7 dias</span>
      </div>
      <div className="px-4 pb-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="dia"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(120,120,130,0.8)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              cursor={{ stroke: "rgba(0, 191, 255, 0.3)", strokeWidth: 1, strokeDasharray: "5 5" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#00BFFF"
              strokeWidth={2}
              fill="url(#colorIngresos)"
              dot={{ fill: "#00BFFF", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#00BFFF" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================================
// Stock Critico
// ============================================================================

interface StockCriticoCardProps {
  items: StockCritico[]
}

export function StockCriticoCard({ items }: StockCriticoCardProps) {
  const safeItems = items || []

  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in-up">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Stock Critico</h3>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {safeItems.length} productos
        </span>
      </div>
      <div className="px-5 pb-4">
        {safeItems.length === 0 && (
          <p className="text-xs text-muted-foreground py-3">Sin datos disponibles</p>
        )}
        {safeItems.map((item, i) => (
          <div
            key={item.nombre}
            className={`flex items-center gap-4 py-3 ${
              i < safeItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.nombre}</p>
              <div className="h-1 w-full rounded-full bg-foreground/5 mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.nivel === "danger" ? "bg-primary" : "bg-warning"
                  }`}
                  style={{ width: `${item.porcentaje}%` }}
                />
              </div>
            </div>
            <span
              className={`text-sm font-bold min-w-[28px] text-center ${
                item.nivel === "danger" ? "text-primary" : "text-warning"
              }`}
            >
              {item.cantidad}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
