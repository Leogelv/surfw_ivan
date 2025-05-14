'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';
import { postEvent, retrieveLaunchParams } from '@telegram-apps/sdk';
import ProfileScreen from '@/components/screens/ProfileScreen';
import DebugPanel from '@/components/Debug/DebugPanel';
import { createLogger } from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';

// Импортируем компоненты
import MainContent from '@/components/MainContent';
import AppNavigation from '@/components/AppNavigation';
import FloatingDebugButton from '@/components/FloatingDebugButton';
import TelegramThemeManager from '@/components/TelegramThemeManager';
import TelegramSafeAreaHandler from '@/components/TelegramSafeAreaHandler';
import LoggingProvider from '@/components/LoggingProvider';

// Тип для записей логов
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

function YogaApp() {
  const { userData, isLoading: authLoading, user: supabaseUser } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const [activeTab, setActiveTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appLogs, setAppLogs] = useState<LogEntry[]>([]);
  const [contentSafeArea, setContentSafeArea] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const { 
    isFullScreenEnabled, 
    webApp, 
    telegramHeaderPadding, 
    initializeTelegramApp, 
    enableFullScreen, 
    user: telegramUser, 
    setTelegramUser, 
    setIsFullScreenEnabled 
  } = useTelegram();
  
  const appLogger = createLogger('HomePage');

  // Получение и мемоизация данных инициализации из SDK
  const sdkInitData = useMemo(() => {
    try {
      // Проверяем, что мы в клиентском окружении
      if (typeof window === 'undefined') {
        return { error: 'Работаем в SSR, SDK недоступно' };
      }
      
      // Получаем данные через SDK
      const sdkData = retrieveLaunchParams();
      appLogger.info('Получены данные из Telegram SDK', sdkData);
      return sdkData;
    } catch (e) {
      appLogger.error('Ошибка при получении данных через SDK', e);
      return {
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }, [appLogger]);

  // Функция для переключения видимости DebugPanel
  const toggleDebugPanel = useCallback(() => {
    console.log('Toggle Debug Panel, current state:', showDebugPanel);
    setShowDebugPanel(!showDebugPanel);
    
    // Проверяем, что мы в клиентском окружении
    if (typeof window !== 'undefined') {
      try {
        // Отправляем также event для компонента DebugPanel
        const event = new CustomEvent('toggle-debug-panel', { 
          detail: { forceState: !showDebugPanel } 
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('Error dispatching custom event:', e);
      }
    }
  }, [showDebugPanel]);

  // Функция для сохранения пользователя Telegram в Supabase с дополнительным логированием
  const saveTelegramUserToSupabase = useCallback(async (user: any) => {
    if (!user || !user.id) {
      appLogger.warn('saveTelegramUserToSupabase: Невозможно сохранить пользователя - отсутствуют данные Telegram user или user.id', { user });
      return;
    }

    appLogger.info('saveTelegramUserToSupabase: Начало сохранения/обновления пользователя', { telegramId: user.id });
    console.log('Saving Telegram user to Supabase:', user);
    
    // Проверяем, что мы в клиентском окружении
    if (typeof window === 'undefined') {
      appLogger.error('saveTelegramUserToSupabase: Попытка выполнить в SSR контексте');
      return;
    }
    
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = 'Клиент Supabase не инициализирован.';
      appLogger.error('saveTelegramUserToSupabase: ' + error);
      console.error(error);
      return;
    }

    try {
      // Проверяем, есть ли пользователь в public.users по telegram_id
      appLogger.debug('saveTelegramUserToSupabase: Поиск существующего пользователя в public.users', { telegramId: user.id.toString() });
      console.log('Searching for existing user with telegram_id:', user.id.toString());
      const { data: existingPublicUser, error: findError } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, photo_url, last_login')
        .eq('telegram_id', user.id.toString())
        .maybeSingle();

      if (findError) {
        appLogger.error('saveTelegramUserToSupabase: Ошибка при поиске пользователя в public.users', { error: findError });
        console.error('Error finding user:', findError);
      }

      if (existingPublicUser) {
        appLogger.info('saveTelegramUserToSupabase: Пользователь найден в public.users, обновляем данные', { userId: existingPublicUser.id });
        console.log('Existing user found, updating:', existingPublicUser);
        const updateData = {
          first_name: user.first_name || existingPublicUser.first_name || '',
          last_name: user.last_name || existingPublicUser.last_name || '',
          username: user.username || undefined,
          photo_url: user.photo_url || existingPublicUser.photo_url || '',
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existingPublicUser.id)
          .select('id')
          .single();

        if (updateError) {
          appLogger.error('saveTelegramUserToSupabase: Ошибка при обновлении пользователя в public.users', { error: updateError });
          console.error('Error updating user:', updateError);
        } else {
          appLogger.info('saveTelegramUserToSupabase: Пользователь в public.users успешно обновлен', { updatedUser });
          console.log('User updated successfully:', updatedUser);
        }
        return;
      }

      // Если пользователь НЕ найден в public.users, регистрируем нового
      appLogger.info('saveTelegramUserToSupabase: Пользователь не найден в public.users, попытка signUp', { telegramId: user.id });
      console.log('User not found, attempting to register new user with telegram_id:', user.id);
      
      const email = `telegram_${user.id}@telegram.user`;
      const randomPassword = Math.random().toString(36).slice(-12) + 'P!1';

      const userMetadata = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || null,
        photo_url: user.photo_url || null,
        telegram_id: user.id.toString(),
        auth_date: user.auth_date || Math.floor(Date.now() / 1000).toString()
      };
      appLogger.debug('saveTelegramUserToSupabase: Данные для signUp (options.data)', userMetadata);
      console.log('Sign up data:', { email, metadata: userMetadata });

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: randomPassword,
        options: {
          data: userMetadata,
        },
      });

      console.log('Sign up result:', { data: signUpData, error: signUpError });

      if (signUpError) {
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('already registered')) {
          appLogger.warn('saveTelegramUserToSupabase: Пользователь уже зарегистрирован в auth, попытка signIn', { email });
          console.log('User already registered, attempting sign in');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: randomPassword,
          });

          console.log('Sign in result:', { data: signInData, error: signInError });

          if (signInError) {
            appLogger.error('saveTelegramUserToSupabase: Ошибка при signIn после signUp (User already registered)', { error: signInError });
            console.error('Error signing in:', signInError);
          } else {
            appLogger.info('saveTelegramUserToSupabase: Успешный signIn после signUp (User already registered)', { userId: signInData?.user?.id });
            console.log('Successful sign in, user ID:', signInData?.user?.id);
          }
        } else {
          appLogger.error('saveTelegramUserToSupabase: Ошибка при signUp', { error: signUpError });
          console.error('Error signing up:', signUpError);
        }
        return;
      }

      if (signUpData.user) {
        appLogger.info('saveTelegramUserToSupabase: Успешный signUp! Пользователь создан в auth.users.', { userId: signUpData.user.id, email: signUpData.user.email });
        console.log('User successfully signed up:', signUpData.user);
      } else if (signUpData.session) {
        appLogger.warn('saveTelegramUserToSupabase: signUp вернул сессию, но не пользователя.', { session: signUpData.session });
        console.log('Sign up returned session but no user:', signUpData.session);
      } else {
        appLogger.warn('saveTelegramUserToSupabase: signUp не вернул ни пользователя, ни сессию.');
        console.log('Sign up returned neither user nor session.');
      }

    } catch (error) {
      appLogger.error('saveTelegramUserToSupabase: Необработанная ошибка в процессе сохранения пользователя', { error });
      console.error('Unhandled error saving user:', error);
    }
  }, [appLogger]);

  // Обработчик добавления нового лога
  const handleLogAdded = useCallback((log: LogEntry) => {
    setAppLogs(prev => [log, ...prev.slice(0, 49)]);
  }, []);

  // Обработчик изменения contentSafeArea
  const handleContentSafeAreaChanged = useCallback((safeArea: { top: number; right: number; bottom: number; left: number }) => {
    setContentSafeArea(safeArea);
  }, []);

  // Инициализация приложения Telegram
  useEffect(() => {
    // Проверка, что мы в клиентском окружении
    if (typeof window === 'undefined') return;
    
    const hasTgWebAppData = sdkInitData && 'tgWebAppData' in sdkInitData && !!sdkInitData.tgWebAppData;
    
    if (hasTgWebAppData) {
      appLogger.info('Инициализация приложения Telegram с данными из SDK', { 
        hasTgWebAppData,
        userInData: !!sdkInitData.tgWebAppData?.user
      });
      
      // Сохраняем пользователя в Supabase, если он есть в данных
      if (sdkInitData.tgWebAppData?.user && !telegramUser) {
        appLogger.info('Установка данных пользователя из tgWebAppData', sdkInitData.tgWebAppData.user);
        setTelegramUser(sdkInitData.tgWebAppData.user);
        saveTelegramUserToSupabase(sdkInitData.tgWebAppData.user);
      }
      
      // Запрашиваем полноэкранный режим
      try {
        appLogger.info('Запрос на полноэкранный режим через SDK');
        postEvent('web_app_request_fullscreen');
        setIsFullScreenEnabled(true);
      } catch (error) {
        appLogger.error('Ошибка при запросе полноэкранного режима', error);
      }
      
      // Настройка вертикальных свайпов
      try {
        appLogger.info('Установка параметров свайпа', { allow_vertical_swipe: true });
        postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: true });
      } catch (error) {
        appLogger.error('Ошибка при настройке поведения свайпа', error);
      }
      
      // Запрос безопасной зоны контента
      try {
        appLogger.info('Запрос информации о безопасной зоне контента');
        postEvent('web_app_request_content_safe_area');
      } catch (error) {
        appLogger.error('Ошибка при запросе безопасной зоны контента', error);
      }
    }
  }, [sdkInitData, telegramUser, setTelegramUser, setIsFullScreenEnabled, appLogger, saveTelegramUserToSupabase]);

  // Логирование пользовательских данных
  useEffect(() => {
    if (telegramUser) {
      appLogger.info('Данные пользователя Telegram получены', { telegramUser });
    } else {
      appLogger.warn('Данные пользователя Telegram недоступны');
    }
    
    if (userData) {
      appLogger.info('Данные пользователя из Auth получены', { userData });
    }
  }, [telegramUser, userData, appLogger]);

  const toggleProfile = useCallback(() => {
    setShowProfile(prev => !prev);
    appLogger.info('Переключение профиля', { newState: !showProfile }, telegramUser?.id?.toString());
  }, [showProfile, appLogger, telegramUser]);

  // Если отображается профиль, показываем компонент ProfileScreen
  if (showProfile) {
    return (
      <LoggingProvider loggerName="ProfileView" onLogAdded={handleLogAdded}>
        <>
          <ProfileScreen 
            onClose={() => {
              setShowProfile(false);
            }}
          />
          {showDebugPanel && <DebugPanel telegramUser={telegramUser} supabaseUser={userData} logs={appLogs} />}
        </>
      </LoggingProvider>
    );
  }

  return (
    <LoggingProvider loggerName="MainView" onLogAdded={handleLogAdded}>
      <div className={`min-h-screen flex flex-col main-container ${showProfile ? 'overflow-hidden' : ''}`}>
        {/* Компоненты для обработки Telegram стилей и событий */}
        <TelegramThemeManager contentSafeArea={contentSafeArea} />
        <TelegramSafeAreaHandler onContentSafeAreaChanged={handleContentSafeAreaChanged} />
        
        {/* Основной контент */}
        <MainContent 
          isFullScreenEnabled={isFullScreenEnabled}
          telegramHeaderPadding={telegramHeaderPadding}
          contentSafeArea={contentSafeArea}
          statsLoading={statsLoading}
          stats={stats}
        />
        
        {/* Навигация */}
        <AppNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onProfileClick={toggleProfile}
          logger={appLogger}
          telegramUserId={telegramUser?.id?.toString()}
        />
        
        {/* Плавающая кнопка для отладки */}
        <FloatingDebugButton onClick={toggleDebugPanel} />

        {/* Условный рендеринг DebugPanel */}
        {showDebugPanel && <DebugPanel telegramUser={telegramUser} supabaseUser={userData} logs={appLogs} />}
      </div>
    </LoggingProvider>
  );
}

export default function Home() {
  return (
    <TelegramProvider>
      <YogaApp />
    </TelegramProvider>
  );
}