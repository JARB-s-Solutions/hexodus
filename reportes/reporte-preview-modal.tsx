"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, ChevronLeft, ChevronRight, Download, ExternalLink, Eye, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog"
import type { ReporteHistorial } from "@/reportes/historial-reportes"

const PDF_ZOOM_SCALE_STORAGE_KEY = "hexodus.reportes.preview.pdf.zoomScale"

interface ReportePreviewModalProps {
  open: boolean
  reporte: ReporteHistorial | null
  onClose: () => void
  onSolicitarUrlDescarga: (reporte: ReporteHistorial) => Promise<string>
  onDescargar: (reporte: ReporteHistorial) => void
}

declare global {
  interface Window {
    pdfjsLib?: {
      version?: string
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<any> }
    }
  }
}

function normalizarFormato(formato: string): "PDF" | "XLSX" | "CSV" {
  const clean = String(formato).toUpperCase()
  if (clean === "PDF") return "PDF"
  if (clean === "XLSX" || clean === "EXCEL") return "XLSX"
  return "CSV"
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

async function cargarPdfJsDesdeCdn(): Promise<NonNullable<Window["pdfjsLib"]>> {
  if (typeof window === "undefined") {
    throw new Error("PDF.js solo puede inicializarse en navegador")
  }

  const pdfjsDisponible = window.pdfjsLib as NonNullable<Window["pdfjsLib"]> | undefined
  if (pdfjsDisponible) {
    pdfjsDisponible.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js"
    return pdfjsDisponible
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pdfjs="cdn"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar PDF.js desde CDN")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
    script.async = true
    script.dataset.pdfjs = "cdn"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar PDF.js desde CDN"))
    document.body.appendChild(script)
  })

  const pdfjsCargado = window.pdfjsLib as NonNullable<Window["pdfjsLib"]> | undefined
  if (!pdfjsCargado) {
    throw new Error("PDF.js no se inicializo correctamente")
  }

  pdfjsCargado.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js"
  return pdfjsCargado
}

