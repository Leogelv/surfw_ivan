import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { TelegramProvider } from '@/context/TelegramContext'
import TelegramViewportStyle from '@/components/TelegramViewportStyle'

// Используем только Inter, убираем Bebas_Neue
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Surf Coffee',
  description: 'Мобильное приложение Surf Coffee',
  themeColor: '#0A0908'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <TelegramProvider>
          <TelegramViewportStyle />
          {children}
        </TelegramProvider>
      </body>
    </html>
  )
}
