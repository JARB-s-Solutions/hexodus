import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Configuracion",
}

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="configuracion" accion="ver">{children}</RoleGuard>
}
