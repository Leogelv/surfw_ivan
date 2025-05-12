'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { init, retrieveLaunchParams, postEvent } from '@telegram-apps/sdk';

// Функция для генерации случайного пароля для создания пользователя в Supabase
function generateRandomPassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Интерфейс для пользователя Telegram
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  auth_date?: string;
}

// Интерфейс для SafeAreaInset
interface SafeAreaInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Интерфейс для Telegram WebApp
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: TelegramUser;
    auth_date: string;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  safeAreaInset?: SafeAreaInset;
  contentSafeAreaInset?: SafeAreaInset;
  BackButton: {
    isVisible: boolean;
    onClick: () => void;
    offClick: () => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  readyToSend: (isReady: boolean) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string, options?: {try_instant_view?: boolean}) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (isConfirmed: boolean) => void) => void;
  requestFullscreen: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableVerticalSwipes: () => void;
  disableVerticalSwipes: () => void;
}

// Интерфейс контекста для Telegram
interface TelegramContextType {
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  isFullScreenEnabled: boolean;
  telegramHeaderPadding: number;
  enableFullScreen: () => void;
  initializeTelegramApp: () => void;
  telegramUser: TelegramUser | null;
  initData: string | null;
}

// Объявляем глобальный тип Window с добавлением Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
  isFullScreenEnabled: false,
  telegramHeaderPadding: 0,
  enableFullScreen: () => {},
  initializeTelegramApp: () => {},
  telegramUser: null,
  initData: null
});

// Хук для использования контекста Telegram
export const useTelegram = () => {
  return useContext(TelegramContext);
};

// Интерфейс для пропсов TelegramProvider
interface TelegramProviderProps {
  children: ReactNode;
}

