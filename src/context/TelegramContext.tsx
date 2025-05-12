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
  setTelegramUser: (user: TelegramUser) => void;
  setIsFullScreenEnabled: (enabled: boolean) => void;
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
  initData: null,
  setTelegramUser: () => {},
  setIsFullScreenEnabled: () => {}
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
  
  // Инициализация данных телеграм при загрузке
  useEffect(() => {
    if (typeof window !== 'undefined') {
      telegramLogger.info('Инициализация данных Telegram');
      initializeTelegramData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Функция для получения данных из Telegram
  const initializeTelegramData = async () => {
    // Проверяем, доступен ли Telegram WebApp
    if (typeof window !== 'undefined') {
      try {
        // Сначала попробуем получить данные через SDK
        try {
          telegramLogger.info('Попытка получения данных через Telegram SDK');
          init();
          
          // Получаем данные инициализации
          const tgData = retrieveLaunchParams();
          telegramLogger.info('Получены данные через SDK', tgData);
          
          if (tgData.tgWebAppData?.user) {
            const userData = tgData.tgWebAppData.user;
            telegramLogger.info('Получены данные пользователя из SDK', userData);
            setTelegramUser(userData);
            
            // Запрашиваем дополнительные параметры для безопасной области
            try {
              postEvent('web_app_request_content_safe_area');
              telegramLogger.info('Запрошена безопасная область контента');
            } catch (safeAreaError) {
              telegramLogger.error('Ошибка запроса безопасной области', safeAreaError);
            }
            
            // Запрашиваем полноэкранный режим
            try {
              postEvent('web_app_request_fullscreen');
              setIsFullScreenEnabled(true);
              telegramLogger.info('Запрошен полноэкранный режим');
            } catch (fullscreenError) {
              telegramLogger.error('Ошибка запроса полноэкранного режима', fullscreenError);
            }
          }
          
        } catch (sdkError) {
          telegramLogger.error('Ошибка при получении данных через SDK', sdkError);
        }
        
        // Затем получаем данные из WebApp напрямую
        if (window.Telegram && window.Telegram.WebApp) {
          telegramLogger.info('Найден объект Telegram.WebApp');
          const webAppInstance = window.Telegram.WebApp;
          
          // Устанавливаем webApp
          setWebApp(webAppInstance);
          
          // Получаем данные пользователя
          if (webAppInstance.initDataUnsafe && webAppInstance.initDataUnsafe.user) {
            telegramLogger.info('Получены данные пользователя из WebApp', webAppInstance.initDataUnsafe.user);
            setTelegramUser(webAppInstance.initDataUnsafe.user);
          }
          
          // Сохраняем initData для последующего использования
          if (webAppInstance.initData) {
            telegramLogger.info('Получены initData из WebApp');
            setInitData(webAppInstance.initData);
          }
          
          // Получаем отступ для заголовка
          if (webAppInstance.viewportStableHeight) {
            const paddingTop = webAppInstance.safeAreaInset?.top || 0;
            telegramLogger.info('Установлен отступ для заголовка', { paddingTop, viewportStableHeight: webAppInstance.viewportStableHeight });
            setTelegramHeaderPadding(paddingTop);
          }
          
          // Запрашиваем полноэкранный режим
          try {
            if (webAppInstance.requestFullscreen) {
              telegramLogger.info('Запрос на полноэкранный режим');
              webAppInstance.requestFullscreen();
              setIsFullScreenEnabled(true);
            }
          } catch (fullscreenError) {
            telegramLogger.error('Ошибка при запросе полноэкранного режима', fullscreenError);
          }
        } else {
          telegramLogger.info('Telegram WebApp не найден, запускаемся в обычном браузере');
        }
      } catch (error) {
        telegramLogger.error('Ошибка при инициализации данных Telegram', error);
      }
    }
  };
  
  // Функция для включения полноэкранного режима
  const enableFullScreen = () => {
    try {
      // Всегда сначала пробуем использовать postEvent из SDK для запроса fullscreen
      telegramLogger.info('Запрос на полноэкранный режим через SDK');
      postEvent('web_app_request_fullscreen');
      setIsFullScreenEnabled(true);
      telegramLogger.info('Запрос на полноэкранный режим через SDK отправлен успешно');
      
      // Если есть webApp, пробуем использовать также нативный метод как запасной вариант
      if (webApp) {
        if (typeof webApp.requestFullscreen === 'function') {
          try {
            webApp.requestFullscreen();
            telegramLogger.info('Нативный метод requestFullscreen вызван успешно');
          } catch (reqFsError) {
            telegramLogger.warn('Ошибка при вызове нативного метода requestFullscreen', reqFsError);
          }
        } else if (typeof webApp.expand === 'function') {
          // Если requestFullscreen недоступен, используем expand как третий вариант
          try {
            webApp.expand();
            telegramLogger.info('Запасной нативный метод expand вызван успешно');
          } catch (expandError) {
            telegramLogger.warn('Ошибка при вызове запасного нативного метода expand', expandError);
          }
        }
      } else {
        telegramLogger.info('WebApp недоступен, полагаемся только на SDK метод');
      }
    } catch (error) {
      telegramLogger.error('Ошибка при запросе полноэкранного режима через SDK', error);
      
      // Если SDK вызов не сработал, пробуем запасные варианты через webApp напрямую
      if (webApp) {
        if (typeof webApp.requestFullscreen === 'function') {
          try {
            webApp.requestFullscreen();
            setIsFullScreenEnabled(true);
            telegramLogger.info('Использован запасной метод requestFullscreen');
          } catch (reqFsError) {
            telegramLogger.warn('Ошибка при использовании запасного метода requestFullscreen', reqFsError);
            
            if (typeof webApp.expand === 'function') {
              try {
                webApp.expand();
                setIsFullScreenEnabled(true);
                telegramLogger.info('Использован запасной метод expand');
              } catch (expandError) {
                telegramLogger.error('Ошибка при использовании запасного метода expand', expandError);
              }
            }
          }
        } else if (typeof webApp.expand === 'function') {
          try {
            webApp.expand();
            setIsFullScreenEnabled(true);
            telegramLogger.info('Использован запасной метод expand');
          } catch (expandError) {
            telegramLogger.error('Ошибка при использовании запасного метода expand', expandError);
          }
        } else {
          telegramLogger.error('Ни один из методов полноэкранного режима не доступен');
        }
      } else {
        telegramLogger.warn('WebApp недоступен, и SDK метод не сработал');
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
  
  // Возвращаем провайдер с контекстом
  return (
    <TelegramContext.Provider 
      value={{
        user: telegramUser,
        webApp,
        isFullScreenEnabled,
        telegramHeaderPadding,
        enableFullScreen,
        initializeTelegramApp,
        telegramUser,
        initData,
        setTelegramUser,
        setIsFullScreenEnabled
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export default TelegramContext; 