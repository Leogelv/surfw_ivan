'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTelegram } from '@/context/TelegramContext';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import styles from './DebugPanel.module.css';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import logger from '@/lib/logger';

// Импортируем типы и компоненты вкладок
import {
  SystemStatus, 
  TelegramHealth, 
  SupabaseHealth, 
  AuthHealth, 
  AppHealth, 
  LogEntry,
  DebugPanelProps as ExternalDebugPanelProps // Переименовываем, чтобы не конфликтовать с внутренним
} from './types';
import ConsoleLogsTab from './tabs/ConsoleLogsTab';
import TelegramInitDataTab from './tabs/TelegramInitDataTab';
import AuthDetailsTab from './tabs/AuthDetailsTab';
import HealthOverviewTab from './tabs/HealthOverviewTab';

// Пропсы для основного компонента DebugPanel
interface DebugPanelComponentProps extends ExternalDebugPanelProps {}

const DebugPanel = ({ 
  logs: propsLogs, 
  telegramUser: telegramUserFromProps, 
  supabaseUser: supabaseUserFromProps 
}: DebugPanelComponentProps = {}) => {
  const debugLogger = logger.createLogger('DebugPanel');
  const { 
    user: telegramUserContext, 
    initData: telegramInitDataContext, 
    webApp, 
    isFullScreenEnabled,
    telegramHeaderPadding 
  } = useTelegram();
  const auth = useAuth();
  const { stats: userStats, isLoading: statsLoading } = useUserStats();

  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Теперь панель по умолчанию развернута, если видима
  const [activeTab, setActiveTab] = useState('health');
  
  // Состояния для данных логов и ошибок их загрузки
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [consoleLogsLoading, setConsoleLogsLoading] = useState(false);
  const [consoleLogsError, setConsoleLogsError] = useState<string | null>(null);
  
  // Состояния для данных, используемых на детальных вкладках
  const [currentAuthStateDetails, setCurrentAuthStateDetails] = useState<any>(null);
  const [currentSupabaseConnectionDetails, setCurrentSupabaseConnectionDetails] = useState({ connected: false, error: null as string | object | null });
  
  const MAX_LOGS = 30;

  const [telegramHealth, setTelegramHealth] = useState<TelegramHealth | null>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth | null>(null);
  const [authHealth, setAuthHealth] = useState<AuthHealth | null>(null);
  const [appHealth, setAppHealth] = useState<AppHealth | null>(null);
  const [overallSystemStatus, setOverallSystemStatus] = useState<SystemStatus>({ ok: false, message: "Проверка..." });

  const generateStatus = (ok: boolean, message: string, details?: any): SystemStatus => ({ ok, message, details });

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
        const tgUserFromSDK = launchParams.initData.user as any;
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
    setCurrentSupabaseConnectionDetails({connected: sbConnectionStatus.ok, error: sbConnectionStatus.ok ? null : (sbConnectionStatus.details || sbConnectionStatus.message) });

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
            
            setCurrentAuthStateDetails({
                session: sessionData?.session || null,
                user: userAuthData?.user || null,
                sessionError: sessionError?.message || null,
                userError: userAuthError?.message || null,
                contextUser: supabaseUserFromProps || auth?.userData || null,
                authContext: { 
                    isLoading: auth?.isLoading || false,
                    isAuthenticated: auth?.isAuthenticated || false,
                    userData: auth?.userData || null, 
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

  useEffect(() => {
    if (isExpanded && (activeTab === 'health' || activeTab === 'auth')) {
      refreshHealthChecks();
    }
  }, [isExpanded, activeTab]);

  useEffect(() => {
    if (propsLogs?.length) {
      const formattedLogs = propsLogs.map((log, index) => ({
        id: `external-${index}`,
        level: log.level || 'info',
        message: log.message || 'Сообщение отсутствует',
        created_at: log.timestamp || new Date().toISOString(),
        context: log.context || log.data || undefined
      }));
      setConsoleLogs(formattedLogs);
    }
  }, [propsLogs]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    } catch (e) { return 'Invalid date'; }
  };

  const memoizedTgInitDataForDisplay = useMemo(() => {
    try {
      const sdkData = retrieveLaunchParams();
      return {
        ...sdkData,
        userFromContext: telegramUserContext || null,
        userFromProps: telegramUserFromProps || null,
        supabaseUserFromContext: auth?.userData || null,
        hasWebApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
        telegramInitDataContext: telegramInitDataContext || null
      };
    } catch (e) {
      debugLogger.error('Ошибка при получении initData для отображения', e);
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [debugLogger, telegramUserContext, telegramUserFromProps, auth?.userData, telegramInitDataContext]);

  const fetchConsoleLogsInternal = async () => {
    if (propsLogs?.length) return;
    const supabase = getSupabaseClient();
    if (!supabase) { setConsoleLogsError('Supabase client not available'); return; }
    try {
      setConsoleLogsLoading(true); setConsoleLogsError(null);
      const { data, error: fetchError } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(MAX_LOGS);
      if (fetchError) { debugLogger.error('Ошибка при получении логов консоли', fetchError); setConsoleLogsError(`Ошибка: ${fetchError.message}`); return; }
      setConsoleLogs(data || []);
    } catch (e) { debugLogger.error('Необработанная ошибка при получении логов консоли', e); setConsoleLogsError(`Ошибка: ${e instanceof Error ? e.message : String(e)}`); } 
    finally { setConsoleLogsLoading(false); }
  };

  useEffect(() => {
    if (isExpanded && activeTab === 'console' && !propsLogs?.length) {
      fetchConsoleLogsInternal();
    }
  }, [isExpanded, activeTab, propsLogs]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => debugLogger.info('Скопировано в буфер обмена'))
      .catch(err => debugLogger.error('Ошибка при копировании в буфер обмена', err));
  };

  // Функция для копирования ВСЕХ данных дебаггера
  const copyAllDebugData = () => {
    const allData = {
      healthOverview: {
        telegramHealth,
        supabaseHealth,
        authHealth,
        appHealth,
        overallSystemStatus,
      },
      consoleLogs: consoleLogs.map(log => `[${formatTime(log.created_at)}] [${log.level.toUpperCase()}] ${log.message} ${log.context ? JSON.stringify(log.context) : ''}`).join('\n'),
      telegramInitData: memoizedTgInitDataForDisplay,
      authDetails: {
        supabaseConnection: getSupabaseInfoForAuthTabInternal(),
        authState: currentAuthStateDetails,
      },
      propsReceived: {
        telegramUserFromProps,
        supabaseUserFromProps,
      }
    };
    copyToClipboard(JSON.stringify(allData, null, 2));
    debugLogger.info('Все данные отладки скопированы в буфер обмена.');
  };


  const getSupabaseInfoForAuthTabInternal = () => ({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'не задан',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 5)) : 'не задан',
    isClientInitialized: !!getSupabaseClient(),
    connectionStatus: currentSupabaseConnectionDetails.connected ? 'Подключено' : 'Не подключено',
    connectionError: currentSupabaseConnectionDetails.error,
  });

  const StatusIndicator: React.FC<{ status: SystemStatus | undefined }> = ({ status }) => {
    if (!status) return <span className={styles.statusPending}>Проверка...</span>;
    return (
      <span className={status.ok ? styles.statusOk : styles.statusError}>
        {status.ok ? '✅' : '❌'} {status.message}
        {status.details && activeTab === 'health' && (
            <details className={styles.statusDetails}>
                <summary>Детали</summary>
                <pre>{JSON.stringify(status.details, null, 2)}</pre>
            </details>
        )}
      </span>
    );
  };

  useEffect(() => {
    const handleToggleDebug = (event?: CustomEvent) => setIsPanelVisible(prev => event?.detail?.forceState ?? !prev);
    window.addEventListener('toggle-debug-panel', handleToggleDebug as EventListener);
    // Hotkey: Ctrl + Shift + D (или Cmd + Shift + D на Mac)
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            setIsPanelVisible(prev => !prev);
        }
        if (event.key === 'Escape' && isPanelVisible) {
            setIsPanelVisible(false);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('toggle-debug-panel', handleToggleDebug as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanelVisible]);

  if (!isPanelVisible) return null;

  return (
    <div className={styles.debugPanelContainer}>
      <div className={styles.debugPanel}>
        <button className={styles.closeButton} onClick={() => setIsPanelVisible(false)} title="Закрыть (Esc)">⊗</button>
        {isExpanded && overallSystemStatus && 
          <span className={`${styles.overallStatusIndicator} ${overallSystemStatus.ok ? styles.statusOk : styles.statusError}`}>
            {overallSystemStatus.ok ? '✅' : '❌'} {overallSystemStatus.message}
          </span>
        }
        
        {isExpanded ? (
          <div className={styles.content}>
            <div className={styles.header}>
              <h3>Центр Управления Полетом 🛸</h3>
              <div className={styles.headerActions}>
                {activeTab === 'health' && 
                    <button onClick={refreshHealthChecks} className={styles.actionButton} title="Обновить все проверки здоровья">🔄 Обновить</button>
                }
                <button onClick={copyAllDebugData} className={styles.actionButton} title="Копировать все данные отладки">📋 Копировать все</button>
              </div>
            </div>
            
            <div className={styles.tabs}>
              <button className={`${styles.tabButton} ${activeTab === 'health' ? styles.active : ''}`} onClick={() => setActiveTab('health')}>Обзор Здоровья</button>
              <button className={`${styles.tabButton} ${activeTab === 'console' ? styles.active : ''}`} onClick={() => setActiveTab('console')}>Консоль</button>
              <button className={`${styles.tabButton} ${activeTab === 'initData' ? styles.active : ''}`} onClick={() => setActiveTab('initData')}>Telegram InitData</button>
              <button className={`${styles.tabButton} ${activeTab === 'auth' ? styles.active : ''}`} onClick={() => setActiveTab('auth')}>Авторизация Детали</button>
            </div>
            
            <div className={styles.tabContent}>
              {activeTab === 'health' && 
                <HealthOverviewTab 
                  telegramHealth={telegramHealth} 
                  supabaseHealth={supabaseHealth} 
                  authHealth={authHealth} 
                  appHealth={appHealth} 
                  StatusIndicator={StatusIndicator} 
                />}
              {activeTab === 'console' && 
                <ConsoleLogsTab 
                  logs={propsLogs || consoleLogs} 
                  error={consoleLogsError} 
                  loading={consoleLogsLoading} 
                  onFetchLogs={fetchConsoleLogsInternal} 
                  onCopyLogs={() => copyToClipboard( (propsLogs || consoleLogs).map(log => `[${formatTime(log.created_at)}] [${log.level.toUpperCase()}] ${log.message} ${log.context ? JSON.stringify(log.context) : ''}`).join('\n'))}
                  formatTime={formatTime} 
                />}
              {activeTab === 'initData' && 
                <TelegramInitDataTab 
                  initData={memoizedTgInitDataForDisplay} 
                  onCopy={() => copyToClipboard(JSON.stringify(memoizedTgInitDataForDisplay, null, 2))} 
                />}
              {activeTab === 'auth' && 
                <AuthDetailsTab 
                  authStateDetails={currentAuthStateDetails} 
                  supabaseConnectionDetails={currentSupabaseConnectionDetails} 
                  telegramUserFromProps={telegramUserFromProps}
                  telegramUserContext={telegramUserContext}
                  telegramInitDataContext={telegramInitDataContext}
                  authContextData={auth} // Передаем весь объект AuthContext
                  getSupabaseInfoForAuthTab={getSupabaseInfoForAuthTabInternal}
                  onCopy={() => copyToClipboard(JSON.stringify({ supabaseInfo: getSupabaseInfoForAuthTabInternal(), authState: currentAuthStateDetails }, null, 2))} 
                />}
            </div>
          </div>
        ) : (
          <button className={styles.expandButton} onClick={() => setIsExpanded(true)}>
            Развернуть Отладку 🚀 {overallSystemStatus && <span className={overallSystemStatus.ok ? styles.statusOk : styles.statusError}>({overallSystemStatus.message})</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default DebugPanel; 