// TelegramProvider компонент
export const TelegramProvider = ({ children }: TelegramProviderProps) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  const [telegramHeaderPadding, setTelegramHeaderPadding] = useState(0);
  
  // Создаем логгер для телеграм-контекста
  const telegramLogger = logger.createLogger('TelegramContext');

  // Функция для создания пользователя в Supabase
  const createUserInSupabase = async (telegramUser: TelegramUser) => {
    if (!telegramUser || !telegramUser.id) {
      telegramLogger.error('Невозможно создать пользователя: отсутствуют данные пользователя Telegram');
      return;
    }

    try {
      telegramLogger.info('Создание/обновление пользователя Telegram в Supabase', { 
        telegramId: telegramUser.id,
        username: telegramUser.username,
        hasPhotoUrl: !!telegramUser.photo_url 
      });
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        telegramLogger.error('Невозможно создать пользователя: клиент Supabase не инициализирован');
        return;
      }
      
      // Преобразование Unix timestamp в ISO формат
      const convertAuthDateToISO = (authDate?: string): string | undefined => {
        if (!authDate) return undefined;
        try {
          // authDate приходит как Unix timestamp в секундах, преобразуем в миллисекунды для Date
          return new Date(parseInt(authDate) * 1000).toISOString();
        } catch (e) {
          telegramLogger.error('Ошибка преобразования auth_date', e);
          return undefined;
        }
      };
      
      // Сначала создаем пользователя в auth.users через Auth API
      const email = `telegram_${telegramUser.id}@example.com`;
      const password = generateRandomPassword();
      
      // Пытаемся зарегистрировать пользователя или войти, если уже существует
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Если пользователь не найден, создаем нового
      if (authError && authError.message.includes('Invalid login credentials')) {
        telegramLogger.info('Пользователь не найден, создаем нового пользователя в auth.users');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              telegram_id: telegramUser.id.toString(),
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || '',
              username: telegramUser.username || '',
              photo_url: telegramUser.photo_url || '',
              provider: 'telegram',
              auth_date: telegramUser.auth_date
            }
          }
        });
        
        if (signUpError) {
          telegramLogger.error('Ошибка при создании пользователя через auth.signUp:', signUpError);
          return;
        }
        
        if (!signUpData?.user?.id) {
          telegramLogger.error('Не удалось получить ID пользователя после auth.signUp');
          return;
        }
        
        const userId = signUpData.user.id;
        telegramLogger.info('Пользователь успешно создан через auth.signUp:', {
          id: userId,
          email: signUpData.user.email
        });
        
        // Ждем немного, чтобы триггеры в базе данных успели отработать
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Проверяем, были ли автоматически созданы записи триггерами
        const { data: userCreatedByTrigger, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (checkError) {
          telegramLogger.error('Ошибка при проверке автоматически созданного пользователя:', checkError);
        }
        
        // Если триггер не сработал, создаем запись в public.users вручную
        if (!userCreatedByTrigger) {
          telegramLogger.warn('Триггер не создал пользователя автоматически, создаем вручную', { userId });
          
          const newUserData = {
            id: userId,
            telegram_id: telegramUser.id.toString(),
            username: telegramUser.username || '',
            first_name: telegramUser.first_name || '',
            last_name: telegramUser.last_name || '',
            photo_url: telegramUser.photo_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            telegram_auth_date: convertAuthDateToISO(telegramUser.auth_date)
          };
          
          const { data: manualUser, error: insertError } = await supabase
            .from('users')
            .insert(newUserData)
            .select();
          
          if (insertError) {
            telegramLogger.error('Ошибка при ручном создании записи в public.users:', insertError);
          } else {
            telegramLogger.info('Пользователь успешно создан вручную:', manualUser);
          }
        } else {
          telegramLogger.info('Пользователь успешно создан триггером:', userCreatedByTrigger);
        }
        
        // Проверяем, созданы ли настройки пользователя
        const { data: settingsData, error: settingsCheckError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (settingsCheckError) {
          telegramLogger.error('Ошибка при проверке настроек пользователя:', settingsCheckError);
        }
        
        // Если настройки не созданы автоматически, создаем их вручную
        if (!settingsData) {
          telegramLogger.warn('Настройки пользователя не созданы автоматически, создаем вручную', { userId });
          
          const settingsData = {
            user_id: userId,
            notifications_enabled: true,
            theme: 'light',
            language: telegramUser.language_code || 'ru',
            updated_at: new Date().toISOString()
          };
          
          const { error: settingsError } = await supabase
            .from('user_settings')
            .insert(settingsData);
          
          if (settingsError) {
            telegramLogger.error('Ошибка при ручном создании настроек пользователя:', settingsError);
          } else {
            telegramLogger.info('Настройки пользователя успешно созданы вручную');
          }
        } else {
          telegramLogger.info('Настройки пользователя успешно созданы триггером');
        }
      } else if (authData && authData.user) {
        // Пользователь существует, обновляем его данные
        telegramLogger.info('Найден существующий пользователь, обновляем данные', {
          userId: authData.user.id,
          email: authData.user.email
        });
        
        // Проверяем запись в public.users
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('id, telegram_id, photo_url')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (findError) {
          telegramLogger.error('Ошибка при поиске существующего пользователя в public.users', 
            { error: findError.message, details: findError.details }
          );
        }
        
        // Если запись в public.users существует, обновляем ее
        if (existingUser) {
          const updateData = {
            username: telegramUser.username || '',
            first_name: telegramUser.first_name || '',
            last_name: telegramUser.last_name || '',
            photo_url: telegramUser.photo_url || existingUser.photo_url || '',
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            telegram_auth_date: convertAuthDateToISO(telegramUser.auth_date)
          };
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', existingUser.id)
            .select();
          
          if (updateError) {
            telegramLogger.error('Ошибка при обновлении пользователя', 
              { error: updateError.message, details: updateError.details }
            );
          } else {
            telegramLogger.info('Пользователь успешно обновлен', updatedUser);
          }
        } else {
          // Если в public.users нет записи, создаем ее
          telegramLogger.warn('Запись в public.users не найдена, создаем', { userId: authData.user.id });
          
          const newUserData = {
            id: authData.user.id,
            telegram_id: telegramUser.id.toString(),
            username: telegramUser.username || '',
            first_name: telegramUser.first_name || '',
            last_name: telegramUser.last_name || '',
            photo_url: telegramUser.photo_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            telegram_auth_date: convertAuthDateToISO(telegramUser.auth_date)
          };
          
          const { data: manualUser, error: insertError } = await supabase
            .from('users')
            .insert(newUserData)
            .select();
          
          if (insertError) {
            telegramLogger.error('Ошибка при создании записи в public.users:', insertError);
          } else {
            telegramLogger.info('Запись в public.users успешно создана:', manualUser);
          }
          
          // Проверяем и создаем настройки пользователя, если их нет
          const { data: settingsData, error: settingsCheckError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();
          
          if (!settingsData && !settingsCheckError) {
            const settingsData = {
              user_id: authData.user.id,
              notifications_enabled: true,
              theme: 'light',
              language: telegramUser.language_code || 'ru',
              updated_at: new Date().toISOString()
            };
            
            const { error: settingsError } = await supabase
              .from('user_settings')
              .insert(settingsData);
            
            if (settingsError) {
              telegramLogger.error('Ошибка при создании настроек пользователя:', settingsError);
            } else {
              telegramLogger.info('Настройки пользователя успешно созданы');
            }
          }
        }
      } else if (authError) {
        telegramLogger.error('Ошибка при входе пользователя:', authError);
      }
    } catch (error) {
      telegramLogger.error('Необработанная ошибка при создании/обновлении пользователя в Supabase:', error);
    }
  };
  
  // Функция инициализации данных Telegram
  const initializeTelegramData = async () => {
    try {
      // Инициализируем Telegram Mini Apps SDK
      init();
      telegramLogger.info('Telegram Mini Apps SDK инициализирован');
      
      // Пытаемся получить данные из SDK
      try {
        const { initDataRaw, user } = retrieveLaunchParams();
        
        if (initDataRaw) {
          setInitData(initDataRaw as string);
          telegramLogger.info('Получены initData из SDK');
        } else {
          telegramLogger.warn('initDataRaw отсутствует');
        }
        
        if (user) {
          setTelegramUser(user as TelegramUser);
          telegramLogger.info('Получены данные пользователя из SDK', {
            id: (user as TelegramUser).id,
            username: (user as TelegramUser).username,
            hasPhoto: !!(user as TelegramUser).photo_url
          });
          
          // Создаем пользователя в Supabase на основе данных из Telegram
          await createUserInSupabase(user as TelegramUser);
        } else {
          telegramLogger.warn('Данные пользователя отсутствуют в Launch Params');
        }
      } catch (error) {
        telegramLogger.error('Ошибка при получении данных из SDK Launch Params', error);
      }
      
      // Пытаемся получить объект WebApp из глобального объекта Telegram
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        const webAppInstance = window.Telegram.WebApp;
        setWebApp(webAppInstance);
        
        // Пытаемся получить пользователя из WebApp, если не получили из SDK
        if (!telegramUser && webAppInstance.initDataUnsafe && webAppInstance.initDataUnsafe.user) {
          const user = webAppInstance.initDataUnsafe.user;
          setTelegramUser(user);
          telegramLogger.info('Получены данные пользователя из WebApp', {
            id: user.id,
            username: user.username,
            hasPhoto: !!user.photo_url
          });
          
          // Создаем пользователя в Supabase на основе данных из Telegram
          await createUserInSupabase(user);
        }
        
        // Устанавливаем padding на основе данных из WebApp SafeArea
        if (webAppInstance.safeAreaInset) {
          setTelegramHeaderPadding(webAppInstance.safeAreaInset.top);
          telegramLogger.debug('Установлен telegramHeaderPadding', { padding: webAppInstance.safeAreaInset.top });
        }
        
        // Отправляем сигнал готовности приложения
        try {
          webAppInstance.ready();
          telegramLogger.info('Отправлен сигнал ready в WebApp');
        } catch (error) {
          telegramLogger.error('Ошибка при отправке сигнала ready', error);
        }
      } else {
        telegramLogger.warn('WebApp не доступен в глобальном объекте Telegram');
      }
    } catch (error) {
      telegramLogger.error('Необработанная ошибка при инициализации данных Telegram', error);
    }
  };
  
  // Функция для включения полноэкранного режима
  const enableFullScreen = () => {
    try {
      // Пробуем использовать postEvent из SDK для запроса fullscreen
      telegramLogger.info('Запрос на полноэкранный режим через SDK');
      postEvent('web_app_request_fullscreen');
      setIsFullScreenEnabled(true);
      
      // Если есть webApp, пробуем использовать также нативный метод requestFullscreen
      if (webApp && typeof webApp.requestFullscreen === 'function') {
        webApp.requestFullscreen();
      } else if (webApp && typeof webApp.expand === 'function') {
        // Если requestFullscreen недоступен, используем expand как запасной вариант
        webApp.expand();
      }
    } catch (error) {
      telegramLogger.error('Ошибка при запросе полноэкранного режима', error);
      
      // Если SDK вызов не сработал, пробуем запасной вариант через webApp напрямую
      if (webApp && typeof webApp.expand === 'function') {
        try {
          webApp.expand();
          setIsFullScreenEnabled(true);
          telegramLogger.info('Использован запасной метод expand для перехода в полноэкранный режим');
        } catch (expandError) {
          telegramLogger.error('Ошибка при использовании запасного метода expand', expandError);
        }
      }
    }
  };
  
  // Функция инициализации приложения Telegram
  const initializeTelegramApp = () => {
    // При первой инициализации запрашиваем полноэкранный режим
    if (!isFullScreenEnabled) {
      enableFullScreen();
    }
  };
  
  // Эффект для инициализации данных Telegram при монтировании компонента
  useEffect(() => {
    initializeTelegramData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Подготовка контекста для провайдера
  const contextValue = useMemo(() => ({
    user: telegramUser,
    webApp,
    isFullScreenEnabled,
    telegramHeaderPadding,
    enableFullScreen,
    initializeTelegramApp,
    telegramUser,
    initData
  }), [
    telegramUser,
    webApp,
    isFullScreenEnabled,
    telegramHeaderPadding,
    initData
  ]);
  
  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};

export default TelegramContext; 