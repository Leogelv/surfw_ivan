'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTelegram } from '@/context/TelegramContext';
import styles from '../DebugPanel.module.css';

interface AuthDetailsTabProps {
  authStateDetails: any;
  supabaseConnectionDetails: {
    connected: boolean;
    error: string | object | null;
  };
  telegramUserFromProps: any;
  telegramUserContext: any;
  telegramInitDataContext: string | null;
  authContextData: any;
  getSupabaseInfoForAuthTab: () => any;
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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  
  const auth = useAuth();
  const { telegramUser } = useTelegram();
  
  const handleForceCreateUser = async () => {
    if (!telegramUser) {
      setCreationError('Невозможно создать пользователя: данные Telegram недоступны');
      return;
    }
    
    try {
      setIsCreatingUser(true);
      setCreationResult(null);
      setCreationError(null);
      
      console.log('Вызываем принудительное создание пользователя с данными:', telegramUser);
      const result = await auth.forceCreateUser(telegramUser);
      
      if (result) {
        setCreationResult(result);
        console.log('Пользователь успешно создан:', result);
      } else {
        setCreationError('Не удалось создать пользователя. Проверьте консоль для деталей.');
        console.error('Не удалось создать пользователя:', auth.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCreationError(`Ошибка: ${errorMessage}`);
      console.error('Ошибка при создании пользователя:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };
  
  const supabaseInfo = getSupabaseInfoForAuthTab();
  
  return (
    <div className={styles.tabContentInner}>
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Текущий статус авторизации</h3>
        
        <div className={styles.authDebugGrid}>
          <div className={styles.authDebugInfo}>
            <strong>Auth Context:</strong> 
            <span className={authContextData?.isAuthenticated ? styles.statusOk : styles.statusError}>
              {authContextData?.isAuthenticated ? 'Авторизован' : 'Не авторизован'}
            </span>
          </div>
          
          <div className={styles.authDebugInfo}>
            <strong>Загрузка:</strong> {authContextData?.isLoading ? 'Да' : 'Нет'}
          </div>
          
          <div className={styles.authDebugInfo}>
            <strong>Ошибка:</strong> {authContextData?.error || 'Нет'}
          </div>

          {!authContextData?.isAuthenticated && telegramUser && (
            <div className={styles.authDebugInfo} style={{
              backgroundColor: 'rgba(79, 70, 229, 0.15)',
              padding: '12px',
              borderRadius: '8px',
              borderLeft: '3px solid rgba(79, 70, 229, 0.8)',
              marginTop: '10px',
              gridColumn: '1 / -1'
            }}>
              <button 
                className={styles.actionButton}
                style={{
                  fontSize: '14px',
                  padding: '8px 16px',
                  margin: '0',
                  width: '100%',
                  fontWeight: '600',
                  backgroundColor: 'rgba(79, 70, 229, 0.9)'
                }}
                onClick={handleForceCreateUser}
                disabled={isCreatingUser}
              >
                {isCreatingUser ? 'Создание пользователя...' : '🛠️ Создать пользователя вручную'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Соединение с Supabase</h3>
        <div className={styles.supabaseConnection}>
          <div>
            <strong>URL:</strong> {supabaseInfo.url}
          </div>
          <div>
            <strong>Ключ:</strong> {supabaseInfo.anonKey}
          </div>
          <div>
            <strong>Клиент:</strong> 
            <span className={supabaseInfo.isClientInitialized ? styles.statusOk : styles.statusError}>
              {supabaseInfo.isClientInitialized ? 'Инициализирован' : 'Не инициализирован'}
            </span>
          </div>
          <div>
            <strong>Статус:</strong> 
            <span className={supabaseConnectionDetails.connected ? styles.statusOk : styles.statusError}>
              {supabaseConnectionDetails.connected ? 'Подключено' : 'Не подключено'}
            </span>
          </div>
          
          {supabaseConnectionDetails.error && (
            <div>
              <strong>Ошибка соединения:</strong> 
              <pre className={styles.errorText}>
                {typeof supabaseConnectionDetails.error === 'string' 
                  ? supabaseConnectionDetails.error 
                  : JSON.stringify(supabaseConnectionDetails.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Telegram пользователь</h3>
        <div className={styles.telegramUserInfo}>
          {telegramUser ? (
            <>
              <div><strong>ID:</strong> {telegramUser.id}</div>
              <div><strong>Username:</strong> {telegramUser.username || 'Не указан'}</div>
              <div><strong>Имя:</strong> {telegramUser.first_name || 'Не указано'}</div>
              <div><strong>Фамилия:</strong> {telegramUser.last_name || 'Не указана'}</div>
              <div>
                <strong>Фото:</strong> {telegramUser.photo_url 
                  ? <a href={telegramUser.photo_url} target="_blank" rel="noopener noreferrer">Ссылка</a> 
                  : 'Не указано'}
              </div>
              
              {!authContextData?.isAuthenticated && (
                <div style={{ marginTop: '10px' }}>
                  <button 
                    className={styles.actionButton} 
                    onClick={handleForceCreateUser}
                    disabled={isCreatingUser}
                    style={{ width: '100%', padding: '10px', marginLeft: 0 }}
                  >
                    {isCreatingUser ? 'Создание...' : 'Принудительно создать пользователя'}
                  </button>
                </div>
              )}
              
              {creationResult && (
                <div className={styles.creationResult}>
                  <h4>Пользователь успешно создан:</h4>
                  <pre>{JSON.stringify(creationResult, null, 2)}</pre>
                </div>
              )}
              
              {creationError && (
                <div className={styles.creationError}>
                  <h4>Ошибка создания пользователя:</h4>
                  <p>{creationError}</p>
                </div>
              )}
            </>
          ) : (
            <div className={styles.statusError}>Данные пользователя Telegram отсутствуют</div>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionHeader}>Пользователь Supabase</h3>
        <div className={styles.supabaseUserInfo}>
          {authContextData?.userData ? (
            <>
              <div><strong>ID:</strong> {authContextData.userData.id}</div>
              <div><strong>Telegram ID:</strong> {authContextData.userData.telegram_id || 'Не связан'}</div>
              <div><strong>Username:</strong> {authContextData.userData.username || 'Не указан'}</div>
              <div><strong>Имя:</strong> {authContextData.userData.first_name || 'Не указано'}</div>
              <div><strong>Фамилия:</strong> {authContextData.userData.last_name || 'Не указана'}</div>
              <div><strong>Создан:</strong> {authContextData.userData.created_at 
                ? new Date(authContextData.userData.created_at).toLocaleString() 
                : 'Не указано'}</div>
              <div><strong>Обновлен:</strong> {authContextData.userData.updated_at 
                ? new Date(authContextData.userData.updated_at).toLocaleString() 
                : 'Не указано'}</div>
            </>
          ) : (
            <div className={styles.statusError}>Пользователь Supabase не авторизован</div>
          )}
        </div>
      </div>
      
      <div className={styles.copySection}>
        <button className={styles.copyButton} onClick={onCopy}>
          📋 Копировать все данные авторизации
        </button>
      </div>
    </div>
  );
};

export default AuthDetailsTab; 