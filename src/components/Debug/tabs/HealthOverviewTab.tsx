import React from 'react';
import {
  SystemStatus, 
  TelegramHealth, 
  SupabaseHealth, 
  AuthHealth, 
  AppHealth
} from '../types'; // Импорт типов
import styles from '../DebugPanel.module.css';

interface HealthOverviewTabProps {
  telegramHealth: TelegramHealth | null;
  supabaseHealth: SupabaseHealth | null;
  authHealth: AuthHealth | null;
  appHealth: AppHealth | null;
  StatusIndicator: React.FC<{ status: SystemStatus | undefined }>; // Компонент индикатора передается как проп
}

const HealthOverviewTab: React.FC<HealthOverviewTabProps> = ({ 
  telegramHealth, supabaseHealth, authHealth, appHealth, StatusIndicator 
}) => {
  if (!telegramHealth || !supabaseHealth || !authHealth || !appHealth) {
    return <div className={styles.healthOverviewTab}><p className={styles.statusPending}>Загрузка данных о здоровье системы...</p></div>;
  }

  return (
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
  );
};

export default HealthOverviewTab; 