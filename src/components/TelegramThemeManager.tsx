'use client';

import { useEffect } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import { 
  setTelegramThemeVariables, 
  setContentSafeAreaVariables, 
  setTelegramHeaderVariables 
} from '@/lib/cssUtils';
import { createLogger } from '@/lib/logger';

interface TelegramThemeManagerProps {
  contentSafeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Компонент для управления темой и стилями Telegram
 * Выделен из page.tsx для улучшения модульности
 */
const TelegramThemeManager: React.FC<TelegramThemeManagerProps> = ({ contentSafeArea }) => {
  const { 
    isFullScreenEnabled, 
    webApp, 
    telegramHeaderPadding 
  } = useTelegram();
  
  const logger = createLogger('TelegramThemeManager');

  // Устанавливаем параметры темы из Telegram WebApp
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Получаем параметры темы из WebApp
      const themeParams = webApp?.themeParams || 
        (typeof window !== 'undefined' ? window.Telegram?.WebApp?.themeParams : null);
      
      if (themeParams) {
        logger.info('Применяем параметры темы', themeParams);
        setTelegramThemeVariables(themeParams);
      }
    } catch (e) {
      logger.error('Ошибка при установке параметров темы', e);
    }
  }, [webApp, logger]);

  // Применяем необходимые отступы и настройки для Telegram
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      if (isFullScreenEnabled) {
        // Устанавливаем отступ сверху для области под заголовком Telegram
        const topPadding = Math.max(telegramHeaderPadding, contentSafeArea.top);
        
        logger.debug('Установка отступов для Telegram', {
          topPadding,
          contentSafeArea,
          telegramHeaderPadding,
          safeAreaInset: webApp?.safeAreaInset
        });
        
        // Устанавливаем переменные для отступов заголовка
        setTelegramHeaderVariables(true, topPadding);
        
        // Устанавливаем CSS-переменные для contentSafeArea
        setContentSafeAreaVariables(contentSafeArea);
      } else {
        // Сбрасываем все CSS переменные, если не в полноэкранном режиме
        setTelegramHeaderVariables(false, 0);
        setContentSafeAreaVariables({ top: 0, right: 0, bottom: 0, left: 0 });
        
        logger.debug('Сброшены отступы для Telegram (не в полноэкранном режиме)');
      }
    } catch (e) {
      logger.error('Ошибка при установке отступов Telegram', e);
    }
  }, [isFullScreenEnabled, telegramHeaderPadding, contentSafeArea, webApp, logger]);

  // Устанавливаем обработчик для события theme_changed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleThemeChanged = (event: any) => {
      try {
        // Для событий из web версии Telegram, которые приходят через window.postMessage
        if (event.data && typeof event.data === 'string') {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.eventType === 'theme_changed') {
              const themeParams = eventData.eventData;
              logger.info('Получены данные о теме из web', themeParams);
              
              // Применяем параметры темы
              setTelegramThemeVariables(themeParams);
            }
          } catch (e) {
            // Игнорируем ошибки парсинга для сообщений, которые не являются JSON
          }
        } else if (event.eventType === 'theme_changed') {
          // Для событий из мобильных приложений
          const themeParams = event.eventData;
          logger.info('Получены данные о теме из мобильного приложения', themeParams);
          
          // Применяем параметры темы
          setTelegramThemeVariables(themeParams);
        }
      } catch (error) {
        logger.error('Ошибка при обработке события theme_changed', error);
      }
    };

    // Добавляем обработчик события для веб-версии
    window.addEventListener('message', handleThemeChanged);

    // Возвращаем функцию очистки
    return () => {
      window.removeEventListener('message', handleThemeChanged);
    };
  }, [logger]);

  return null; // Компонент не рендерит UI, только применяет стили
};

export default TelegramThemeManager; 