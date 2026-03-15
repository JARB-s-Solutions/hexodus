import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Toaster } from '@/ui/toaster'
import { CajaGuard } from '@/components/caja/caja-guard'
import { ThemeProvider } from '@/components/theme-provider-custom'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { ForbiddenToast } from '@/components/auth/forbidden-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Hexodus',
    template: 'Hexodus | %s',
  },
  description: 'Sistema de gestion integral para gimnasio - Hexodus',
  icons: {
    icon: '/assets/images/icon.ico',
    shortcut: '/assets/images/icon.ico',
    apple: '/assets/images/icon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#101014',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {/* Cargamos el WebSdk ANTES de que la página sea interactiva */}
        <Script 
          src="/modules/WebSdk/index.js" 
          strategy="beforeInteractive" 
        />
        <ThemeProvider>
          <AuthProvider>
            <CajaGuard>
              {children}
            </CajaGuard>
            <ForbiddenToast />
            <Toaster />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
