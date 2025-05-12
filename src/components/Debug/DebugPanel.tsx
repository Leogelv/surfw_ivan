'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTelegram } from '@/context/TelegramContext';
import styles from './DebugPanel.module.css';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import logger from '@/lib/logger';

type LogEntry = {
  id: string;
  level: string;
  message: string;
  created_at: string;
  context?: Record<string, any>;
};

type DebugPanelProps = {
  telegramUser?: any;
  supabaseUser?: any;
  logs?: any[];
};

const DebugPanel = ({ telegramUser: propsTelegramUser, supabaseUser, logs: propsLogs }: DebugPanelProps = {}) => {
  const debugLogger = logger.createLogger('DebugPanel');
  const { user: contextTelegramUser } = useTelegram();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Кэшируем время последнего обновления для предотвращения слишком частых запросов
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  // Ограничиваем количество логов для отображения
  const MAX_LOGS = 20;
  // Минимальный интервал между обновлениями в миллисекундах
  const MIN_REFRESH_INTERVAL = 2000;

  // Используем telegramUser из пропсов, если он передан, в противном случае из контекста
  const telegramUser = propsTelegramUser || contextTelegramUser;

  // Используем логи из пропсов, если они переданы
  useEffect(() => {
    if (propsLogs?.length) {
      const formattedLogs = propsLogs.map((log, index) => ({
        id: `external-${index}`,
        level: log.level || 'info',
        message: log.message || 'Сообщение отсутствует',
        created_at: log.timestamp || new Date().toISOString(),
        context: log.context || undefined
      }));
      setLogs(formattedLogs);
    }
  }, [propsLogs]);

  // Форматируем время для отображения
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Получаем и мемоизируем данные инициализации для предотвращения постоянных перерасчетов
  const initData = useMemo(() => {
    try {
      return retrieveLaunchParams();
    } catch (e) {
      debugLogger.error('Ошибка при получении initData', e);
      return { initData: null, initDataRaw: null, user: null };
    }
  }, [debugLogger]);

  // Мемоизируем информацию о WebApp для предотвращения лишних перерендеров
  const webAppInfo = useMemo(() => {
    if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
      return { available: false };
    }
    
    const webApp = window.Telegram.WebApp;
    return {
      available: true,
      version: webApp.version,
      platform: webApp.platform,
      viewportHeight: webApp.viewportHeight,
      viewportStableHeight: webApp.viewportStableHeight,
      isExpanded: webApp.isExpanded,
      colorScheme: webApp.colorScheme
    };
  }, []);

  // Оптимизированная функция получения логов
  const fetchLogs = useCallback(async () => {
    // Если у нас есть логи из пропсов, не загружаем из Supabase
    if (propsLogs?.length) {
      return;
    }

    if (!supabase) {
      setError('Supabase client not available');
      return;
    }

    // Проверяем, прошло ли достаточно времени с момента последнего обновления
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      debugLogger.debug('Пропуск обновления логов: слишком частые запросы');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastRefreshTime(now);

      const { data, error: fetchError } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_LOGS);

      if (fetchError) {
        debugLogger.error('Ошибка при получении логов', fetchError);
        setError(`Ошибка при получении логов: ${fetchError.message}`);
        return;
      }

      setLogs(data || []);
      debugLogger.debug(`Получено ${data?.length || 0} логов`);
    } catch (e) {
      debugLogger.error('Необработанная ошибка при получении логов', e);
      setError(`Необработанная ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, lastRefreshTime, debugLogger, propsLogs]);

  // Обработчик клика по кнопке обновления
  const handleRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  // Эффект для загрузки логов при изменении refreshCount
  useEffect(() => {
    if (isExpanded && !propsLogs?.length) {
      fetchLogs();
    }
  }, [fetchLogs, refreshCount, isExpanded, propsLogs]);

  // Автоматическое обновление логов с интервалом только когда панель открыта
  useEffect(() => {
    if (!isExpanded || propsLogs?.length) return;
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // 5 секунд между автоматическими обновлениями
    
    return () => clearInterval(interval);
  }, [isExpanded, fetchLogs, propsLogs]);

  return (
    <div className={styles.debugPanel}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Скрыть отладку' : 'Показать отладку'}
      </button>
      
      {isExpanded && (
        <div className={styles.content}>
          <h3>Отладочная информация</h3>
          
          <div className={styles.section}>
            <h4>Пользователь Telegram</h4>
            {telegramUser ? (
              <div>
                <p>ID: {telegramUser.id}</p>
                <p>Имя: {telegramUser.first_name} {telegramUser.last_name}</p>
                <p>Username: {telegramUser.username || 'не указан'}</p>
                {telegramUser.photo_url && (
                  <div>
                    <p>Фото URL: {telegramUser.photo_url}</p>
                    <img 
                      src={telegramUser.photo_url} 
                      alt="User avatar" 
                      className={styles.avatar}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                        target.onerror = null;
                        debugLogger.warn('Ошибка при загрузке аватара пользователя');
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p>Пользователь не найден</p>
            )}
          </div>

          {supabaseUser && (
            <div className={styles.section}>
              <h4>Пользователь Supabase</h4>
              <div>
                <p>ID: {supabaseUser.id}</p>
                <p>Telegram ID: {supabaseUser.telegram_id}</p>
                <p>Имя: {supabaseUser.first_name} {supabaseUser.last_name}</p>
                <p>Username: {supabaseUser.username || 'не указан'}</p>
              </div>
            </div>
          )}
          
          <div className={styles.section}>
            <h4>InitData из SDK</h4>
            <pre>
              {JSON.stringify(
                {
                  hasInitData: !!initData.initData,
                  hasInitDataRaw: !!initData.initDataRaw,
                  hasUser: !!initData.user
                },
                null,
                2
              )}
            </pre>
          </div>
          
          <div className={styles.section}>
            <h4>Информация о WebApp</h4>
            <pre>
              {JSON.stringify(webAppInfo, null, 2)}
            </pre>
          </div>
          
          <div className={styles.section}>
            <h4>
              Логи ({logs.length})
              <button 
                onClick={handleRefresh} 
                disabled={loading || !!propsLogs?.length} 
                className={styles.refreshButton}
              >
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
            </h4>
            
            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.logs}>
              {logs.map((log) => (
                <div key={log.id} className={`${styles.logEntry} ${styles[log.level]}`}>
                  <span className={styles.timestamp}>{formatTime(log.created_at)}</span>
                  <span className={styles.level}>[{log.level.toUpperCase()}]</span>
                  <span className={styles.message}>{log.message}</span>
                  {log.context && (
                    <pre className={styles.context}>
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              
              {logs.length === 0 && !loading && <p>Нет доступных логов</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 