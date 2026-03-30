import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { getTodayYmdInTimeZone } from "@/lib/timezone"
import type { RegistroAcceso } from "@/lib/asistencia-data"

export type FormatoExportacionAsistencias = "XLSX" | "PDF" | "CSV"

interface RegistroAsistenciaExportable {
  timestamp: string
  nombreSocio: string
  socioId: string
  tipo: string
  metodoRegistro?: string
  confianza?: string
  motivo?: string
}

interface ExportarAsistenciasArgs {
  registros: RegistroAsistenciaExportable[]
  formato: FormatoExportacionAsistencias
  nombreArchivoBase?: string
  titulo?: string
  metadata?: Array<[string, string]>
}

interface ExportarRegistrosAsistenciaArgs {
  registros: RegistroAcceso[]
  formato: FormatoExportacionAsistencias
  nombreArchivoBase?: string
}

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_")
}

function getFechaHoraLocal(timestamp: string): { fecha: string; hora: string } {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return { fecha: "N/A", hora: "N/A" }
  }

  return {
    fecha: date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    hora: date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  }
}

function normalizeTipo(tipo: string): string {
  const raw = String(tipo || "").toUpperCase()
  if (raw === "IN" || raw === "PERMITIDO") return "Permitido"
  if (raw === "OUT" || raw === "DENEGADO") return "Denegado"
  return tipo || "N/A"
}

function normalizeConfianza(confianza?: string): string {
  if (!confianza || confianza === "N/A") return "N/A"
  return confianza.includes("%") ? confianza : `${confianza}%`
}

function getRows(registros: RegistroAsistenciaExportable[]): string[][] {
  return registros.map((registro) => {
    const { fecha, hora } = getFechaHoraLocal(registro.timestamp)

    return [
      fecha,
      hora,
      registro.nombreSocio || "N/A",
      registro.socioId || "N/A",
      normalizeTipo(registro.tipo),
      registro.metodoRegistro || "N/A",
      normalizeConfianza(registro.confianza),
      registro.motivo || "N/A",
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

function exportarCSV(registros: RegistroAsistenciaExportable[], fileBaseName: string): void {
  const headers = ["Fecha", "Hora", "Socio", "ID Socio", "Tipo", "Metodo", "Confianza", "Motivo"]
  const rows = getRows(registros)

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  descargarBlob(blob, `${fileBaseName}.csv`)
}

function exportarXLSX(registros: RegistroAsistenciaExportable[], fileBaseName: string): void {
  const headers = ["Fecha", "Hora", "Socio", "ID Socio", "Tipo", "Metodo", "Confianza", "Motivo"]
  const rows = getRows(registros)

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 11 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 42 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias")
  XLSX.writeFile(workbook, `${fileBaseName}.xlsx`)
}

function exportarPDF(
  registros: RegistroAsistenciaExportable[],
  fileBaseName: string,
  titulo: string,
  metadata?: Array<[string, string]>
): void {
  const headers = ["Fecha", "Hora", "Socio", "ID", "Tipo", "Metodo", "Conf.", "Motivo"]
  const rows = getRows(registros)

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" })
  doc.setFontSize(14)
  doc.text(titulo, 40, 40)

  const metadataRows = (metadata || []).filter((item) => item[1])
  doc.setFontSize(10)
  doc.text(`Generado: ${getTodayYmdInTimeZone()} | Registros: ${registros.length}`, 40, 58)

  let startY = 72
  metadataRows.forEach(([key, value], index) => {
    doc.text(`${key}: ${value}`, 40, 74 + index * 14)
    startY = 88 + index * 14
  })

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: "striped",
    margin: { left: 24, right: 24 },
  })

  doc.save(`${fileBaseName}.pdf`)
}

export function exportarAsistenciasArchivo({
  registros,
  formato,
  nombreArchivoBase,
  titulo = "Reporte de Asistencias",
  metadata,
}: ExportarAsistenciasArgs): void {
  const fileBaseName = nombreArchivoBase || `asistencias_${getTodayYmdInTimeZone()}`

  if (formato === "XLSX") {
    exportarXLSX(registros, fileBaseName)
    return
  }

  if (formato === "PDF") {
    exportarPDF(registros, fileBaseName, titulo, metadata)
    return
  }

  exportarCSV(registros, fileBaseName)
}

export function exportarRegistrosAsistencia({
  registros,
  formato,
  nombreArchivoBase,
}: ExportarRegistrosAsistenciaArgs): void {
  exportarAsistenciasArchivo({
    registros: registros.map((registro) => ({
      timestamp: registro.timestamp,
      nombreSocio: registro.nombreSocio,
      socioId: registro.socioId,
      tipo: registro.tipo,
      metodoRegistro: registro.metodoRegistro,
      confianza: registro.confianza,
      motivo: registro.motivo,
    })),
    formato,
    nombreArchivoBase: nombreArchivoBase || `asistencias_${getTodayYmdInTimeZone()}`,
    titulo: "Reporte de Asistencias",
  })
}

export function getNombreArchivoHistorialSocio(codigoSocio: string): string {
  const safeCode = sanitizeFileNamePart(codigoSocio || "socio")
  return `historial_asistencias_${safeCode}_${getTodayYmdInTimeZone()}`
}