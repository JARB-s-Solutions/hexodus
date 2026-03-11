import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Usuarios",
}

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="usuarios" accion="ver">{children}</RoleGuard>
}
