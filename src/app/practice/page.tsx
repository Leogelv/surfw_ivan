'use client';

import PracticeSelectionScreen from '@/components/screens/PracticeSelectionScreen';
import { TelegramProvider } from '@/context/TelegramContext';
import { AuthProvider } from '@/context/AuthContext';

export default function PracticePage() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <PracticeSelectionScreen />
      </AuthProvider>
    </TelegramProvider>
  );
} 