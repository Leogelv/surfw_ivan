'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import logger from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  auth_date?: string;
}

interface SafeAreaInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

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

// Создаем логгер для контекста Telegram
const telegramLogger = logger.createLogger('TelegramContext');

// Создаем контекст
const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
  isFullScreenEnabled: false,
  telegramHeaderPadding: 100,
  enableFullScreen: () => {},
  initializeTelegramApp: () => {},
  telegramUser: null,
  initData: null,
});

// Хук для использования контекста
export const useTelegram = () => {
  return useContext(TelegramContext);
};

interface TelegramProviderProps {
  children: ReactNode;
}

// Провайдер контекста
export const TelegramProvider = ({ children }: TelegramProviderProps) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  const [safeAreaInsetTop, setSafeAreaInsetTop] = useState(0);

  // Обновление значения safeAreaInsetTop при изменении webApp
  useEffect(() => {
    if (webApp && webApp.safeAreaInset) {
      setSafeAreaInsetTop(webApp.safeAreaInset.top);
      telegramLogger.debug('Установлен safeAreaInsetTop из Telegram WebApp', { top: webApp.safeAreaInset.top });
    } else {
      // Значение по умолчанию, если safeAreaInset не доступен
      setSafeAreaInsetTop(50);
      telegramLogger.debug('Установлен safeAreaInsetTop по умолчанию: 50px');
    }
  }, [webApp]);

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
      
      // Проверка наличия пользователя с таким telegram_id
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id, telegram_id, photo_url')
        .eq('telegram_id', telegramUser.id.toString())
        .maybeSingle();
      
      if (findError) {
        telegramLogger.error('Ошибка при поиске существующего пользователя', 
          { error: findError.message, details: findError.details }, 
          telegramUser.id.toString()
        );
      }
      
      // Преобразование Unix timestamp в ISO формат
      const convertAuthDateToISO = (authDate: number) => {
        // authDate приходит как Unix timestamp в секундах, преобразуем в миллисекунды для Date
        return new Date(authDate * 1000).toISOString();
      };
      
      // Общие данные пользователя для создания или обновления
      const userData = {
        telegram_id: telegramUser.id.toString(),
        username: telegramUser.username || '',
        first_name: telegramUser.first_name || '',
        last_name: telegramUser.last_name || '',
        photo_url: telegramUser.photo_url || '',
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        // Преобразуем auth_date в правильный формат, если он есть
        ...(telegramUser.auth_date && { 
          telegram_auth_date: convertAuthDateToISO(parseInt(telegramUser.auth_date)) 
        })
      };
      
      telegramLogger.debug('Подготовленные данные пользователя для сохранения', userData, telegramUser.id.toString());
      
      // Если пользователь существует, обновляем его
      if (existingUser) {
        telegramLogger.info('Обновление существующего пользователя', 
          { userId: existingUser.id }, 
          telegramUser.id.toString()
        );
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('telegram_id', telegramUser.id.toString())
          .select();
        
        if (updateError) {
          telegramLogger.error('Ошибка при обновлении пользователя', 
            { error: updateError.message, details: updateError.details }, 
            telegramUser.id.toString()
          );
        } else {
          telegramLogger.info('Пользователь успешно обновлен', { updatedUser }, telegramUser.id.toString());
        }
      } else {
        // Создаем нового пользователя с генерированным UUID
        const newUserData = {
          ...userData,
          id: uuidv4(),
          created_at: new Date().toISOString()
        };
        
        telegramLogger.info('Создание нового пользователя', newUserData, telegramUser.id.toString());
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select();
        
        if (insertError) {
          telegramLogger.error('Ошибка при создании пользователя', 
            { error: insertError.message, details: insertError.details }, 
            telegramUser.id.toString()
          );
        } else {
          telegramLogger.info('Пользователь успешно создан', { newUser }, telegramUser.id.toString());
          
          // Дополнительно создаем запись в user_settings, если пользователь создан успешно
          if (newUser && newUser.length > 0) {
            try {
              const settingsData = {
                user_id: newUser[0].id,
                notifications_enabled: true,
                theme: 'light',
                language: 'ru',
                updated_at: new Date().toISOString()
              };
              
              const { error: settingsError } = await supabase
                .from('user_settings')
                .insert(settingsData);
              
              if (settingsError) {
                telegramLogger.error('Ошибка при создании настроек пользователя', 
                  { error: settingsError.message, details: settingsError.details }, 
                  telegramUser.id.toString()
                );
              } else {
                telegramLogger.info('Настройки пользователя успешно созданы', {}, telegramUser.id.toString());
              }
            } catch (settingsError) {
              telegramLogger.error('Необработанная ошибка при создании настроек', settingsError, telegramUser.id.toString());
            }
          }
        }
      }
    } catch (e) {
      telegramLogger.error('Необработанная ошибка при создании/обновлении пользователя', e, telegramUser?.id?.toString());
    }
  };

  // Use effect to initialize Telegram user and handle WebApp events
  useEffect(() => {
    const initializeTelegramData = async () => {
      try {
        telegramLogger.info('Инициализация данных Telegram');
        
        // Проверка наличия Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
          const webAppInstance = window.Telegram.WebApp;
          setWebApp(webAppInstance);
          
          // Проверяем наличие данных пользователя
          let telegramUserData = null;
          
          // Сначала пробуем получить через SDK
          try {
            const { user: sdkUser } = retrieveLaunchParams();
            if (sdkUser) {
              telegramUserData = sdkUser as TelegramUser;
              telegramLogger.info('Данные пользователя получены через SDK', {
                id: telegramUserData.id,
                username: telegramUserData.username || 'не указан',
                photo_url: telegramUserData.photo_url ? 'присутствует' : 'отсутствует'
              });
            }
          } catch (sdkError) {
            telegramLogger.error('Ошибка при получении пользователя через SDK', sdkError);
          }
          
          // Если через SDK не удалось, пробуем через WebApp
          if (!telegramUserData && webAppInstance.initDataUnsafe && webAppInstance.initDataUnsafe.user) {
            telegramUserData = webAppInstance.initDataUnsafe.user;
            telegramLogger.info('Данные пользователя получены через WebApp.initDataUnsafe', {
              id: telegramUserData.id,
              username: telegramUserData.username || 'не указан',
              photo_url: telegramUserData.photo_url ? 'присутствует' : 'отсутствует'
            });
          }
          
          // Если удалось получить данные пользователя
          if (telegramUserData) {
            setUser(telegramUserData);
            
            // Создаем или обновляем пользователя в Supabase
            await createUserInSupabase(telegramUserData);
          } else {
            telegramLogger.warn('Не удалось получить данные пользователя Telegram');
          }
        } else {
          telegramLogger.warn('Telegram WebApp не обнаружен');
        }
      } catch (error) {
        telegramLogger.error('Ошибка при инициализации данных Telegram', error);
      }
    };
    
    initializeTelegramData();
  }, []);

  // Функция для включения полноэкранного режима
  const enableFullScreen = () => {
    if (webApp && !isFullScreenEnabled) {
      try {
        webApp.expand();
        setIsFullScreenEnabled(true);
        telegramLogger.info('Полноэкранный режим включен');
      } catch (error) {
        telegramLogger.error('Ошибка при включении полноэкранного режима', error);
      }
    }
  };

  // Функция для полной инициализации Telegram WebApp с необходимыми настройками
  const initializeTelegramApp = () => {
    // Проверяем наличие Telegram WebApp
    if (!webApp) {
      telegramLogger.warn('Telegram WebApp недоступен, возможно запуск в браузере');
      return;
    }
    
    try {
      // Подготовка приложения
      webApp.ready();
      telegramLogger.info('Telegram WebApp готов');
      
      // Проверяем и вызываем методы только если они доступны
      
      // Расширение на весь экран
      if (typeof webApp.expand === 'function') {
        webApp.expand();
        telegramLogger.debug('Вызван метод expand()');
      }
      
      // Запрос на полноэкранный режим
      if (typeof webApp.requestFullscreen === 'function') {
        try {
          webApp.requestFullscreen();
          telegramLogger.debug('Вызван метод requestFullscreen()');
        } catch (err) {
          telegramLogger.warn('requestFullscreen не поддерживается в этой версии Telegram WebApp');
        }
      }
      
      // Отключение вертикальных свайпов
      if (typeof webApp.disableVerticalSwipes === 'function') {
        webApp.disableVerticalSwipes();
        telegramLogger.debug('Вызван метод disableVerticalSwipes()');
      }
      
      // Установка цветов, соответствующих нашему приложению
      if (typeof webApp.setHeaderColor === 'function') {
        webApp.setHeaderColor('#1D1816'); // Темно-коричневый
        telegramLogger.debug('Установлен цвет заголовка #1D1816');
      }
      
      if (typeof webApp.setBackgroundColor === 'function') {
        webApp.setBackgroundColor('#1D1816'); // Темно-коричневый
        telegramLogger.debug('Установлен цвет фона #1D1816');
      }
      
      setIsFullScreenEnabled(true);
    } catch (error) {
      telegramLogger.error('Ошибка при инициализации Telegram WebApp', error);
    }
  };

  // Предоставляем контекст
  const value = {
    user,
    webApp,
    isFullScreenEnabled,
    telegramHeaderPadding: safeAreaInsetTop,
    enableFullScreen,
    initializeTelegramApp,
    telegramUser: user,
    initData: webApp?.initData || null,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

// Добавляем глобальное объявление типа для window.Telegram
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
} 