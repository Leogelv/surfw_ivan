'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import logger from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
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
  const [telegramHeaderPadding] = useState(100);

  // Функция для создания пользователя в Supabase
  const createUserInSupabase = async (telegramUser: TelegramUser) => {
    if (!telegramUser || !telegramUser.id) {
      telegramLogger.warn('Нет данных пользователя Telegram для создания в Supabase');
      return;
    }

    try {
      telegramLogger.info('Попытка создания пользователя в Supabase', { telegramUser }, telegramUser.id.toString());
      const supabase = getSupabaseClient();
      
      // Проверяем существует ли пользователь
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id.toString())
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        telegramLogger.error('Ошибка при проверке пользователя в Supabase', 
          { error: checkError, details: checkError.details, code: checkError.code, message: checkError.message }, 
          telegramUser.id.toString()
        );
        return;
      }
      
      if (existingUser) {
        telegramLogger.info('Пользователь уже существует в Supabase, обновляем данные', { existingUser }, telegramUser.id.toString());
        
        // Обновляем данные пользователя
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photo_url: telegramUser.photo_url || '',
            last_login: new Date().toISOString()
          })
          .eq('telegram_id', telegramUser.id.toString());
        
        if (updateError) {
          telegramLogger.error('Ошибка при обновлении пользователя в Supabase', 
            { error: updateError, details: updateError.details, code: updateError.code, message: updateError.message }, 
            telegramUser.id.toString()
          );
        } else {
          telegramLogger.info('Данные пользователя успешно обновлены в Supabase', null, telegramUser.id.toString());
        }
        
        return;
      }
      
      const userId = randomUUID();
      telegramLogger.info('Генерация ID для нового пользователя', { userId }, telegramUser.id.toString());
      
      // Создаем нового пользователя
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(
          { 
            id: userId,
            telegram_id: telegramUser.id.toString(),
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photo_url: telegramUser.photo_url || '',
            preferences: {},
            last_login: new Date().toISOString(),
            telegram_auth_date: new Date().toISOString()
          }
        )
        .select()
        .single();
      
      if (insertError) {
        telegramLogger.error('Ошибка при создании пользователя в Supabase', 
          { error: insertError, details: insertError.details, code: insertError.code, message: insertError.message, userId }, 
          telegramUser.id.toString()
        );
        return;
      }
      
      telegramLogger.info('Пользователь успешно создан в Supabase', { newUser }, telegramUser.id.toString());
      
      // Создаем запись в user_settings для этого пользователя
      if (newUser) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({ user_id: newUser.id });
        
        if (settingsError) {
          telegramLogger.error('Ошибка при создании настроек пользователя', 
            { error: settingsError, details: settingsError.details, code: settingsError.code, message: settingsError.message }, 
            telegramUser.id.toString()
          );
        } else {
          telegramLogger.info('Настройки пользователя созданы', null, telegramUser.id.toString());
        }
      }
    } catch (error) {
      telegramLogger.error('Исключение при создании пользователя в Supabase', error, telegramUser.id.toString());
      console.error('Exception:', error);
    }
  };

  // Инициализация Telegram WebApp
  useEffect(() => {
    // Проверяем, доступен ли Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      telegramLogger.info('Telegram WebApp обнаружен');
      
      // Устанавливаем данные WebApp и пользователя
      setWebApp(tgWebApp as unknown as TelegramWebApp);
      
      // Если в инициализационных данных есть пользователь, используем его
      if (tgWebApp.initDataUnsafe && tgWebApp.initDataUnsafe.user) {
        const telegramUser = tgWebApp.initDataUnsafe.user;
        telegramLogger.info('Получены данные пользователя из Telegram WebApp', telegramUser);
        setUser(telegramUser);
        
        // Создаем или обновляем пользователя в Supabase
        createUserInSupabase(telegramUser);
      } else {
        telegramLogger.warn('Пользователь не найден в Telegram WebApp initDataUnsafe');
      }
    } else {
      telegramLogger.warn('Telegram WebApp не обнаружен, запуск в режиме браузера');
      
      // Симуляция данных пользователя Telegram для веб-тестов
      const mockTelegramUser: TelegramUser = {
        id: 375634162,
        first_name: 'Леонид',
        last_name: 'Гельвих',
        username: 'sapientweb',
        photo_url: 'https://t.me/i/userpic/320/default.jpg'
      };
      
      telegramLogger.info('Используем симуляцию данных пользователя для веб-тестов', mockTelegramUser);
      setUser(mockTelegramUser);
      
      // Создаем или обновляем пользователя в Supabase
      createUserInSupabase(mockTelegramUser);
    }
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
    telegramHeaderPadding,
    enableFullScreen,
    initializeTelegramApp,
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