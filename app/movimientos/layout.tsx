import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Movimientos",
}

export default function MovimientosLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="movimientos" accion="ver">{children}</RoleGuard>
}
