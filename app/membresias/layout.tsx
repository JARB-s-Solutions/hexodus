import type { Metadata } from "next"
import { RoleGuard } from "@/components/auth/role-guard"

export const metadata: Metadata = {
  title: "Membresias",
}

export default function MembresiasLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard modulo="membresias" accion="ver">{children}</RoleGuard>
}
