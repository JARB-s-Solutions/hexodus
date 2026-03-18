"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  Wallet,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { formatCurrency, calcCambio, type IngresoFuente } from "@/lib/reportes-data"

interface DesgloseIngresosProps {
  totalVentas: number
  totalMembresias: number
  totalVentasAnt: number
  totalMembresiasAnt: number
  totalGastos: number
  labelAnterior: string
}

const tooltipStyle = {
  backgroundColor: "#1C1C20",
  border: "1px solid #2A2A30",
  borderRadius: "8px",
  color: "#E0E0E0",
  fontSize: "12px",
}

export function DesgloseIngresos({
  totalVentas,
  totalMembresias,
  totalVentasAnt,
  totalMembresiasAnt,
  totalGastos,
  labelAnterior,
}: DesgloseIngresosProps) {
  const totalIngresos = totalVentas + totalMembresias
  const totalIngresosAnt = totalVentasAnt + totalMembresiasAnt
  const saldoNeto = totalIngresos - totalGastos

  const fuentes = useMemo(() => {
    if (totalIngresos === 0) return []
    return [
      {
        fuente: "Ventas de Productos",
        monto: totalVentas,
        porcentaje: (totalVentas / totalIngresos) * 100,
        color: "#4BB543",
        icon: ShoppingCart,
        cambio: calcCambio(totalVentas, totalVentasAnt),
      },
      {
        fuente: "Membresias",
        monto: totalMembresias,
        porcentaje: (totalMembresias / totalIngresos) * 100,
        color: "#00BFFF",
        icon: CreditCard,
        cambio: calcCambio(totalMembresias, totalMembresiasAnt),
      },
    ].sort((a, b) => b.monto - a.monto)
  }, [totalVentas, totalMembresias, totalVentasAnt, totalMembresiasAnt, totalIngresos])

  const pieData = fuentes.map((f) => ({ name: f.fuente, value: f.monto }))

  return (
    <div
      className="bg-card rounded-xl p-5 relative overflow-hidden"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent glow-accent" />

      <div className="flex items-center gap-2 mb-5">
        <Wallet className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">
          Desglose de Ingresos
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="flex flex-col items-center">
          {fuentes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8">Sin datos para este periodo</p>
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {fuentes.map((f, i) => (
                        <Cell key={i} fill={f.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value), "Total"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Total ingresos center label */}
              <div className="text-center -mt-2">
                <p className="text-xs text-muted-foreground">Total Ingresos</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalIngresos)}</p>
              </div>
            </>
          )}
        </div>

        {/* Breakdown details */}
        <div className="flex flex-col gap-4">
          {fuentes.map((f) => {
            const isPositive = f.cambio >= 0
            return (
              <div key={f.fuente} className="bg-background rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}20` }}
                  >
                    <f.icon className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{f.fuente}</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(f.monto)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(f.porcentaje, 5)}%`,
                        backgroundColor: f.color,
                        minWidth: "20px",
                        maxWidth: "100px",
                      }}
                    />
                    <span className="text-xs font-semibold" style={{ color: f.color }}>
                      {f.porcentaje.toFixed(1)}%
                    </span>
                  </div>

                  <span
                    className={`text-xs flex items-center gap-0.5 ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? "+" : ""}{f.cambio.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}

          {/* Saldo neto */}
          <div
            className={`rounded-lg p-4 border-l-4 ${
              saldoNeto >= 0 ? "bg-success/5 border-success/50" : "bg-destructive/5 border-destructive/50"
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">Saldo Neto (Ingresos - Gastos)</p>
            <p
              className={`text-xl font-bold ${
                saldoNeto >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(saldoNeto)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
