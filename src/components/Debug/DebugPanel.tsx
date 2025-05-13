'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTelegram } from '@/context/TelegramContext';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
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

// Добавляем интерфейсы для более структурированного состояния
interface SystemStatus {
  ok: boolean;
  message: string;
  details?: any;
}

interface TelegramHealth {
  sdkInitialized: SystemStatus;
  userRetrieved: SystemStatus;
  initDataRetrieved: SystemStatus;
  webAppAvailable: SystemStatus;
  fullscreen: SystemStatus;
  safeArea: SystemStatus;
  themeParams: SystemStatus;
}

interface SupabaseHealth {
  clientInitialized: SystemStatus;
  connection: SystemStatus;
  envVars: SystemStatus;
}

interface AuthHealth {
  authContextLoaded: SystemStatus;
  supabaseSession: SystemStatus;
  supabaseUser: SystemStatus;
  publicUserLoaded: SystemStatus; // Пользователь из public.users в AuthContext
}

interface AppHealth {
  userStats: SystemStatus;
  // Можно добавить другие специфичные для приложения проверки
}

const DebugPanel = ({ logs: propsLogs, telegramUser: telegramUserFromProps, supabaseUser: supabaseUserFromProps }: DebugPanelProps = {}) => {
  const debugLogger = logger.createLogger('DebugPanel');
  const { 
    user: telegramUserContext, 
    initData: telegramInitDataContext, 
    webApp, 
    isFullScreenEnabled,
    telegramHeaderPadding 
  } = useTelegram();
  const auth = useAuth(); // AuthContext
  const { stats: userStats, isLoading: statsLoading } = useUserStats(); // Предполагается, что хук useUserStats существует

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('health'); // По умолчанию открываем новую вкладку
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для детальной информации, используемой в существующих вкладках
  const [currentAuthStateDetails, setCurrentAuthStateDetails] = useState<any>(null);
  const [currentSupabaseConnectionDetails, setCurrentSupabaseConnectionDetails] = useState({ connected: false, error: null });
  
  const MAX_LOGS = 30;

  // --- Ключевые состояния для вкладки "Обзор Здоровья Системы" ---
  const [telegramHealth, setTelegramHealth] = useState<TelegramHealth | null>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth | null>(null);
  const [authHealth, setAuthHealth] = useState<AuthHealth | null>(null);
  const [appHealth, setAppHealth] = useState<AppHealth | null>(null);
  const [overallSystemStatus, setOverallSystemStatus] = useState<SystemStatus>({ ok: false, message: "Проверка..." });

  // Функция для генерации статусного объекта
  const generateStatus = (ok: boolean, message: string, details?: any): SystemStatus => ({ ok, message, details });

  // Функция для обновления всех показателей здоровья
  const refreshHealthChecks = async () => {
    debugLogger.info("Запуск обновления показателей здоровья системы...");

    // 1. Telegram Health
    let tgSdkInitStatus: SystemStatus;
    let tgUserStatus: SystemStatus;
    let tgInitDataStatus: SystemStatus;
    let tgWebAppStatus: SystemStatus;
    let tgFullscreenStatus: SystemStatus;
    let tgSafeAreaStatus: SystemStatus;
    let tgThemeParamsStatus: SystemStatus;

    try {
      const launchParams = retrieveLaunchParams();
      tgSdkInitStatus = generateStatus(true, "SDK параметры запуска получены", launchParams);
      
      if (launchParams && launchParams.initData && typeof launchParams.initData === 'object' && 'user' in launchParams.initData && launchParams.initData.user) {
        const tgUserFromSDK = launchParams.initData.user as any; // Приведение типа, если необходимо, для доступа к id
        tgUserStatus = generateStatus(true, `Пользователь TG получен из SDK: ${tgUserFromSDK.id}`, tgUserFromSDK);
      } else if (telegramUserContext) {
        tgUserStatus = generateStatus(true, `Пользователь TG из контекста: ${telegramUserContext.id}`, telegramUserContext);
      } else {
        tgUserStatus = generateStatus(false, "Пользователь Telegram не найден ни в SDK, ни в контексте");
      }
      
      tgInitDataStatus = telegramInitDataContext 
        ? generateStatus(true, "InitData из контекста доступно", { length: telegramInitDataContext.length })
        : generateStatus(false, "InitData из контекста отсутствует");
        
    } catch (e: any) {
      tgSdkInitStatus = generateStatus(false, "Ошибка получения параметров запуска SDK", e.message);
      tgUserStatus = generateStatus(false, "Пользователь Telegram не может быть получен из-за ошибки SDK (catch)");
      tgInitDataStatus = generateStatus(false, "InitData не может быть получено из-за ошибки SDK (catch)");
    }

    tgWebAppStatus = (typeof window !== 'undefined' && window.Telegram?.WebApp)
      ? generateStatus(true, "Telegram.WebApp объект доступен", { version: window.Telegram.WebApp.version, platform: window.Telegram.WebApp.platform })
      : generateStatus(false, "Telegram.WebApp объект НЕ доступен");

    tgFullscreenStatus = generateStatus(isFullScreenEnabled, isFullScreenEnabled ? "Включен" : "Выключен или не поддерживается");
    
    const sa = webApp?.safeAreaInset || (typeof window !== 'undefined' && window.Telegram?.WebApp?.isExpanded ? {top: telegramHeaderPadding, bottom:0, left:0, right:0} : null);
    tgSafeAreaStatus = sa 
        ? generateStatus(true, `Top: ${sa.top}, Bottom: ${sa.bottom}`, sa)
        : generateStatus(false, "SafeArea не определена");

    const theme = webApp?.themeParams || (typeof window !== 'undefined' ? window.Telegram?.WebApp?.themeParams : null);
    tgThemeParamsStatus = theme 
        ? generateStatus(true, `Цвет фона: ${theme.bg_color}`, theme)
        : generateStatus(false, "Параметры темы не определены");

    setTelegramHealth({
      sdkInitialized: tgSdkInitStatus,
      userRetrieved: tgUserStatus,
      initDataRetrieved: tgInitDataStatus,
      webAppAvailable: tgWebAppStatus,
      fullscreen: tgFullscreenStatus,
      safeArea: tgSafeAreaStatus,
      themeParams: tgThemeParamsStatus,
    });

    // 2. Supabase Health
    const supabase = getSupabaseClient();
    const sbClientStatus = supabase 
        ? generateStatus(true, "Клиент инициализирован") 
        : generateStatus(false, "Клиент НЕ инициализирован. Проверьте URL/KEY в .env и консоль браузера.");
    
    let sbConnectionStatus: SystemStatus;
    if (supabase) {
        try {
            const { error } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
            sbConnectionStatus = error 
                ? generateStatus(false, `Ошибка соединения: ${error.message}`, error) 
                : generateStatus(true, "Соединение успешно (тестовый запрос к 'users')");
        } catch (e: any) {
            sbConnectionStatus = generateStatus(false, "Исключение при проверке соединения", e.message);
        }
    } else {
        sbConnectionStatus = generateStatus(false, "Соединение не может быть проверено (клиент не инициализирован)");
    }
    setCurrentSupabaseConnectionDetails({connected: sbConnectionStatus.ok, error: sbConnectionStatus.ok ? null : sbConnectionStatus.details || sbConnectionStatus.message } as any);


    const sbEnvStatus = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-url.supabase.co' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key')
        ? generateStatus(true, "URL и ANON_KEY заданы", { url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,20)+'...', keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY})
        : generateStatus(false, "URL и/или ANON_KEY НЕ заданы или имеют значения по умолчанию!");
        
    setSupabaseHealth({
      clientInitialized: sbClientStatus,
      connection: sbConnectionStatus,
      envVars: sbEnvStatus,
    });

    // 3. Auth Health
    const ahAuthContextStatus = auth 
        ? generateStatus(true, `Загрузка: ${auth.isLoading}, Аутентифицирован: ${auth.isAuthenticated}`, { error: auth.error })
        : generateStatus(false, "AuthContext не доступен");

    let ahSupabaseSessionStatus: SystemStatus;
    let ahSupabaseUserStatus: SystemStatus;

    if (supabase) {
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            ahSupabaseSessionStatus = sessionError 
                ? generateStatus(false, `Ошибка получения сессии: ${sessionError.message}`, sessionError)
                : (sessionData.session ? generateStatus(true, "Сессия активна", sessionData.session) : generateStatus(false, "Сессия отсутствует"));
            
            const { data: userAuthData, error: userAuthError } = await supabase.auth.getUser();
            ahSupabaseUserStatus = userAuthError
                ? generateStatus(false, `Ошибка получения пользователя Supabase Auth: ${userAuthError.message}`, userAuthError)
                : (userAuthData.user ? generateStatus(true, `Auth User ID: ${userAuthData.user.id}`, userAuthData.user) : generateStatus(false, "Supabase Auth User отсутствует"));
            
            // Обновляем детали для вкладки "Авторизация"
            setCurrentAuthStateDetails({
                session: sessionData?.session || null,
                user: userAuthData?.user || null,
                sessionError: sessionError?.message || null,
                userError: userAuthError?.message || null,
                contextUser: supabaseUserFromProps || null, // Используем пропс, если есть
                authContext: { // Данные из нашего AuthContext
                    isLoading: auth?.isLoading || false,
                    isAuthenticated: auth?.isAuthenticated || false,
                    userData: auth?.userData || null, // Данные из public.users
                    error: auth?.error || null
                }
            });

        } catch (e: any) {
            ahSupabaseSessionStatus = generateStatus(false, "Исключение при проверке сессии/пользователя Supabase Auth", e.message);
            ahSupabaseUserStatus = generateStatus(false, "Исключение при проверке сессии/пользователя Supabase Auth", e.message);
            setCurrentAuthStateDetails({ error: e.message });
        }
    } else {
        ahSupabaseSessionStatus = generateStatus(false, "Проверка сессии Supabase Auth невозможна (клиент не инициализирован)");
        ahSupabaseUserStatus = generateStatus(false, "Проверка пользователя Supabase Auth невозможна (клиент не инициализирован)");
        setCurrentAuthStateDetails({ error: "Клиент Supabase не инициализирован для проверки Auth" });
    }
    
    const ahPublicUserStatus = auth?.userData 
        ? generateStatus(true, `Данные из public.users загружены (ID: ${auth.userData.id})`, auth.userData)
        : generateStatus(auth?.isLoading ? true : false, auth?.isLoading ? "Загрузка public.users..." : (auth?.error ? `Ошибка загрузки public.users: ${auth.error}`: "Данные из public.users не загружены"), {error: auth?.error});

    setAuthHealth({
      authContextLoaded: ahAuthContextStatus,
      supabaseSession: ahSupabaseSessionStatus,
      supabaseUser: ahSupabaseUserStatus,
      publicUserLoaded: ahPublicUserStatus,
    });

    // 4. App Health
    const appUserStatsStatus = statsLoading 
        ? generateStatus(true, "Статистика пользователя загружается...")
        : (userStats ? generateStatus(true, "Статистика пользователя загружена", userStats) : generateStatus(false, "Статистика пользователя не загружена"));
    
    setAppHealth({
        userStats: appUserStatsStatus,
    });

    // 5. Overall System Status
    const isHealthy = tgSdkInitStatus.ok && tgUserStatus.ok && tgWebAppStatus.ok &&
                      sbClientStatus.ok && sbConnectionStatus.ok && sbEnvStatus.ok &&
                      ahAuthContextStatus.ok && ahSupabaseSessionStatus.ok && ahSupabaseUserStatus.ok && ahPublicUserStatus.ok &&
                      appUserStatsStatus.ok;
    const overallMessage = isHealthy ? "Система в порядке" : "Обнаружены проблемы";
    setOverallSystemStatus(generateStatus(isHealthy, overallMessage));
    debugLogger.info("Обновление показателей здоровья системы завершено.", { isHealthy });
  };

  // Первоначальная загрузка и при изменении активной вкладки на 'health' или 'auth'
  useEffect(() => {
    if (isExpanded && (activeTab === 'health' || activeTab === 'auth')) {
      refreshHealthChecks(); // Эта функция готовит currentAuthStateDetails и currentSupabaseConnectionDetails
    }
  }, [isExpanded, activeTab]);


  // --- Логика для существующих вкладок (немного адаптированная) ---
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

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    } catch (e) { return 'Invalid date'; }
  };

  const memoizedTgInitDataForDisplay = useMemo(() => { // Переименовано, чтобы не конфликтовать с переменной контекста
    try {
      const sdkData = retrieveLaunchParams();
      return {
        ...sdkData,
        userFromContext: telegramUserContext || null,
        userFromProps: telegramUserFromProps || null, // Используем пропс
        supabaseUserFromContext: auth?.userData || null, // Данные из public.users
        hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
        telegramInitDataContext: telegramInitDataContext || null // Данные initData из TelegramContext
      };
    } catch (e) {
      debugLogger.error('Ошибка при получении initData для отображения', e);
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [debugLogger, telegramUserContext, telegramUserFromProps, auth?.userData, telegramInitDataContext]);

  const fetchConsoleLogs = async () => { // Переименовано для ясности
    if (propsLogs?.length) return;
    const supabase = getSupabaseClient();
    if (!supabase) { setError('Supabase client not available'); return; }
    try {
      setLoading(true); setError(null);
      const { data, error: fetchError } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(MAX_LOGS);
      if (fetchError) { debugLogger.error('Ошибка при получении логов консоли', fetchError); setError(`Ошибка: ${fetchError.message}`); return; }
      setLogs(data || []);
    } catch (e) { debugLogger.error('Необработанная ошибка при получении логов консоли', e); setError(`Ошибка: ${e instanceof Error ? e.message : String(e)}`); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isExpanded && activeTab === 'console' && !propsLogs?.length) {
      fetchConsoleLogs();
    }
  }, [isExpanded, activeTab, propsLogs]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => debugLogger.info('Скопировано в буфер обмена'))
      .catch(err => debugLogger.error('Ошибка при копировании в буфер обмена', err));
  };

  const getSupabaseInfoForAuthTab = () => ({ // Переименовано для ясности
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'не задан',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5)) : 'не задан',
    isClientInitialized: !!getSupabaseClient(),
    connectionStatus: currentSupabaseConnectionDetails.connected ? 'Подключено' : 'Не подключено',
    connectionError: currentSupabaseConnectionDetails.error,
  });

  // Helper для отображения статуса
  const StatusIndicator = ({ status }: { status: SystemStatus | undefined }) => {
    if (!status) return <span className={styles.statusPending}>Проверка...</span>;
    return (
      <span className={status.ok ? styles.statusOk : styles.statusError}>
        {status.ok ? '✅' : '❌'} {status.message}
        {status.details && activeTab === 'health' && ( // Показываем детали только на главной вкладке здоровья, если есть
            <details className={styles.statusDetails}>
                <summary>Детали</summary>
                <pre>{JSON.stringify(status.details, null, 2)}</pre>
            </details>
        )}
      </span>
    );
  };

  return (
    <div className={styles.debugPanel}>
      <button className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Скрыть Отладку 🚀' : 'Показать Отладку 🛰️'} {isExpanded && overallSystemStatus && <span className={overallSystemStatus.ok ? styles.statusOk : styles.statusError}>({overallSystemStatus.message})</span>}
      </button>
      
      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.header}>
            <h3>Центр Управления Полетом 🛸</h3>
            {activeTab === 'health' && 
                <button onClick={refreshHealthChecks} className={styles.actionButton}>Обновить Здоровье</button>
            }
          </div>
          
          <div className={styles.tabs}>
            <button className={`${styles.tabButton} ${activeTab === 'health' ? styles.active : ''}`} onClick={() => setActiveTab('health')}>Обзор Здоровья</button>
            <button className={`${styles.tabButton} ${activeTab === 'console' ? styles.active : ''}`} onClick={() => setActiveTab('console')}>Консоль</button>
            <button className={`${styles.tabButton} ${activeTab === 'initData' ? styles.active : ''}`} onClick={() => setActiveTab('initData')}>Telegram InitData</button>
            <button className={`${styles.tabButton} ${activeTab === 'auth' ? styles.active : ''}`} onClick={() => setActiveTab('auth')}>Авторизация Детали</button>
            {/* Убрали старую вкладку "Состояние Системы", т.к. "Обзор Здоровья" ее заменяет и улучшает */}
          </div>
          
          <div className={styles.tabContent}>
            {/* Таб Обзор Здоровья Системы */}
            {activeTab === 'health' && telegramHealth && supabaseHealth && authHealth && appHealth && (
              <div className={styles.healthOverviewTab}>
                <div className={styles.healthSection}>
                  <h4>Telegram Интеграция 📡</h4>
                  <ul>
                    <li>SDK Init: <StatusIndicator status={telegramHealth.sdkInitialized} /></li>
                    <li>Telegram User: <StatusIndicator status={telegramHealth.userRetrieved} /></li>
                    <li>Telegram InitData (Context): <StatusIndicator status={telegramHealth.initDataRetrieved} /></li>
                    <li>WebApp Object: <StatusIndicator status={telegramHealth.webAppAvailable} /></li>
                    <li>Fullscreen: <StatusIndicator status={telegramHealth.fullscreen} /></li>
                    <li>Safe Area: <StatusIndicator status={telegramHealth.safeArea} /></li>
                    <li>Theme Params: <StatusIndicator status={telegramHealth.themeParams} /></li>
                  </ul>
                </div>
                <div className={styles.healthSection}>
                  <h4>Supabase Backend 🌩️</h4>
                  <ul>
                    <li>Client Init: <StatusIndicator status={supabaseHealth.clientInitialized} /></li>
                    <li>ENV Vars (URL/Key): <StatusIndicator status={supabaseHealth.envVars} /></li>
                    <li>Connection: <StatusIndicator status={supabaseHealth.connection} /></li>
                  </ul>
                </div>
                <div className={styles.healthSection}>
                  <h4>Аутентификация 🛂</h4>
                  <ul>
                    <li>AuthContext: <StatusIndicator status={authHealth.authContextLoaded} /></li>
                    <li>Supabase Session: <StatusIndicator status={authHealth.supabaseSession} /></li>
                    <li>Supabase Auth User: <StatusIndicator status={authHealth.supabaseUser} /></li>
                    <li>User Data (public.users): <StatusIndicator status={authHealth.publicUserLoaded} /></li>
                  </ul>
                </div>
                 <div className={styles.healthSection}>
                  <h4>Приложение 📱</h4>
                  <ul>
                    <li>User Stats: <StatusIndicator status={appHealth.userStats} /></li>
                    {/* Другие проверки состояния приложения */}
                  </ul>
                </div>
              </div>
            )}

            {/* Таб консоли (без изменений в логике, только fetchConsoleLogs) */}
            {activeTab === 'console' && (
              <div className={styles.consoleTab}>
                <div className={styles.sectionHeader}>
                  <h4>Логи ({logs.length})</h4>
                  <div>
                    <button onClick={fetchConsoleLogs} disabled={loading || !!propsLogs?.length} className={styles.actionButton}>{loading ? 'Загрузка...' : 'Обновить'}</button>
                    <button onClick={() => copyToClipboard(logs.map(log => `[${formatTime(log.created_at)}] [${log.level.toUpperCase()}] ${log.message} ${log.context ? JSON.stringify(log.context) : ''}`).join('\n'))} className={styles.actionButton}>Копировать</button>
                  </div>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.logs}>
                  {logs.map((log) => ( <div key={log.id} className={`${styles.logEntry} ${styles[log.level]}`}><span className={styles.timestamp}>{formatTime(log.created_at)}</span> <span className={styles.level}>[{log.level.toUpperCase()}]</span> <span className={styles.message}>{log.message}</span> {log.context && (<pre className={styles.context}>{JSON.stringify(log.context, null, 2)}</pre>)}</div> ))}
                  {logs.length === 0 && !loading && <p>Нет доступных логов</p>}
                </div>
              </div>
            )}
            
            {/* Таб Init Data (использует memoizedTgInitDataForDisplay) */}
            {activeTab === 'initData' && (
              <div className={styles.initDataTab}>
                <div className={styles.sectionHeader}><h4>Telegram InitData (SDK & Context)</h4><button onClick={() => copyToClipboard(JSON.stringify(memoizedTgInitDataForDisplay, null, 2))} className={styles.actionButton}>Копировать</button></div>
                <pre className={styles.jsonData}>{JSON.stringify(memoizedTgInitDataForDisplay, null, 2)}</pre>
              </div>
            )}

            {/* Таб Авторизация Детали */}
            {activeTab === 'auth' && (
              <div className={styles.authTab}>
                <div className={styles.sectionHeader}>
                  <h4>Данные Авторизации (Детально)</h4>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify({ supabaseInfo: getSupabaseInfoForAuthTab(), authState: currentAuthStateDetails }, null, 2))} 
                    className={styles.actionButton}
                  >
                    Копировать
                  </button>
                </div>
                <div className={styles.section}>
                  <h5>Подключение к Supabase</h5>
                  <div className={`${styles.connectionStatus} ${currentSupabaseConnectionDetails.connected ? styles.connected : styles.disconnected}`}>
                    Статус: {currentSupabaseConnectionDetails.connected ? 'Подключено' : 'Не подключено'}
                  </div>
                  {currentSupabaseConnectionDetails.error && (
                    <div className={styles.error}>
                      Ошибка: {typeof currentSupabaseConnectionDetails.error === 'object' 
                                ? JSON.stringify(currentSupabaseConnectionDetails.error, null, 2) 
                                : currentSupabaseConnectionDetails.error}
                    </div>
                  )}
                  <pre className={styles.jsonData}>{JSON.stringify(getSupabaseInfoForAuthTab(), null, 2)}</pre>
                </div>
                <div className={styles.section}>
                  <h5>Пользователь Telegram (из пропсов/контекста)</h5>
                  <div className={styles.userStatus}>
                    Статус: {telegramUserFromProps || telegramUserContext ? 'Данные есть' : 'Данные отсутствуют'}
                  </div>
                  <pre className={styles.jsonData}>{JSON.stringify(telegramUserFromProps || telegramUserContext || 'Пользователь Telegram не найден', null, 2)}</pre>
                </div>
                <div className={styles.section}>
                  <h5>Состояние Авторизации Supabase & AuthContext</h5>
                  <div className={styles.userStatus}>
                    AuthContext: {auth?.isAuthenticated ? 'Авторизован' : 'Не авторизован'}
                  </div>
                  <pre className={styles.jsonData}>{JSON.stringify(currentAuthStateDetails || 'Данные не доступны', null, 2)}</pre>
                </div>
                <div className={styles.section}>
                  <h5>Быстрая Диагностика (дублирует Health)</h5>
                  <ul className={styles.diagnosticList}>
                    <li className={telegramUserContext || telegramUserFromProps ? styles.success : styles.error}>
                      {telegramUserContext || telegramUserFromProps ? '✅' : '❌'} Пользователь Telegram
                    </li>
                    <li className={telegramInitDataContext ? styles.success : styles.error}>
                      {telegramInitDataContext ? '✅' : '❌'} InitData Telegram
                    </li>
                    <li className={currentSupabaseConnectionDetails.connected ? styles.success : styles.error}>
                      {currentSupabaseConnectionDetails.connected ? '✅' : '❌'} Соединение Supabase
                    </li>
                    <li className={currentAuthStateDetails?.session ? styles.success : styles.error}>
                      {currentAuthStateDetails?.session ? '✅' : '❌'} Сессия Supabase
                    </li> 
                    <li className={currentAuthStateDetails?.user ? styles.success : styles.error}>
                      {currentAuthStateDetails?.user ? '✅' : '❌'} Пользователь Supabase Auth
                    </li>
                    <li className={auth?.userData ? styles.success : styles.error}>
                      {auth?.userData ? '✅' : '❌'} Данные public.users
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