export function ReportePreviewModal({
  open,
  reporte,
  onClose,
  onSolicitarUrlDescarga,
  onDescargar,
}: ReportePreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pdfPages, setPdfPages] = useState(0)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfScale, setPdfScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1
    const saved = Number(window.localStorage.getItem(PDF_ZOOM_SCALE_STORAGE_KEY) || "1")
    return Number.isFinite(saved) && saved >= 0.6 && saved <= 2.5 ? saved : 1
  })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfViewportRef = useRef<HTMLDivElement | null>(null)

  const formato = useMemo(() => normalizarFormato(reporte?.formato || "CSV"), [reporte?.formato])

  const officePreviewUrl = useMemo(() => {
    if (!downloadUrl) return ""
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`
  }, [downloadUrl])

  useEffect(() => {
    let ignore = false

    const cargarPreview = async () => {
      if (!open || !reporte) return
      setLoading(true)
      setError(null)
      setCsvRows([])
      setPdfDoc(null)
      setPdfPages(0)
      setPdfPage(1)

      try {
        const url = await onSolicitarUrlDescarga(reporte)
        if (ignore) return

        setDownloadUrl(url)

        if (formato === "PDF") {
          const pdfResponse = await fetch(url)
          if (!pdfResponse.ok) {
            throw new Error("No se pudo descargar el PDF para la vista previa")
          }

          const buffer = await pdfResponse.arrayBuffer()
          if (ignore) return

          const pdfjs = await cargarPdfJsDesdeCdn()

          const loadingTask = pdfjs.getDocument({ data: buffer })
          const doc = await loadingTask.promise
          if (ignore) {
            await doc.destroy()
            return
          }

          setPdfDoc(doc)
          setPdfPages(doc.numPages)
          setPdfPage(1)
        }

        if (formato === "CSV") {
          const csvResponse = await fetch(url)
          if (!csvResponse.ok) {
            throw new Error("No se pudo cargar la vista previa CSV")
          }

          const text = await csvResponse.text()
          if (ignore) return

          const lines = text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

          const rows = lines.slice(0, 31).map(parseCsvLine)
          setCsvRows(rows)
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || "No se pudo cargar la vista previa del reporte")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    cargarPreview()

    return () => {
      ignore = true
    }
  }, [open, reporte, formato, onSolicitarUrlDescarga])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(PDF_ZOOM_SCALE_STORAGE_KEY, String(pdfScale))
  }, [pdfScale])

  useEffect(() => {
    let cancel = false

    const renderPdfPage = async () => {
      if (formato !== "PDF" || !pdfDoc || !canvasRef.current) return

      try {
        const page = await pdfDoc.getPage(pdfPage)
        if (cancel) return

        const baseViewport = page.getViewport({ scale: 1 })
        const availableWidth = Math.max((pdfViewportRef.current?.clientWidth || 0) - 24, 320)
        const fitWidthScale = availableWidth / baseViewport.width
        const viewport = page.getViewport({ scale: fitWidthScale * pdfScale })
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext("2d")
        if (!context) return

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: context, viewport }).promise
      } catch {
        if (!cancel) {
          setError("No se pudo renderizar la pagina del PDF")
        }
      }
    }

    renderPdfPage()

    return () => {
      cancel = true
    }
  }, [formato, pdfDoc, pdfPage, pdfScale, open])

  useEffect(() => {
    return () => {
      if (pdfDoc && typeof pdfDoc.destroy === "function") {
        pdfDoc.destroy().catch(() => undefined)
      }
    }
  }, [pdfDoc])

  const renderBody = () => {
    if (!reporte) return null

    if (loading) {
      return (
        <div className="flex min-h-[380px] items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando vista previa real del reporte...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="min-h-[280px] rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">No se pudo cargar la vista previa</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      )
    }

    if (!downloadUrl) {
      return (
        <div className="min-h-[280px] rounded-xl border border-border bg-muted/20 p-5">
          <p className="text-sm text-muted-foreground">No hay URL disponible para este reporte.</p>
        </div>
      )
    }

    if (formato === "PDF") {
      return (
        <div className="space-y-3 h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPdfPage((prev) => Math.max(1, prev - 1))}
                disabled={pdfPage <= 1}
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Pagina {pdfPage} de {pdfPages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPdfPage((prev) => Math.min(pdfPages || 1, prev + 1))}
                disabled={pdfPages === 0 || pdfPage >= pdfPages}
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPdfScale(1)
                }}
                className="inline-flex items-center justify-center rounded-md border border-accent text-accent bg-accent/10 px-2 py-1.5 text-xs"
              >
                Ajustar a ancho
              </button>
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">{Math.round(pdfScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Ultimo zoom guardado: {Math.round(pdfScale * 100)}% (Ajustar a ancho)
          </p>

          <div ref={pdfViewportRef} className="rounded-xl border border-border bg-background overflow-auto flex-1 min-h-0">
            <div className="flex items-start justify-center p-3">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        </div>
      )
    }

    if (formato === "XLSX") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            <iframe
              src={officePreviewUrl}
              title={`Vista previa ${reporte.nombre}`}
              className="w-full h-[62vh]"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Si tu navegador o red bloquean la vista de Excel, usa el boton de descarga.
          </p>
        </div>
      )
    }

    const headers = csvRows[0] || []
    const bodyRows = csvRows.slice(1)

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border overflow-auto max-h-[62vh]">
          <table className="min-w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {header || `Columna ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-t border-border/60">
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 text-foreground/90 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Vista previa limitada a 30 filas para mantener velocidad y legibilidad.
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="w-[min(96vw,1200px)] max-w-[min(96vw,1200px)] h-[92vh] max-h-[92vh] p-0 overflow-hidden flex flex-col" showCloseButton>
        <div className="p-5 border-b border-border bg-card/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Eye className="h-5 w-5 text-accent" />
              Vista previa del reporte
            </DialogTitle>
            <DialogDescription>
              {reporte ? `${reporte.nombre} (${normalizarFormato(reporte.formato)})` : ""}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 bg-background flex-1 min-h-0 overflow-hidden">{renderBody()}</div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-card/95">
          <p className="text-xs text-muted-foreground">
            Verifica formato y contenido antes de compartir el archivo.
          </p>
          <div className="flex items-center gap-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en pestana
              </a>
            )}
            <button
              type="button"
              onClick={() => reporte && onDescargar(reporte)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              disabled={!reporte}
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
