import type { Metadata } from "next"
import { AuthGuard } from '@/components/auth-guard'

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>
}
