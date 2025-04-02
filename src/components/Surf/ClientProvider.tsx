'use client';

import dynamic from 'next/dynamic';

// Динамический импорт CartProvider с отключенным SSR
const CartProviderWithNoSSR = dynamic(
  () => import('./CartContext').then((mod) => mod.CartProvider),
  { ssr: false }
);

interface ClientProviderProps {
  children: React.ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <CartProviderWithNoSSR>
      {children}
    </CartProviderWithNoSSR>
  );
}

export default ClientProvider; 