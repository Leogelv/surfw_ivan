'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

interface LoggingProviderProps {
  children: ReactNode;
  loggerName: string;
  onLogAdded?: (log: LogEntry) => void;
}

/**
 * Компонент для расширенного логирования
 * Выделен из page.tsx для улучшения модульности
 */
const LoggingProvider: React.FC<LoggingProviderProps> = ({ 
  children, 
  loggerName, 
  onLogAdded 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logger = createLogger(loggerName);

  // Расширенное логирование
  useEffect(() => {
    // Храним оригинальные методы
    const originalInfo = logger.info;
    const originalError = logger.error;
    const originalWarn = logger.warn;
    const originalDebug = logger.debug;

    // Функция для добавления лога в состояние
    const addLog = (level: string, message: string, data?: any) => {
      const log = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data
      };
      
      setLogs(prev => {
        // Храним только последние 50 логов для предотвращения утечек памяти
        const newLogs = [log, ...prev.slice(0, 49)];
        
        // Вызываем внешний обработчик, если он предоставлен
        if (onLogAdded) {
          onLogAdded(log);
        }
        
        return newLogs;
      });
    };

    // Переопределяем методы логгера для добавления логов в состояние компонента
    logger.info = (message, data, userId) => {
      addLog('info', message, data);
      return originalInfo.call(logger, message, data, userId);
    };

    logger.error = (message, data, userId) => {
      addLog('error', message, data);
      return originalError.call(logger, message, data, userId);
    };

    logger.warn = (message, data, userId) => {
      addLog('warn', message, data);
      return originalWarn.call(logger, message, data, userId);
    };

    logger.debug = (message, data, userId) => {
      addLog('debug', message, data);
      return originalDebug.call(logger, message, data, userId);
    };

    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      logger.info = originalInfo;
      logger.error = originalError;
      logger.warn = originalWarn;
      logger.debug = originalDebug;
    };
  }, [logger, onLogAdded]);

  return (
    <>{children}</>
  );
};

export default LoggingProvider; 