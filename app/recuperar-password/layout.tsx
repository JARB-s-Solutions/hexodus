"use client"

import { AuthGuard } from '@/components/auth-guard'

export default function RecuperarPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard requireAuth={false}>{children}</AuthGuard>
}
