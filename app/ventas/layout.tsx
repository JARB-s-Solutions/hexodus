import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Ventas",
}

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="ventas" accion="ver">{children}</RoleGuard>
}
