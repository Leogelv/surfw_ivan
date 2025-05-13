'use client';

import LibraryScreen from '@/components/screens/LibraryScreen';
import { TelegramProvider } from '@/context/TelegramContext';
import { AuthProvider } from '@/context/AuthContext';

export default function LibraryPage() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <LibraryScreen />
      </AuthProvider>
    </TelegramProvider>
  );
} 