'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import logger from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
      telegramLogger.warn('Нет данных пользователя Telegram для создания в Supabase');
      return;
    }

    try {
      telegramLogger.info('Попытка создания пользователя в Supabase', { telegramUser }, telegramUser.id.toString());
      const supabase = getSupabaseClient();
      
      // Проверка политик доступа для таблицы users
      try {
        telegramLogger.debug('Проверка доступности таблицы users');
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          telegramLogger.error('Ошибка при проверке доступа к таблице users', 
            { error: countError, message: countError.message, details: countError.details },
            telegramUser.id.toString()
          );
          // Если не можем даже получить count, есть проблемы с доступом
          return;
        }
        
        telegramLogger.info('Таблица users доступна, количество записей', { count }, telegramUser.id.toString());
      } catch (checkTableError) {
        telegramLogger.error('Исключение при проверке таблицы users', checkTableError, telegramUser.id.toString());
      }
      
      // Проверяем существует ли пользователь
      telegramLogger.debug('Поиск пользователя по telegram_id', { telegram_id: telegramUser.id.toString() });
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, telegram_id, username, first_name, last_name')
        .eq('telegram_id', telegramUser.id.toString())
        .maybeSingle(); // используем maybeSingle вместо single чтобы избежать ошибки, если пользователя нет
      
      if (checkError) {
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
            auth_date: telegramUser.auth_date ? parseInt(telegramUser.auth_date.toString()) : Math.floor(Date.now() / 1000),
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
      
      // Генерируем уникальный ID для нового пользователя
      const userId = uuidv4();
      telegramLogger.info('Генерация ID для нового пользователя', { userId }, telegramUser.id.toString());
      
      // Подготовка данных пользователя
      const userData = { 
        id: userId,
        telegram_id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photo_url: telegramUser.photo_url || '',
        auth_date: telegramUser.auth_date ? parseInt(telegramUser.auth_date.toString()) : Math.floor(Date.now() / 1000),
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      
      // Создание нового пользователя
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (insertError) {
        telegramLogger.error('Ошибка при создании пользователя в Supabase', 
          { error: insertError, details: insertError.details, code: insertError.code, message: insertError.message }, 
          telegramUser.id.toString()
        );
        
        // Если ошибка связана с constraint, проверяем, возможно пользователь все же был создан
        if (insertError.code === '23505') { // duplicate key value violates unique constraint
          telegramLogger.info('Пользователь, возможно, уже существует. Пробуем получить его данные', 
            null, telegramUser.id.toString());
          const { data: retryUser, error: retryError } = await supabase
            .from('users')
            .select('id, telegram_id, username, first_name, last_name')
            .eq('telegram_id', telegramUser.id.toString())
            .single();
          
          if (retryError) {
            telegramLogger.error('Не удалось получить данные после повторной попытки', 
              { error: retryError }, telegramUser.id.toString());
          } else {
            telegramLogger.info('Пользователь найден после повторной попытки', 
              { userId: retryUser.id }, telegramUser.id.toString());
          }
        }
      } else {
        telegramLogger.info('Пользователь успешно создан в Supabase', 
          { userId: insertedUser.id }, telegramUser.id.toString());
        
        // Создание настроек пользователя, если такая таблица существует
        try {
          const { count, error: settingsCountError } = await supabase
            .from('user_settings')
            .select('*', { count: 'exact', head: true });
          
          if (!settingsCountError) {
            // Таблица существует, создаем запись настроек
            const settingsData = {
              id: uuidv4(),
              user_id: insertedUser.id,
              notification_enabled: true,
              theme: 'light',
              last_updated: new Date().toISOString()
            };
            
            const { error: settingsError } = await supabase
              .from('user_settings')
              .insert(settingsData);
            
            if (settingsError) {
              telegramLogger.error('Ошибка при создании настроек пользователя', 
                { error: settingsError }, telegramUser.id.toString());
            } else {
              telegramLogger.info('Настройки пользователя успешно созданы',
                null, telegramUser.id.toString());
            }
          }
        } catch (settingsError) {
          telegramLogger.error('Ошибка при работе с таблицей user_settings', 
            settingsError, telegramUser.id.toString());
        }
      }
    } catch (error) {
      telegramLogger.error('Необработанная ошибка при создании пользователя', 
        error, telegramUser.id.toString());
    }
  };

  // Инициализация Telegram WebApp
  useEffect(() => {
    let cleanup = () => {};
    
    // Проверяем, доступен ли Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      telegramLogger.info('Telegram WebApp обнаружен');
      
      // Устанавливаем данные WebApp и пользователя
      setWebApp(tgWebApp as unknown as TelegramWebApp);
      
      // Добавляем обработчик события viewport_changed
      const handleViewportChanged = (event: MessageEvent) => {
        if (
          event.data && 
          typeof event.data === 'object' && 
          'event_name' in event.data && 
          event.data.event_name === 'viewport_changed' && 
          'params' in event.data && 
          event.data.params.safe_area_inset
        ) {
          const { safe_area_inset } = event.data.params;
          telegramLogger.info('Получено событие viewport_changed с обновленными значениями safe_area_inset', safe_area_inset);
          
          // Обновляем значение safeAreaInsetTop
          if (safe_area_inset.top !== undefined) {
            setSafeAreaInsetTop(safe_area_inset.top);
            telegramLogger.debug('Обновлен safeAreaInsetTop из события viewport_changed', { top: safe_area_inset.top });
          }
        }
      };
      
      window.addEventListener('message', handleViewportChanged);
      
      // Установка функции очистки
      cleanup = () => {
        window.removeEventListener('message', handleViewportChanged);
      };
      
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
    
    // Возвращаем функцию очистки
    return cleanup;
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