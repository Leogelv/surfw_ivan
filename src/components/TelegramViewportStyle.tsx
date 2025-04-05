'use client';

import { useEffect } from 'react';

const TelegramViewportStyle = () => {
  useEffect(() => {
    // Функция для проверки наличия Telegram WebApp
    const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
    
    if (isTelegramWebApp) {
      // Устанавливаем переменные только если приложение запущено в Telegram
      document.documentElement.style.setProperty('--tg-viewport-height', '100vh');
      document.documentElement.style.setProperty('--tg-viewport-stable-height', '100vh');
    }
  }, []);

  // Этот компонент не рендерит никакой UI
  return null;
};

export default TelegramViewportStyle; 