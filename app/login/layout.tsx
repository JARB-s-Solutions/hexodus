import type { Metadata } from "next"
import { AuthGuard } from '@/components/auth-guard'

export const metadata: Metadata = {
  title: "Iniciar Sesion",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>
}
