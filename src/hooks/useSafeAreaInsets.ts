import { useState, useEffect } from 'react';
import { useTelegram } from '../context/TelegramContext';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Хук для получения значений Safe Area Insets из Telegram WebApp
 * Документация: https://core.telegram.org/bots/webapps#safeareainset
 */
const useSafeAreaInsets = (): SafeAreaInsets => {
  const { webApp } = useTelegram();
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    // Проверяем наличие Telegram WebApp и поддержки SafeAreaInsets
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      
      // Получаем саму safe area, если она доступна
      if (tgWebApp.safeAreaInset) {
        setInsets({
          top: tgWebApp.safeAreaInset.top || 0,
          bottom: tgWebApp.safeAreaInset.bottom || 0,
          left: tgWebApp.safeAreaInset.left || 0,
          right: tgWebApp.safeAreaInset.right || 0
        });
      } else {
        // Читаем CSS переменные, если доступны
        const computedStyle = getComputedStyle(document.documentElement);
        const cssTop = parseInt(computedStyle.getPropertyValue('--tg-safe-area-inset-top') || '0', 10);
        const cssBottom = parseInt(computedStyle.getPropertyValue('--tg-safe-area-inset-bottom') || '0', 10);
        const cssLeft = parseInt(computedStyle.getPropertyValue('--tg-safe-area-inset-left') || '0', 10);
        const cssRight = parseInt(computedStyle.getPropertyValue('--tg-safe-area-inset-right') || '0', 10);
        
        if (cssTop || cssBottom || cssLeft || cssRight) {
          setInsets({
            top: cssTop,
            bottom: cssBottom,
            left: cssLeft,
            right: cssRight
          });
        }
      }
    }
  }, [webApp]);

  return insets;
};

export default useSafeAreaInsets; 