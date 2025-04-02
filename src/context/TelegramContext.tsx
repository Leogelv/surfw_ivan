import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date: string;
    hash: string;
  };
  MainButton: {
    text: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    enable: () => void;
    disable: () => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  platform: string;
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isReady: boolean;
  isFullScreenEnabled: boolean;
  enableFullScreen: () => void;
  disableFullScreen: () => void;
}

// Создаем контекст с дефолтными значениями
const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  isReady: false,
  isFullScreenEnabled: false,
  enableFullScreen: () => {},
  disableFullScreen: () => {},
});

// Хук для использования контекста
export const useTelegram = () => useContext(TelegramContext);

// Провайдер контекста
export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);

  // Инициализация Telegram WebApp
  useEffect(() => {
    // Проверяем, запущено ли приложение внутри Telegram WebApp
    const telegramApp = window.Telegram?.WebApp as TelegramWebApp;
    
    if (telegramApp) {
      setWebApp(telegramApp);
      
      // Получаем данные о пользователе
      if (telegramApp.initDataUnsafe.user) {
        setUser(telegramApp.initDataUnsafe.user);
      } else {
        // Демо пользователь, если приложение открыто не в Telegram
        setUser({
          id: 123456789,
          first_name: 'Гость',
          username: 'guest',
          photo_url: 'https://t.me/i/userpic/320/9Og0qVZFdIf1TYlE25bJ7WJc__peiXnPaZrQ2LNTw88.jpg'
        });
      }
      
      // Сообщаем Telegram, что приложение готово
      telegramApp.ready();
      setIsReady(true);
      
      // Устанавливаем цвета для хедера и фона
      telegramApp.setHeaderColor('#0A0908');
      telegramApp.setBackgroundColor('#1E1B19');
    } else {
      // Если приложение открыто не в Telegram, создаем демо-пользователя
      console.log('Telegram WebApp не обнаружен, используем демо-режим');
      setUser({
        id: 123456789,
        first_name: 'Гость',
        username: 'guest',
        photo_url: 'https://t.me/i/userpic/320/9Og0qVZFdIf1TYlE25bJ7WJc__peiXnPaZrQ2LNTw88.jpg'
      });
      setIsReady(true);
    }
  }, []);

  // Функции для управления полноэкранным режимом
  const enableFullScreen = () => {
    if (webApp) {
      webApp.expand();
      setIsFullScreenEnabled(true);
    }
  };

  const disableFullScreen = () => {
    setIsFullScreenEnabled(false);
  };

  return (
    <TelegramContext.Provider 
      value={{ 
        webApp, 
        user, 
        isReady,
        isFullScreenEnabled,
        enableFullScreen,
        disableFullScreen 
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

// Объявляем интерфейс для Telegram WebApp в глобальном window
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
} 