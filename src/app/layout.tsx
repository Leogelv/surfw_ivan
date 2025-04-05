import './globals.css'
import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import Script from 'next/script'
import { TelegramProvider } from '@/context/TelegramContext'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebasNeue = Bebas_Neue({ weight: ['400'], subsets: ['latin'], variable: '--font-bebas-neue' })

// Динамически импортируем клиентский компонент для CSS-переменных
const TelegramViewportStyle = dynamic(() => import('@/components/TelegramViewportStyle'), {
  ssr: false
});

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
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans`}>
        <TelegramProvider>
          <TelegramViewportStyle />
          {children}
        </TelegramProvider>
      </body>
    </html>
  )
}
