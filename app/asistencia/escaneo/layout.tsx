import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Asistencia | Escaneo",
}

export default function EscaneoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}