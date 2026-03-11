import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Asistencia",
}

export default function AsistenciaLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="asistencia" accion="ver">{children}</RoleGuard>
}
