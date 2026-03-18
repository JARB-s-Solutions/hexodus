"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Clock3, Database, Download, RefreshCw, ShieldCheck, RotateCcw } from "lucide-react"
import { BackupsService, type BackupGenerado } from "@/lib/services/backups"

function formatFechaHora(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "Fecha inválida"
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function mapStatusLabel(status: string) {
  const value = status.toLowerCase()
  if (value === "exitoso" || value === "ok") return "Exitoso"
  if (value === "procesando") return "Procesando"
  return "Error"
}

export function BackupsTab() {
  const [creandoBackup, setCreandoBackup] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [descargandoBackupId, setDescargandoBackupId] = useState<number | null>(null)
  const [restaurandoBackupId, setRestaurandoBackupId] = useState<number | null>(null)
  const [backupAConfirmar, setBackupAConfirmar] = useState<BackupGenerado | null>(null)
  const [historialBackups, setHistorialBackups] = useState<BackupGenerado[]>([])
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const cargarHistorial = useCallback(async () => {
    try {
      setCargandoHistorial(true)
      const historial = await BackupsService.obtenerHistorial()
      setHistorialBackups(historial)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo cargar el historial de backups"
      setToast({ type: "error", message: errorMessage })
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  useEffect(() => {
    void cargarHistorial()
  }, [cargarHistorial])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const handleCrearBackup = async () => {
    try {
      setCreandoBackup(true)
      const backup = await BackupsService.generarBackup()
      setToast({
        type: "success",
        message: `Backup generado: ${backup.archivo}`,
      })
      await cargarHistorial()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar el backup"
      setToast({ type: "error", message: errorMessage })
    } finally {
      setCreandoBackup(false)
    }
  }

  const handleDescargarBackup = async (backup: BackupGenerado) => {
    try {
      setDescargandoBackupId(backup.id)
      const downloadUrl = await BackupsService.obtenerUrlDescarga(backup.archivo)

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error("No se pudo obtener el archivo del backup")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = backup.archivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo descargar el backup"
      setToast({ type: "error", message: errorMessage })
    } finally {
      setDescargandoBackupId(null)
    }
  }

  const handleSolicitarRestauracion = (backup: BackupGenerado) => {
    setBackupAConfirmar(backup)
  }

  const handleConfirmarRestauracion = async () => {
    if (!backupAConfirmar) return

    try {
      setRestaurandoBackupId(backupAConfirmar.id)
      const message = await BackupsService.restaurarBackup(backupAConfirmar.archivo)
      setBackupAConfirmar(null)
      setToast({
        type: "success",
        message: `${message} Recargando sistema...`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 2200)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo restaurar el backup"
      setToast({ type: "error", message: errorMessage })
      setRestaurandoBackupId(null)
    }
  }

  const handleCancelarRestauracion = () => {
    if (restaurandoBackupId !== null) return
    setBackupAConfirmar(null)
  }

  const ultimoBackup = historialBackups[0]
  const ultimoBackupDescargable = ultimoBackup && mapStatusLabel(ultimoBackup.status) === "Exitoso"
  const restauracionEnCurso = restaurandoBackupId !== null

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Respaldos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Genera respaldos manuales en la nube. El archivo queda encriptado y disponible para recuperación.
        </p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">Generar un Nuevo Backup</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ejecuta un respaldo manual inmediato con la API oficial.
            </p>
          </div>

          <button
            onClick={handleCrearBackup}
            disabled={creandoBackup || restauracionEnCurso}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creandoBackup ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Generar Backup
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ultimo backup</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {ultimoBackup ? formatFechaHora(ultimoBackup.generadoEn) : "Sin registros"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => ultimoBackup && handleDescargarBackup(ultimoBackup)}
              disabled={!ultimoBackupDescargable || descargandoBackupId === ultimoBackup?.id || restauracionEnCurso}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
              aria-label="Descargar ultimo backup"
              title="Descargar ultimo backup"
            >
              {descargandoBackupId === ultimoBackup?.id ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Descargar ultimo backup</span>
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ruta</p>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">
            {ultimoBackup?.rutaLocal || "Supabase Storage"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Integridad</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Encriptado en nube
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold text-foreground">Historial de Respaldos</h3>
        </div>

        {cargandoHistorial ? (
          <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Cargando historial de backups...
          </div>
        ) : historialBackups.length === 0 ? (
          <div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Aun no hay backups registrados.
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {historialBackups.map((backup) => {
                const isSuccess = mapStatusLabel(backup.status) === "Exitoso"
                return (
                  <div key={backup.id} className="rounded-lg border border-border p-4">
                    <p className="break-all text-sm font-medium text-foreground">{backup.archivo}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Tipo: <span className="capitalize text-foreground">{backup.tipo}</span></p>
                      <p>Tamano: <span className="text-foreground">{backup.tamanoMb} MB</span></p>
                      <p>Usuario: <span className="text-foreground">{backup.usuario?.nombreCompleto || "Sistema"}</span></p>
                      <p>Generado: <span className="text-foreground">{formatFechaHora(backup.generadoEn)}</span></p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          isSuccess
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {mapStatusLabel(backup.status)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDescargarBackup(backup)}
                        disabled={!isSuccess || descargandoBackupId === backup.id || restauracionEnCurso}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                        title="Descargar backup"
                        aria-label={`Descargar ${backup.archivo}`}
                      >
                        {descargandoBackupId === backup.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSolicitarRestauracion(backup)}
                        disabled={!isSuccess || restauracionEnCurso}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                        title="Restaurar backup"
                        aria-label={`Restaurar ${backup.archivo}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restaurar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archivo</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tamano</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generado</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuario</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historialBackups.map((backup) => {
                      const isSuccess = mapStatusLabel(backup.status) === "Exitoso"
                      return (
                        <tr key={backup.id} className="hover:bg-muted/20">
                          <td className="max-w-[320px] px-4 py-3 text-sm text-foreground">{backup.archivo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{backup.tipo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{backup.tamanoMb} MB</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                isSuccess
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              {mapStatusLabel(backup.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatFechaHora(backup.generadoEn)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{backup.usuario?.nombreCompleto || "Sistema"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDescargarBackup(backup)}
                                disabled={!isSuccess || descargandoBackupId === backup.id || restauracionEnCurso}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                                title="Descargar backup"
                                aria-label={`Descargar ${backup.archivo}`}
                              >
                                {descargandoBackupId === backup.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSolicitarRestauracion(backup)}
                                disabled={!isSuccess || restauracionEnCurso}
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                                title="Restaurar backup"
                                aria-label={`Restaurar ${backup.archivo}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restaurar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {backupAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">Confirmar restauracion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta accion reemplazara la base de datos actual por la informacion del backup seleccionado.
              El sistema volvera al estado de ese respaldo.
            </p>

            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Backup seleccionado</p>
              <p className="mt-1 text-sm text-foreground">{backupAConfirmar.archivo}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatFechaHora(backupAConfirmar.generadoEn)}</p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelarRestauracion}
                disabled={restauracionEnCurso}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestauracion}
                disabled={restauracionEnCurso}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {restauracionEnCurso ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {restauracionEnCurso ? "Restaurando..." : "Si, restaurar backup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {restauracionEnCurso && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
          <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
              <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
            </div>
            <p className="text-base font-semibold text-foreground">Restaurando base de datos...</p>
            <p className="mt-1 text-sm text-muted-foreground">No cierres la ventana ni recargues el sistema.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-5 top-5 z-50 animate-slide-in-right">
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
