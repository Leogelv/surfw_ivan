'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';
import logger from '@/lib/logger';
import ProfileScreen from '@/components/screens/ProfileScreen';

function YogaApp() {
  const { userData, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const [activeTab, setActiveTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { isFullScreenEnabled, webApp, telegramHeaderPadding, initializeTelegramApp, user } = useTelegram();
  const appLogger = logger.createLogger('YogaApp');

  useEffect(() => {
    // Проверка, находимся ли мы в контексте Telegram или в обычном браузере
    const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
    
    appLogger.info('Инициализация приложения', { isTelegramWebApp, user });
    
    // Инициализация Telegram WebApp только если он доступен
    if (isTelegramWebApp && webApp) {
      // Переопределяем метод initializeTelegramApp для нашего нового интерфейса
      const customInitializeTelegram = () => {
        // Проверяем наличие Telegram WebApp
        if (!webApp) {
          appLogger.warn('Telegram WebApp недоступен, запуск в режиме браузера');
          return;
        }
        
        try {
          // Подготовка приложения
          webApp.ready();
          appLogger.info('Telegram WebApp готов');
          
          // Расширение на весь экран
          if (typeof webApp.expand === 'function') {
            webApp.expand();
            appLogger.debug('Расширение окна приложения');
          }
          
          // Запрос на полноэкранный режим
          if (typeof webApp.requestFullscreen === 'function') {
            try {
              webApp.requestFullscreen();
              appLogger.debug('Запрошен полноэкранный режим');
            } catch (err) {
              appLogger.warn('requestFullscreen не поддерживается в этой версии Telegram WebApp');
            }
          }
          
          // Отключение вертикальных свайпов
          if (typeof webApp.disableVerticalSwipes === 'function') {
            webApp.disableVerticalSwipes();
            appLogger.debug('Вертикальные свайпы отключены');
          }
          
          // Установка цветов для нового йога-приложения
          if (typeof webApp.setHeaderColor === 'function') {
            webApp.setHeaderColor('#FFFFFF'); // Белый для заголовка
            appLogger.debug('Установлен цвет заголовка');
          }
          
          if (typeof webApp.setBackgroundColor === 'function') {
            webApp.setBackgroundColor('#F5F5F5'); // Светло-серый для фона
            appLogger.debug('Установлен цвет фона');
          }
        } catch (error) {
          appLogger.error('Ошибка инициализации Telegram WebApp:', error);
        }
      };
      
      customInitializeTelegram();
    } else {
      appLogger.info('Запуск в режиме браузера, пропуск инициализации Telegram WebApp');
    }
  }, [webApp, user, appLogger]);

  // Устанавливаем CSS-переменную для отступа в зависимости от режима фулскрин
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Проверка, находимся ли мы в контексте Telegram
      const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
      
      // Устанавливаем отступы только если мы в Telegram и включен полноэкранный режим
      if (isTelegramWebApp && isFullScreenEnabled) {
        document.documentElement.style.setProperty(
          '--telegram-header-padding', 
          `${telegramHeaderPadding}px`
        );
        document.documentElement.style.setProperty(
          '--telegram-header-gradient',
          'linear-gradient(to bottom, #FFFFFF 90%, #FFFFFF 95%)'
        );
        appLogger.debug('Установлены CSS-переменные для отступов');
      } else {
        // В обычном браузере или если не в полноэкранном режиме
        document.documentElement.style.setProperty('--telegram-header-padding', '0px');
        document.documentElement.style.setProperty('--telegram-header-gradient', 'none');
        appLogger.debug('Сброшены CSS-переменные для отступов');
      }
    }
  }, [isFullScreenEnabled, telegramHeaderPadding, appLogger]);

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
    appLogger.info('Переключение профиля', { newState: !showProfile }, user?.id?.toString());
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    setShowProfile(false);
    appLogger.info('Переход на главную', null, user?.id?.toString());
  };

  const handleCartClick = () => {
    setActiveTab('cart');
    setShowProfile(false);
    appLogger.info('Переход в корзину', null, user?.id?.toString());
  };

  const handleOrdersClick = () => {
    setActiveTab('orders');
    setShowProfile(false);
    appLogger.info('Переход в заказы', null, user?.id?.toString());
  };

  // Логирование пользовательских данных
  useEffect(() => {
    if (user) {
      appLogger.info('Данные пользователя Telegram получены', { user });
    } else {
      appLogger.warn('Данные пользователя Telegram недоступны');
    }
    
    if (userData) {
      appLogger.info('Данные пользователя из Auth получены', { userData });
    }
  }, [user, userData, appLogger]);

  // Если отображается профиль, показываем компонент ProfileScreen
  if (showProfile) {
    return (
      <ProfileScreen 
        onClose={() => setShowProfile(false)}
        onHomeClick={handleHomeClick}
        onCartClick={handleCartClick}
        onOrdersClick={handleOrdersClick}
      />
    );
  }

  return (
    <div className="h-screen bg-zinc-100 flex flex-col">
      {/* Градиентный оверлей для верхней части Telegram WebApp */}
      {isFullScreenEnabled && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: `${telegramHeaderPadding}px`,
            background: 'var(--telegram-header-gradient)'
          }}
        ></div>
      )}
      
      {/* Основной контент с учетом отступа */}
      <div 
        className="flex-1 flex flex-col"
        style={{ 
          paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0',
          transition: 'padding-top 0.3s ease'
        }}
      >
        {/* Добавляем силуэт человека над UI карточками */}
        <div className="relative w-full flex justify-center">
          <div className="absolute top-12 z-0 opacity-5">
            <svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
              <path d="M100,0 C120,0 135,15 135,40 C135,65 120,80 100,80 C80,80 65,65 65,40 C65,15 80,0 100,0 Z M65,85 L135,85 L135,170 L160,230 L130,230 L115,190 L115,300 L85,300 L85,190 L70,230 L40,230 L65,170 L65,85 Z" fill="black"/>
            </svg>
          </div>
        </div>

        {/* Остальной контент */}
        <div className={`flex-1 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {/* Верхняя часть */}
          <div className="relative">
            {/* Заголовок с именем пользователя и кнопками */}
            <div className="flex justify-between items-center p-4 w-full absolute top-0 z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {userData?.photo_url ? (
                    <Image 
                      src={userData.photo_url} 
                      alt="Profile" 
                      width={40} 
                      height={40} 
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-500">
                      {userData?.first_name?.charAt(0) || user?.first_name?.charAt(0) || 'У'}
                    </span>
                  )}
                </div>
                <span className="text-black font-medium ml-2">
                  {user ? `${user.first_name || ''} ${user.last_name || ''}` : userData?.first_name || 'Гость'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 text-xl">{stats.power}</div>
                <div className="bg-white rounded-full p-2">
                  <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                    <path d="M10 18L8.55 16.55C6.8 14.8 5.35833 13.275 4.225 11.975C3.09167 10.675 2.18333 9.51667 1.5 8.5C0.816667 7.48333 0.354167 6.54167 0.1125 5.675C0.0375 4.80833 0 3.93333 0 3.05C0 1.35 0.554167 0 1.6625 0C2.77083 0 3.75 0.516667 4.6 1.55L10 7.05L15.4 1.55C16.25 0.516667 17.2292 0 18.3375 0C19.4458 0 20 1.35 20 3.05C20 3.93333 19.9625 4.80833 19.8875 5.675C19.8125 6.54167 19.35 7.48333 18.5 8.5C17.65 9.51667 16.7417 10.675 15.775 11.975C14.8083 13.275 13.4833 14.8 11.45 16.55L10 18Z" fill="black"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Центральная иллюстрация */}
            <div className="w-full flex justify-center items-center pt-16 pb-8">
              <div className="relative w-64 h-64">
                <Image
                  src="/yoga-app/meditation.svg"
                  alt="Йога"
                  layout="fill"
                  objectFit="contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-white rounded-t-3xl flex flex-col flex-1">
            {/* Показатели */}
            <div className="px-6 pt-8 pb-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold">{stats.power}</div>
                <div className="text-gray-500 text-sm uppercase tracking-wider">ТВОЯ СИЛА</div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold">{stats.practiceMinutes}</div>
                  <div className="text-gray-500 text-sm uppercase tracking-wider">МИНУТ ПРАКТИКИ</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold">{stats.streak}</div>
                  <div className="text-gray-500 text-sm uppercase tracking-wider">ДНЕЙ В ПОТОКЕ</div>
                </div>
              </div>
            </div>

            {/* Кнопка "Выбрать практику" */}
            <Link href="/practice">
              <div className="mx-6 mb-6 bg-gray-100 rounded-full px-6 py-4 flex justify-between items-center">
                <span className="text-lg font-medium">Выбрать практику</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M8.33334 5.83334L12.5 10L8.33334 14.1667" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Навигация - закрепляем внизу экрана */}
      <div className="border-t border-gray-200 grid grid-cols-4 px-4 bg-white sticky bottom-0 mt-auto">
        <button 
          className={`flex flex-col items-center py-3 ${activeTab === 'home' ? 'text-black' : 'text-gray-400'}`}
          onClick={() => {
            setActiveTab('home');
            appLogger.info('Переход на вкладку Главная', null, user?.id?.toString());
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 10.25V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V10.25M3 10.25L12 3L21 10.25M3 10.25L4.5 11.5M21 10.25L19.5 11.5" 
              stroke={activeTab === 'home' ? 'black' : 'currentColor'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1">Главная</span>
        </button>
        
        <button 
          className={`flex flex-col items-center py-3 ${activeTab === 'library' ? 'text-black' : 'text-gray-400'}`}
          onClick={() => {
            setActiveTab('library');
            appLogger.info('Переход на вкладку Библиотека');
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5.5V3M12 5.5V8M12 5.5H8M19 21V19C19 17.9 18.1 17 17 17H7C5.9 17 5 17.9 5 19V21H19ZM12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" 
              stroke={activeTab === 'library' ? 'black' : 'currentColor'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1">Библиотека</span>
        </button>
        
        <button 
          className={`flex flex-col items-center py-3 ${activeTab === 'schedule' ? 'text-black' : 'text-gray-400'}`}
          onClick={() => {
            setActiveTab('schedule');
            appLogger.info('Переход на вкладку Расписание');
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
              stroke={activeTab === 'schedule' ? 'black' : 'currentColor'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1">Расписание</span>
        </button>
        
        <button 
          className={`flex flex-col items-center py-3 ${activeTab === 'profile' ? 'text-black' : 'text-gray-400'}`}
          onClick={() => {
            setActiveTab('profile');
            toggleProfile();
            appLogger.info('Переход в профиль', null, user?.id?.toString());
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" 
              fill={activeTab === 'profile' ? 'black' : 'currentColor'} />
          </svg>
          <span className="text-xs mt-1">Профиль</span>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TelegramProvider>
      <YogaApp />
    </TelegramProvider>
  );
}