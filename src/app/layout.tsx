'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Динамический импорт с отключенным SSR
import dynamic from 'next/dynamic';

// Импорт CartProvider
const CartProviderWithNoSSR = dynamic(
  () => import('@/components/Surf/CartContext').then((mod) => mod.CartProvider),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Vibe Coding - Уникальный курс по современному программированию",
  description: "Присоединяйтесь к нашему уникальному курсу вайб кодинга для создания креативных проектов. Изучайте программирование в атмосфере позитива и творчества.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <CartProviderWithNoSSR>
          {children}
        </CartProviderWithNoSSR>
      </body>
    </html>
  );
}
