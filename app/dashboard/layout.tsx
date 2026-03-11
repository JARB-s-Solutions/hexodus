import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="dashboard" accion="ver">{children}</RoleGuard>
}
