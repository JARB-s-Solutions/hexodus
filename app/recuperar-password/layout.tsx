import type { Metadata } from "next"
import { AuthGuard } from '@/components/auth-guard'

export const metadata: Metadata = {
  title: "Recuperar Password",
}

export default function RecuperarPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>
}
