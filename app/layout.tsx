import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Toaster } from '@/components/ui/toaster'
import { CajaGuard } from '@/components/caja/caja-guard'
import { ThemeProvider } from '@/components/theme-provider-custom'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Cargamos el WebSdk ANTES de que la página sea interactiva */}
        <Script 
          src="/modules/WebSdk/index.js" 
          strategy="beforeInteractive" 
        />
        <ThemeProvider>
          <CajaGuard>
            {children}
          </CajaGuard>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
