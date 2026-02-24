"use client"

import { AuthGuard } from '@/components/auth-guard'

export default function VentasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>
}
