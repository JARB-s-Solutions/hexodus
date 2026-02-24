import type { Venta } from "./ventas-data"
import { formatCurrency, getMetodoPagoLabel } from "./ventas-data"

export function exportVentasToCSV(ventas: Venta[], filename: string = "ventas") {
  const headers = ["ID", "Cliente", "Productos", "Cantidad Items", "Total", "Fecha", "Hora", "Metodo de Pago"]

  const rows = ventas.map((v) => [
    v.id,
    v.cliente,
    v.productos.map((p) => `${p.nombre} x${p.cantidad}`).join("; "),
    v.productos.reduce((sum, p) => sum + p.cantidad, 0).toString(),
    formatCurrency(v.total),
    v.fecha,
    v.hora,
    getMetodoPagoLabel(v.metodoPago),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  // Add BOM for Excel encoding
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
