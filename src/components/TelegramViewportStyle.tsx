'use client';

import { useEffect } from 'react';
import { init } from '@telegram-apps/sdk';
import logger from '@/lib/logger';

const TelegramViewportStyle = () => {
  const viewportLogger = logger.createLogger('TelegramViewport');

  useEffect(() => {
    // Инициализируем SDK Telegram Mini Apps
    try {
      init();
      viewportLogger.info('Telegram Mini Apps SDK успешно инициализирован');
    } catch (error) {
      viewportLogger.error('Ошибка при инициализации Telegram Mini Apps SDK', error);
    }

    // Проверяем наличие Telegram WebApp в браузере
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Запрашиваем fullscreen для приложения
      try {
        webApp.expand();
        viewportLogger.info('Telegram WebApp переведен в fullscreen режим');
      } catch (error) {
        viewportLogger.warn('Не удалось перевести WebApp в fullscreen режим', error);
      }

      // Устанавливаем CSS-переменные для корректной работы с WebApp
      document.documentElement.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${webApp.viewportStableHeight}px`);
      
      // Устанавливаем CSS-переменные для safeAreaInsets
      if (webApp.safeAreaInset) {
        document.documentElement.style.setProperty('--tg-safe-area-top', `${webApp.safeAreaInset.top}px`);
        document.documentElement.style.setProperty('--tg-safe-area-right', `${webApp.safeAreaInset.right}px`);
        document.documentElement.style.setProperty('--tg-safe-area-bottom', `${webApp.safeAreaInset.bottom}px`);
        document.documentElement.style.setProperty('--tg-safe-area-left', `${webApp.safeAreaInset.left}px`);
        viewportLogger.debug('Установлены CSS-переменные для safeAreaInsets', webApp.safeAreaInset);
      }

      // Устанавливаем CSS-переменные для contentSafeAreaInsets
      if (webApp.contentSafeAreaInset) {
        document.documentElement.style.setProperty('--tg-content-safe-area-top', `${webApp.contentSafeAreaInset.top}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-right', `${webApp.contentSafeAreaInset.right}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${webApp.contentSafeAreaInset.bottom}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-left', `${webApp.contentSafeAreaInset.left}px`);
        viewportLogger.debug('Установлены CSS-переменные для contentSafeAreaInsets', webApp.contentSafeAreaInset);
      }
      
      // Сигнализируем, что приложение готово к отображению
      try {
        webApp.ready();
        viewportLogger.info('Отправлен сигнал ready в Telegram WebApp');
      } catch (error) {
        viewportLogger.error('Ошибка при отправке сигнала ready', error);
      }
    } else {
      // Значения по умолчанию, если WebApp не доступен
      document.documentElement.style.setProperty('--tg-viewport-height', '100vh');
      document.documentElement.style.setProperty('--tg-viewport-stable-height', '100vh');
      document.documentElement.style.setProperty('--tg-safe-area-top', '50px');
      document.documentElement.style.setProperty('--tg-safe-area-right', '0px');
      document.documentElement.style.setProperty('--tg-safe-area-bottom', '0px');
      document.documentElement.style.setProperty('--tg-safe-area-left', '0px');
      document.documentElement.style.setProperty('--tg-content-safe-area-top', '55px');
      document.documentElement.style.setProperty('--tg-content-safe-area-right', '0px');
      document.documentElement.style.setProperty('--tg-content-safe-area-bottom', '0px');
      document.documentElement.style.setProperty('--tg-content-safe-area-left', '0px');
      viewportLogger.warn('Telegram WebApp не обнаружен, установлены значения по умолчанию');
    }
  }, [viewportLogger]);

  // Этот компонент не рендерит никакой UI
  return null;
};

export default TelegramViewportStyle; 