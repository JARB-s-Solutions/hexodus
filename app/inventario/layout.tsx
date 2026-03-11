import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Inventario",
}

export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="inventario" accion="ver">{children}</RoleGuard>
}
