'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTelegram } from '@/context/TelegramContext';
import { useAuth } from '@/context/AuthContext';
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
  telegramUser?: any;
  supabaseUser?: any;
};

const DebugPanel = ({ logs: propsLogs, telegramUser, supabaseUser }: DebugPanelProps = {}) => {
  const debugLogger = logger.createLogger('DebugPanel');
  const { user: telegramUserContext, initData: telegramInitData } = useTelegram(); 
  const auth = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('console');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState({ connected: false, error: null });
  const MAX_LOGS = 30;
  
  // Проверка соединения с Supabase
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setSupabaseStatus({ connected: false, error: 'Supabase client не инициализирован' as any });
          return;
        }
        
        // Проверяем соединение простым запросом
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
          setSupabaseStatus({ 
            connected: false, 
            error: `Ошибка соединения с Supabase: ${error.message}` as any
          });
        } else {
          setSupabaseStatus({ 
            connected: true, 
            error: null
          });
        }
      } catch (err) {
        setSupabaseStatus({ 
          connected: false, 
          error: `Необработанная ошибка Supabase: ${err instanceof Error ? err.message : String(err)}` as any
        });
      }
    };
    
    if (isExpanded && activeTab === 'auth') {
      checkSupabaseConnection();
    }
  }, [isExpanded, activeTab]);
  
  // Получаем информацию о состоянии авторизации
  useEffect(() => {
    const getAuthState = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setAuthState({ error: 'Supabase client не инициализирован' });
          return;
        }
        
        // Получаем текущую сессию
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Получаем текущего пользователя
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        setAuthState({
          session: sessionData?.session || null,
          user: userData?.user || null,
          sessionError: sessionError?.message || null,
          userError: userError?.message || null,
          contextUser: supabaseUser || null,
          authContext: {
            isLoading: auth?.isLoading || false,
            isAuthenticated: auth?.isAuthenticated || false,
            userData: auth?.userData || null,
            error: auth?.error || null
          }
        });
      } catch (err) {
        setAuthState({ 
          error: `Необработанная ошибка авторизации: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    };
    
    if (isExpanded && activeTab === 'auth') {
      getAuthState();
    }
  }, [isExpanded, activeTab, supabaseUser, auth]);

  // Используем логи из пропсов, если они переданы
  useEffect(() => {
    if (propsLogs?.length) {
      const formattedLogs = propsLogs.map((log, index) => ({
        id: `external-${index}`,
        level: log.level || 'info',
        message: log.message || 'Сообщение отсутствует',
        created_at: log.timestamp || new Date().toISOString(),
        context: log.context || log.data || undefined
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
      // Пытаемся получить initData через SDK
      const sdkData = retrieveLaunchParams();
      
      // Добавляем отладочную информацию о пользователе из контекста и пропсов
      const debugData = {
        ...sdkData,
        userFromContext: telegramUserContext || null,
        userFromProps: telegramUser || null,
        supabaseUser: supabaseUser || null,
        hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
        telegramInitData: telegramInitData || null
      };
      
      return debugData;
    } catch (e) {
      debugLogger.error('Ошибка при получении initData', e);
      return { 
        initData: null, 
        initDataRaw: null, 
        user: null,
        error: e instanceof Error ? e.message : String(e),
        userFromContext: telegramUserContext || null,
        userFromProps: telegramUser || null,
        supabaseUser: supabaseUser || null,
        hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
        telegramInitData: telegramInitData || null
      };
    }
  }, [debugLogger, telegramUserContext, telegramUser, supabaseUser, telegramInitData]);

  // Функция получения логов
  const fetchLogs = async () => {
    // Если у нас есть логи из пропсов, не загружаем из Supabase
    if (propsLogs?.length) {
      return;
    }

    const supabase = getSupabaseClient();
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

  // Функция для получения детализированной информации о подключении суперабэйз
  const getSupabaseInfo = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'не задан';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...' + 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5))
      : 'не задан';
    
    return {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      isClientInitialized: !!getSupabaseClient(),
      connectionStatus: supabaseStatus.connected ? 'Подключено' : 'Не подключено',
      connectionError: supabaseStatus.error,
    };
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
            <button 
              className={`${styles.tabButton} ${activeTab === 'auth' ? styles.active : ''}`}
              onClick={() => setActiveTab('auth')}
            >
              Авторизация
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

            {/* Таб Авторизация */}
            {activeTab === 'auth' && (
              <div className={styles.authTab}>
                <div className={styles.sectionHeader}>
                  <h4>Данные авторизации</h4>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify({
                      supabaseInfo: getSupabaseInfo(),
                      authState
                    }, null, 2))}
                    className={styles.actionButton}
                  >
                    Копировать
                  </button>
                </div>

                {/* Информация о подключении к Supabase */}
                <div className={styles.section}>
                  <h5>Подключение к Supabase</h5>
                  <div className={`${styles.connectionStatus} ${supabaseStatus.connected ? styles.connected : styles.disconnected}`}>
                    Статус: {supabaseStatus.connected ? 'Подключено' : 'Не подключено'}
                  </div>
                  {supabaseStatus.error && (
                    <div className={styles.error}>
                      Ошибка: {supabaseStatus.error}
                    </div>
                  )}
                  <pre className={styles.jsonData}>
                    {JSON.stringify(getSupabaseInfo(), null, 2)}
                  </pre>
                </div>

                {/* Информация о Telegram пользователе */}
                <div className={styles.section}>
                  <h5>Пользователь Telegram</h5>
                  <div className={styles.userStatus}>
                    Статус: {telegramUser ? 'Авторизован' : 'Не авторизован'}
                  </div>
                  <pre className={styles.jsonData}>
                    {JSON.stringify(telegramUser || 'Пользователь не найден', null, 2)}
                  </pre>
                </div>

                {/* Информация о состоянии авторизации */}
                <div className={styles.section}>
                  <h5>Состояние авторизации</h5>
                  <div className={styles.userStatus}>
                    AuthContext: {auth?.isAuthenticated ? 'Авторизован' : 'Не авторизован'}
                  </div>
                  <pre className={styles.jsonData}>
                    {JSON.stringify(authState || 'Данные не доступны', null, 2)}
                  </pre>
                </div>

                {/* Диагностика проблем авторизации */}
                <div className={styles.section}>
                  <h5>Диагностика авторизации</h5>
                  <ul className={styles.diagnosticList}>
                    <li className={telegramUser ? styles.success : styles.error}>
                      {telegramUser ? '✅' : '❌'} Данные пользователя Telegram получены 
                      {telegramUser && ` (ID: ${telegramUser.id})`}
                    </li>
                    <li className={telegramInitData ? styles.success : styles.error}>
                      {telegramInitData ? '✅' : '❌'} InitData Telegram получен
                    </li>
                    <li className={supabaseStatus.connected ? styles.success : styles.error}>
                      {supabaseStatus.connected ? '✅' : '❌'} Соединение с Supabase установлено
                    </li>
                    <li className={authState?.session ? styles.success : styles.error}>
                      {authState?.session ? '✅' : '❌'} Сессия Supabase активна
                    </li>
                    <li className={authState?.user ? styles.success : styles.error}>
                      {authState?.user ? '✅' : '❌'} Пользователь Supabase авторизован
                    </li>
                    <li className={auth?.userData ? styles.success : styles.error}>
                      {auth?.userData ? '✅' : '❌'} Данные пользователя в AuthContext получены
                      {auth?.userData && ` (ID: ${auth.userData.id})`}
                    </li>
                    <li className={(initData && 'tgWebAppData' in initData && initData.tgWebAppData?.user) ? styles.success : styles.error}>
                      {(initData && 'tgWebAppData' in initData && initData.tgWebAppData?.user) ? '✅' : '❌'} Данные пользователя в tgWebAppData
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 