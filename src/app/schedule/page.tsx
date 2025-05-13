'use client';

import ScheduleScreen from '@/components/screens/ScheduleScreen';
import { TelegramProvider } from '@/context/TelegramContext';
import { AuthProvider } from '@/context/AuthContext';

export default function SchedulePage() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <ScheduleScreen />
      </AuthProvider>
    </TelegramProvider>
  );
} 