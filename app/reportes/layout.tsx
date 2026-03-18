import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Reportes",
}

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="reportes" accion="ver">{children}</RoleGuard>
}
