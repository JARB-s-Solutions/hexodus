import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import type { Venta } from "@/lib/types/ventas"
import { formatDateTime } from "@/lib/types/ventas"
import { getTodayYmdInTimeZone } from "@/lib/timezone"

export type FormatoExportacionVentas = "XLSX" | "PDF" | "CSV"

interface ExportarVentasArgs {
  ventas: Venta[]
  formato: FormatoExportacionVentas
}

function getNombreArchivoBase(): string {
  return `ventas_${getTodayYmdInTimeZone()}`
}

function getRows(ventas: Venta[]): Array<Array<string | number>> {
  return ventas.map((venta) => {
    const { fecha, hora } = formatDateTime(venta.fechaHora)

    return [
      venta.idVenta,
      venta.cliente,
      venta.productosResumen,
      venta.total,
      `${fecha} ${hora}`,
      venta.metodoPago,
      venta.status,
    ]
  })
}

function descargarBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportarCSV(ventas: Venta[]): void {
  const headers = [
    "ID Venta",
    "Cliente",
    "Productos",
    "Total",
    "Fecha y Hora",
    "Metodo de Pago",
    "Estado",
  ]

  const rows = getRows(ventas)
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  descargarBlob(blob, `${getNombreArchivoBase()}.csv`)
}

function exportarXLSX(ventas: Venta[]): void {
  const headers = [
    "ID Venta",
    "Cliente",
    "Productos",
    "Total",
    "Fecha y Hora",
    "Metodo de Pago",
    "Estado",
  ]

  const rows = getRows(ventas)
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 36 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas")
  XLSX.writeFile(workbook, `${getNombreArchivoBase()}.xlsx`)
}

function exportarPDF(ventas: Venta[]): void {
  const headers = [
    "ID Venta",
    "Cliente",
    "Productos",
    "Total",
    "Fecha y Hora",
    "Metodo",
    "Estado",
  ]

  const body = getRows(ventas).map((row) => [
    String(row[0]),
    String(row[1]),
    String(row[2]),
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(row[3])),
    String(row[4]),
    String(row[5]),
    String(row[6]),
  ])

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" })
  doc.setFontSize(14)
  doc.text("Reporte de Ventas", 40, 40)
  doc.setFontSize(10)
  doc.text(`Generado: ${getTodayYmdInTimeZone()} | Registros: ${ventas.length}`, 40, 58)

  autoTable(doc, {
    startY: 72,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [18, 161, 236] },
    theme: "striped",
    margin: { left: 28, right: 28 },
  })

  doc.save(`${getNombreArchivoBase()}.pdf`)
}

export function exportarVentasArchivo({ ventas, formato }: ExportarVentasArgs): void {
  if (formato === "XLSX") {
    exportarXLSX(ventas)
    return
  }

  if (formato === "PDF") {
    exportarPDF(ventas)
    return
  }

  exportarCSV(ventas)
}
