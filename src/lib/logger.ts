/**
 * Утилита для логирования событий приложения с различными уровнями приоритета
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  showTimestamp?: boolean;
  moduleName?: string; 
}

// Дефолтные настройки логирования
const defaultOptions: LogOptions = {
  showTimestamp: true,
  moduleName: 'App'
};

// Стили для разных уровней лога
const logStyles = {
  info: 'color: #4CAF50; font-weight: bold;',
  warn: 'color: #FF9800; font-weight: bold;',
  error: 'color: #F44336; font-weight: bold;',
  debug: 'color: #2196F3; font-weight: bold;',
};

/**
 * Создает логгер для конкретного модуля
 * @param moduleName Имя модуля
 * @returns Объект логгера с методами для разных уровней логирования
 */
export const createLogger = (moduleName: string) => {
  return {
    info: (message: string, data?: any) => log('info', message, { moduleName }, data),
    warn: (message: string, data?: any) => log('warn', message, { moduleName }, data),
    error: (message: string, data?: any) => log('error', message, { moduleName }, data),
    debug: (message: string, data?: any) => log('debug', message, { moduleName }, data),
  };
};

/**
 * Основная функция логирования
 * @param level Уровень логирования
 * @param message Сообщение
 * @param options Опции логирования
 * @param data Дополнительные данные для лога
 */
export const log = (level: LogLevel, message: string, options?: LogOptions, data?: any) => {
  const opts = { ...defaultOptions, ...options };
  const timestamp = opts.showTimestamp ? new Date().toISOString() : '';
  const moduleName = opts.moduleName || 'App';
  
  // Формируем сообщение
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${moduleName}]: ${message}`;
  
  // Выводим лог с соответствующим стилем
  switch (level) {
    case 'info':
      console.log(`%c${formattedMessage}`, logStyles.info, data || '');
      break;
    case 'warn':
      console.warn(`%c${formattedMessage}`, logStyles.warn, data || '');
      break;
    case 'error':
      console.error(`%c${formattedMessage}`, logStyles.error, data || '');
      break;
    case 'debug':
      console.debug(`%c${formattedMessage}`, logStyles.debug, data || '');
      break;
  }
};

// Глобальный экземпляр логгера
const logger = {
  info: (message: string, data?: any) => log('info', message, undefined, data),
  warn: (message: string, data?: any) => log('warn', message, undefined, data),
  error: (message: string, data?: any) => log('error', message, undefined, data),
  debug: (message: string, data?: any) => log('debug', message, undefined, data),
  createLogger,
};

export default logger; 