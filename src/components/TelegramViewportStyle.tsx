'use client';

import { useEffect } from 'react';
import { init, retrieveLaunchParams, postEvent } from '@telegram-apps/sdk';
import logger from '@/lib/logger';

// Define interface for Telegram user
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  auth_date?: string;
}

// Интерфейс для безопасной зоны контента
interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const TelegramViewportStyle = () => {
  const viewportLogger = logger.createLogger('TelegramViewport');

  useEffect(() => {
    // Инициализируем SDK Telegram Mini Apps
    try {
      init();
      viewportLogger.info('Telegram Mini Apps SDK успешно инициализирован');
      
      // Получаем и логируем инициализационные данные
      try {
        const { initData, initDataRaw, user } = retrieveLaunchParams();
        const telegramUser = user as TelegramUser;
        viewportLogger.info('Получены параметры запуска', { 
          hasInitData: !!initData, 
          hasInitDataRaw: !!initDataRaw,
          hasUser: !!telegramUser,
          userPhotoUrl: telegramUser?.photo_url || 'не указан' 
        });
      } catch (launchError) {
        viewportLogger.error('Ошибка при получении параметров запуска', launchError);
      }
    } catch (error) {
      viewportLogger.error('Ошибка при инициализации Telegram Mini Apps SDK', error);
    }

    // Проверяем наличие Telegram WebApp в браузере
    const telegramWebApp = typeof window !== 'undefined' && 
                          window.Telegram && 
                          window.Telegram.WebApp;
                          
    if (telegramWebApp) {
      const webApp = telegramWebApp;
      
      // Запрашиваем fullscreen для приложения
      try {
        // Используем новый метод web_app_request_fullscreen через SDK
        try {
          viewportLogger.info('Запрос на полноэкранный режим через web_app_request_fullscreen');
          // Пробуем использовать новый метод postEvent для запроса на полноэкранный режим
          postEvent('web_app_request_fullscreen');
          viewportLogger.info('Метод web_app_request_fullscreen вызван успешно');
          
          // Проверяем, был ли успешно выполнен запрос полноэкранного режима
          setTimeout(() => {
            if (webApp.isExpanded) {
              viewportLogger.info('Переход в полноэкранный режим успешно выполнен');
            } else {
              viewportLogger.warn('Метод web_app_request_fullscreen не привел к переходу в полноэкранный режим, пробуем запасной метод');
              try {
                webApp.expand();
                viewportLogger.info('Запасной метод webApp.expand() успешно вызван');
              } catch (expandError) {
                viewportLogger.error('Ошибка при вызове запасного метода webApp.expand()', expandError);
              }
            }
          }, 500); // Проверяем через 500 мс, чтобы дать время на переключение режима
          
        } catch (fullscreenError) {
          viewportLogger.warn('Ошибка при вызове web_app_request_fullscreen, переключаемся на webApp.expand()', fullscreenError);
          
          // Проверяем, доступен ли метод expand в текущей версии WebApp
          if (typeof webApp.expand === 'function') {
            webApp.expand();
            viewportLogger.info('Использован запасной метод webApp.expand() для перехода в полноэкранный режим');
          } else {
            viewportLogger.error('Метод webApp.expand() недоступен в текущей версии WebApp');
          }
        }
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
      
      // Настройка дополнительных параметров Telegram WebApp
      try {
        // Запрашиваем информацию о content safe area
        postEvent('web_app_request_content_safe_area');
        viewportLogger.info('Запрошена информация о content safe area');
        
        // Обработчик события content_safe_area_changed устанавливается через SDK
        // При получении события значения будут обновлены автоматически
        
        // Отключаем вертикальные свайпы для закрытия
        postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
        viewportLogger.info('Вертикальные свайпы для закрытия приложения отключены');
        
        // Включаем подтверждение при закрытии
        postEvent('web_app_setup_closing_behavior', { need_confirmation: true });
        viewportLogger.info('Включено подтверждение при закрытии приложения');
      } catch (setupError) {
        viewportLogger.error('Ошибка при настройке дополнительных параметров Telegram WebApp', setupError);
      }
      
      // Функция для обработки события изменения content safe area
      const handleContentSafeAreaChanged = (event: any) => {
        try {
          const eventData = JSON.parse(event.data);
          if (eventData && eventData.eventType === 'content_safe_area_changed') {
            const { top, right, bottom, left } = eventData.eventData;
            
            // Устанавливаем CSS переменные
            document.documentElement.style.setProperty('--tg-content-safe-area-top', `${top}px`);
            document.documentElement.style.setProperty('--tg-content-safe-area-right', `${right}px`);
            document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${bottom}px`);
            document.documentElement.style.setProperty('--tg-content-safe-area-left', `${left}px`);
            
            viewportLogger.info('Обновлены значения content safe area', { top, right, bottom, left });
          }
        } catch (error) {
          // Игнорируем ошибки парсинга для сообщений, которые не относятся к нашему событию
        }
      };
      
      // Добавляем обработчик события message для веб-версии
      window.addEventListener('message', handleContentSafeAreaChanged);
      
      // Сигнализируем, что приложение готово к отображению
      try {
        webApp.ready();
        viewportLogger.info('Отправлен сигнал ready в Telegram WebApp');
      } catch (error) {
        viewportLogger.error('Ошибка при отправке сигнала ready', error);
      }
      
      // Очистка при размонтировании
      return () => {
        window.removeEventListener('message', handleContentSafeAreaChanged);
      };
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