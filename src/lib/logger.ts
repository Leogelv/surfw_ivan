/**
 * Утилита для логирования событий приложения с различными уровнями приоритета
 * и отправкой логов в Supabase
 */

import { getSupabaseClient } from './supabase';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  showTimestamp?: boolean;
  moduleName?: string; 
  userId?: string;
  sendToSupabase?: boolean;
}

// Дефолтные настройки логирования
const defaultOptions: LogOptions = {
  showTimestamp: true,
  moduleName: 'App',
  sendToSupabase: true
};

// Стили для разных уровней лога
const logStyles = {
  info: 'color: #4CAF50; font-weight: bold;',
  warn: 'color: #FF9800; font-weight: bold;',
  error: 'color: #F44336; font-weight: bold;',
  debug: 'color: #2196F3; font-weight: bold;',
};

/**
 * Отправляет лог в Supabase
 * @param level Уровень логирования
 * @param message Сообщение
 * @param moduleName Имя модуля
 * @param userId ID пользователя (если известен)
 * @param data Дополнительные данные
 */
async function sendLogToSupabase(
  level: LogLevel, 
  message: string, 
  moduleName: string, 
  userId?: string, 
  data?: any
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Проверка подключения к Supabase
    if (!supabase) {
      console.error('Не удалось получить клиент Supabase для логирования');
      return;
    }
    
    // Подготовка данных для вставки
    const logEntry = {
      level,
      message,
      module: moduleName,
      user_id: userId || null,
      data: data || {},
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString()
      }
    };
    
    // Отправка лога в Supabase
    const { error } = await supabase
      .from('logs')
      .insert(logEntry);
    
    if (error) {
      // Выводим ошибку только в консоль, чтобы избежать рекурсивного логирования
      console.error('Ошибка при отправке лога в Supabase:', error);
    }
  } catch (err) {
    console.error('Исключение при отправке лога в Supabase:', err);
  }
}

/**
 * Создает логгер для конкретного модуля
 * @param moduleName Имя модуля
 * @returns Объект логгера с методами для разных уровней логирования
 */
export const createLogger = (moduleName: string) => {
  return {
    info: (message: string, data?: any, userId?: string) => 
      log('info', message, { moduleName, userId }, data),
    warn: (message: string, data?: any, userId?: string) => 
      log('warn', message, { moduleName, userId }, data),
    error: (message: string, data?: any, userId?: string) => 
      log('error', message, { moduleName, userId }, data),
    debug: (message: string, data?: any, userId?: string) => 
      log('debug', message, { moduleName, userId }, data),
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
  
  // Отправляем лог в Supabase, если это включено в опциях
  if (opts.sendToSupabase && typeof window !== 'undefined') {
    sendLogToSupabase(level, message, moduleName, opts.userId, data);
  }
};

// Глобальный экземпляр логгера
const logger = {
  info: (message: string, data?: any, userId?: string) => 
    log('info', message, { userId }, data),
  warn: (message: string, data?: any, userId?: string) => 
    log('warn', message, { userId }, data),
  error: (message: string, data?: any, userId?: string) => 
    log('error', message, { userId }, data),
  debug: (message: string, data?: any, userId?: string) => 
    log('debug', message, { userId }, data),
  createLogger,
};

export default logger; 