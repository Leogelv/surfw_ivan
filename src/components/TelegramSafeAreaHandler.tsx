'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

interface TelegramSafeAreaHandlerProps {
  onContentSafeAreaChanged: (safeArea: { top: number; right: number; bottom: number; left: number }) => void;
}

/**
 * Компонент для обработки событий изменения safe area в Telegram
 * Выделен из page.tsx для улучшения модульности
 */
const TelegramSafeAreaHandler: React.FC<TelegramSafeAreaHandlerProps> = ({ 
  onContentSafeAreaChanged
}) => {
  const logger = createLogger('TelegramSafeAreaHandler');

  // Установка обработчика для события content_safe_area_changed
  useEffect(() => {
    // Проверка, что мы в клиентском окружении
    if (typeof window === 'undefined') return;

    const handleContentSafeAreaChanged = (event: any) => {
      try {
        // Для событий из web версии Telegram, которые приходят через window.postMessage
        if (event.data && typeof event.data === 'string') {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.eventType === 'content_safe_area_changed') {
              logger.info('Получены данные о безопасной зоне контента из web', eventData.eventData);
              onContentSafeAreaChanged(eventData.eventData);
            }
          } catch (e) {
            // Игнорируем ошибки парсинга для сообщений, которые не являются JSON
          }
        } else if (event.eventType === 'content_safe_area_changed') {
          // Для событий из мобильных приложений
          logger.info('Получены данные о безопасной зоне контента из мобильного приложения', event.eventData);
          onContentSafeAreaChanged(event.eventData);
        }
      } catch (error) {
        logger.error('Ошибка при обработке события content_safe_area_changed', error);
      }
    };

    // Добавляем обработчик события для веб-версии
    window.addEventListener('message', handleContentSafeAreaChanged);

    // Возвращаем функцию очистки
    return () => {
      window.removeEventListener('message', handleContentSafeAreaChanged);
    };
  }, [onContentSafeAreaChanged, logger]);

  return null; // Компонент не рендерит UI, только обрабатывает события
};

export default TelegramSafeAreaHandler; 