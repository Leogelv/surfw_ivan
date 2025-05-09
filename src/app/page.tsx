'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';

function YogaApp() {
  const { userData, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const [activeTab, setActiveTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { isFullScreenEnabled, webApp, telegramHeaderPadding, initializeTelegramApp } = useTelegram();

  useEffect(() => {
    // Проверка, находимся ли мы в контексте Telegram или в обычном браузере
    const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
    
    // Инициализация Telegram WebApp только если он доступен
    if (isTelegramWebApp && webApp) {
      // Переопределяем метод initializeTelegramApp для нашего нового интерфейса
      const customInitializeTelegram = () => {
        // Проверяем наличие Telegram WebApp
        if (!webApp) {
          console.log('Telegram WebApp is not available, possibly running in browser mode');
          return;
        }
        
        try {
          // Подготовка приложения
          webApp.ready();
          
          // Расширение на весь экран
          if (typeof webApp.expand === 'function') {
            webApp.expand();
          }
          
          // Запрос на полноэкранный режим
          if (typeof webApp.requestFullscreen === 'function') {
            try {
              webApp.requestFullscreen();
            } catch (err) {
              console.log('requestFullscreen is not supported in this Telegram WebApp version');
            }
          }
          
          // Отключение вертикальных свайпов
          if (typeof webApp.disableVerticalSwipes === 'function') {
            webApp.disableVerticalSwipes();
          }
          
          // Установка цветов для нового йога-приложения
          if (typeof webApp.setHeaderColor === 'function') {
            webApp.setHeaderColor('#FFFFFF'); // Белый для заголовка
          }
          
          if (typeof webApp.setBackgroundColor === 'function') {
            webApp.setBackgroundColor('#F5F5F5'); // Светло-серый для фона
          }
        } catch (error) {
          console.error('Failed to initialize Telegram WebApp:', error);
        }
      };
      
      customInitializeTelegram();
    } else {
      console.log('Running in browser mode, skipping Telegram WebApp initialization');
    }
  }, [webApp]);

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
      } else {
        // В обычном браузере или если не в полноэкранном режиме
        document.documentElement.style.setProperty('--telegram-header-padding', '0px');
        document.documentElement.style.setProperty('--telegram-header-gradient', 'none');
      }
    }
  }, [isFullScreenEnabled, telegramHeaderPadding]);

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
  };

  const contentStyle = {
    paddingTop: 'var(--telegram-header-padding)',
    transition: 'padding-top 0.3s ease'
  };

  return (
    <div style={contentStyle} className="h-screen bg-zinc-100">
      {/* Градиентный оверлей для верхней части Telegram WebApp */}
      {isFullScreenEnabled && typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: `${telegramHeaderPadding}px`,
            background: 'var(--telegram-header-gradient)'
          }}
        ></div>
      )}
      <div className={`h-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
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
                    {userData?.first_name?.charAt(0) || 'У'}
                  </span>
                )}
              </div>
              <span className="text-black font-medium ml-2">
                {userData?.first_name || 'Иван'}
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

          {/* Навигация */}
          <div className="mt-auto border-t border-gray-200 grid grid-cols-4 px-4">
            <button 
              className={`flex flex-col items-center py-3 ${activeTab === 'home' ? 'text-black' : 'text-gray-400'}`}
              onClick={() => setActiveTab('home')}
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
              onClick={() => setActiveTab('library')}
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
              onClick={() => setActiveTab('schedule')}
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
              onClick={() => setActiveTab('profile')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" 
                  stroke={activeTab === 'profile' ? 'black' : 'currentColor'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path d="M2.90625 20.2491C3.82834 18.6531 5.1542 17.3278 6.75064 16.4064C8.34708 15.485 10.1579 15 12.0011 15C13.8444 15 15.6552 15.4851 17.2516 16.4066C18.848 17.3281 20.1738 18.6533 21.0959 20.2494" 
                  stroke={activeTab === 'profile' ? 'black' : 'currentColor'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-1">Профиль</span>
            </button>
          </div>
        </div>
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