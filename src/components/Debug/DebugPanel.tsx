'use client';

import { useEffect, useState, useMemo } from 'react';
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
  logs?: any[];
};

const DebugPanel = ({ logs: propsLogs }: DebugPanelProps = {}) => {
  const debugLogger = logger.createLogger('DebugPanel');
  const { user: telegramUser } = useTelegram();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('console');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_LOGS = 30;
  
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

  // Получаем и мемоизируем данные инициализации
  const initData = useMemo(() => {
    try {
      return retrieveLaunchParams();
    } catch (e) {
      debugLogger.error('Ошибка при получении initData', e);
      return { initData: null, initDataRaw: null, user: null };
    }
  }, [debugLogger]);

  // Функция получения логов
  const fetchLogs = async () => {
    // Если у нас есть логи из пропсов, не загружаем из Supabase
    if (propsLogs?.length) {
      return;
    }

    if (!supabase) {
      setError('Supabase client not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
  };

  // Эффект для загрузки логов при открытии панели
  useEffect(() => {
    if (isExpanded && activeTab === 'console' && !propsLogs?.length) {
      fetchLogs();
    }
  }, [isExpanded, activeTab, propsLogs]);
  
  // Функция для копирования текста в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        debugLogger.info('Скопировано в буфер обмена');
      })
      .catch(err => {
        debugLogger.error('Ошибка при копировании в буфер обмена', err);
      });
  };

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
          
          {/* Табы */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'console' ? styles.active : ''}`}
              onClick={() => setActiveTab('console')}
            >
              Консоль логи
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'initData' ? styles.active : ''}`}
              onClick={() => setActiveTab('initData')}
            >
              Init Data SDK
            </button>
          </div>
          
          {/* Содержимое табов */}
          <div className={styles.tabContent}>
            {/* Таб консоли */}
            {activeTab === 'console' && (
              <div className={styles.consoleTab}>
                <div className={styles.sectionHeader}>
                  <h4>Логи ({logs.length})</h4>
                  <div>
                    <button 
                      onClick={() => fetchLogs()} 
                      disabled={loading || !!propsLogs?.length} 
                      className={styles.actionButton}
                    >
                      {loading ? 'Загрузка...' : 'Обновить'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(logs.map(log => 
                        `[${formatTime(log.created_at)}] [${log.level.toUpperCase()}] ${log.message} ${log.context ? JSON.stringify(log.context) : ''}`
                      ).join('\n'))}
                      className={styles.actionButton}
                    >
                      Копировать
                    </button>
                  </div>
                </div>
                
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
            )}
            
            {/* Таб Init Data */}
            {activeTab === 'initData' && (
              <div className={styles.initDataTab}>
                <div className={styles.sectionHeader}>
                  <h4>InitData из SDK</h4>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(initData, null, 2))}
                    className={styles.actionButton}
                  >
                    Копировать
                  </button>
                </div>
                <pre className={styles.jsonData}>
                  {JSON.stringify(initData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 