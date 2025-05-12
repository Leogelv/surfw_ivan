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
      } catch (accessError) {
        telegramLogger.error('Ошибка при проверке доступа к таблице users', accessError, telegramUser.id.toString());
        return;
      }
      
      // Проверяем, существует ли пользователь
      telegramLogger.debug('Проверка существования пользователя с telegram_id', 
        { telegram_id: telegramUser.id.toString() },
        telegramUser.id.toString()
      );
      
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id, telegram_id, photo_url')
        .eq('telegram_id', telegramUser.id.toString())
        .maybeSingle();
      
      if (findError) {
        telegramLogger.error('Ошибка при поиске существующего пользователя', findError, telegramUser.id.toString());
        return;
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
      
      // Если пользователь существует, обновляем его
      if (existingUser) {
        telegramLogger.info('Обновление существующего пользователя', 
          { userId: existingUser.id, photoUrlBefore: existingUser.photo_url },
          telegramUser.id.toString()
        );
        
        // Обновляем пользователя
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('telegram_id', telegramUser.id.toString())
          .select();
        
        if (updateError) {
          telegramLogger.error('Ошибка при обновлении пользователя', updateError, telegramUser.id.toString());
          return;
        }
        
        telegramLogger.info('Пользователь успешно обновлен', { updatedUser }, telegramUser.id.toString());
      } else {
        // Создаем нового пользователя
        // Генерируем уникальный ID для нового пользователя
        const userId = uuidv4();
        telegramLogger.info('Создание нового пользователя', { userId }, telegramUser.id.toString());
        
        // Добавляем id и created_at для нового пользователя
        const newUserData = {
          ...userData,
          id: userId,
          created_at: new Date().toISOString(),
          preferences: {}
        };
        
        // Создаем пользователя
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select();
        
        if (insertError) {
          telegramLogger.error('Ошибка при создании пользователя', insertError, telegramUser.id.toString());
          return;
        }
        
        telegramLogger.info('Пользователь успешно создан', { newUser }, telegramUser.id.toString());
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
      
      // Получаем данные пользователя через SDK
      try {
        const { user: telegramUser } = retrieveLaunchParams();
        if (telegramUser) {
          const typedUser = telegramUser as unknown as TelegramUser;
          telegramLogger.info('Получены данные пользователя через retrieveLaunchParams', {
            id: typedUser.id,
            username: typedUser.username,
            hasPhotoUrl: !!typedUser.photo_url
          });
          setUser(typedUser);
          
          // Создаем или обновляем пользователя в Supabase
          createUserInSupabase(typedUser);
        } else {
          // Пытаемся получить данные из initDataUnsafe как запасной вариант
          if (tgWebApp.initDataUnsafe && tgWebApp.initDataUnsafe.user) {
            const backupTelegramUser = tgWebApp.initDataUnsafe.user;
            telegramLogger.info('Получены данные пользователя из Telegram WebApp initDataUnsafe (запасной вариант)', {
              id: backupTelegramUser.id,
              hasPhotoUrl: !!backupTelegramUser.photo_url
            });
            setUser(backupTelegramUser);
            
            // Создаем или обновляем пользователя в Supabase
            createUserInSupabase(backupTelegramUser);
          } else {
            telegramLogger.error('Не удалось получить данные пользователя ни через SDK, ни через WebApp');
          }
        }
      } catch (error) {
        telegramLogger.error('Ошибка при получении данных пользователя через SDK', error);
        
        // Пытаемся получить данные из initDataUnsafe как запасной вариант
        if (tgWebApp.initDataUnsafe && tgWebApp.initDataUnsafe.user) {
          const backupTelegramUser = tgWebApp.initDataUnsafe.user;
          telegramLogger.info('Получены данные пользователя из Telegram WebApp initDataUnsafe (после ошибки SDK)', backupTelegramUser);
          setUser(backupTelegramUser);
          
          // Создаем или обновляем пользователя в Supabase
          createUserInSupabase(backupTelegramUser);
        } else {
          telegramLogger.warn('Пользователь не найден в Telegram WebApp initDataUnsafe');
        }
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