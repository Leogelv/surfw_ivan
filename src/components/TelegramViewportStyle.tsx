'use client';

import { useEffect } from 'react';

const TelegramViewportStyle = () => {
  useEffect(() => {
    // Проверяем наличие Telegram WebApp в браузере
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      // Устанавливаем CSS-переменные для корректной работы с WebApp
      document.documentElement.style.setProperty('--tg-viewport-height', '100vh');
      document.documentElement.style.setProperty('--tg-viewport-stable-height', '100vh');
    }
  }, []);

  // Этот компонент не рендерит никакой UI
  return null;
};

export default TelegramViewportStyle; 