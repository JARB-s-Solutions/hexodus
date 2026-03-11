import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Socios",
}

export default function SociosLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="socios" accion="ver">{children}</RoleGuard>
}
