import React from 'react';
import styles from '../DebugPanel.module.css';
import { useAuth } from '@/context/AuthContext'; // Исправленный импорт

interface AuthDetailsTabProps {
  authStateDetails: any;
  supabaseConnectionDetails: { connected: boolean; error: string | null | object };
  telegramUserFromProps: any;
  telegramUserContext: any;
  telegramInitDataContext: string | null;
  authContextData: any; // Для данных из useAuth()
  getSupabaseInfoForAuthTab: () => object;
  onCopy: () => void;
}

const AuthDetailsTab: React.FC<AuthDetailsTabProps> = ({
  authStateDetails,
  supabaseConnectionDetails,
  telegramUserFromProps,
  telegramUserContext,
  telegramInitDataContext,
  authContextData,
  getSupabaseInfoForAuthTab,
  onCopy
}) => {
  return (
    <div className={styles.authTab}>
      <div className={styles.sectionHeader}>
        <h4>Данные Авторизации (Детально)</h4>
        <button onClick={onCopy} className={styles.actionButton}>Копировать</button>
      </div>
      <div className={styles.section}>
        <h5>Подключение к Supabase</h5>
        <div className={`${styles.connectionStatus} ${supabaseConnectionDetails.connected ? styles.connected : styles.disconnected}`}>
          Статус: {supabaseConnectionDetails.connected ? 'Подключено' : 'Не подключено'}
        </div>
        {supabaseConnectionDetails.error && (
          <div className={styles.error}>
            Ошибка: {typeof supabaseConnectionDetails.error === 'object' 
                      ? JSON.stringify(supabaseConnectionDetails.error, null, 2) 
                      : supabaseConnectionDetails.error}
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
          AuthContext: {authContextData?.isAuthenticated ? 'Авторизован' : 'Не авторизован'}
        </div>
        <pre className={styles.jsonData}>{JSON.stringify(authStateDetails || 'Данные не доступны', null, 2)}</pre>
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
          <li className={supabaseConnectionDetails.connected ? styles.success : styles.error}>
            {supabaseConnectionDetails.connected ? '✅' : '❌'} Соединение Supabase
          </li>
          <li className={authStateDetails?.session ? styles.success : styles.error}>
            {authStateDetails?.session ? '✅' : '❌'} Сессия Supabase
          </li> 
          <li className={authStateDetails?.user ? styles.success : styles.error}>
            {authStateDetails?.user ? '✅' : '❌'} Пользователь Supabase Auth
          </li>
          <li className={authContextData?.userData ? styles.success : styles.error}>
            {authContextData?.userData ? '✅' : '❌'} Данные public.users
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AuthDetailsTab; 