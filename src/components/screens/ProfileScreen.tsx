import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTelegram } from '@/context/TelegramContext';
import { useAuth } from '@/context/AuthContext'; // Для данных пользователя из Supabase
import useHapticFeedback from '@/hooks/useHapticFeedback';
import logger from '@/lib/logger';
import Link from 'next/link'; // Для навигационных ссылок

interface ProfileScreenProps {
  onClose: () => void;
  // Убираем старые обработчики, т.к. навигация будет через Link или router
}

// Моковые данные для графика, пока нет реальных
const weeklyActivityData = [
  { day: '13', value: 0 },
  { day: '20', value: 0 },
  { day: '27', value: 0 },
  { day: 'фев', value: 0 }, // Предположим, это начало месяца
  { day: '10', value: 0 },
  { day: '17', value: 8 }, // Пример значения
  { day: '24', value: 0 },
  { day: 'мар', value: 0 },
];

const ProfileScreen = ({ onClose }: ProfileScreenProps) => {
  const { user: telegramUser, webApp, isFullScreenEnabled, telegramHeaderPadding } = useTelegram();
  const { userData: supabaseUserData, isLoading: authLoading } = useAuth(); // Данные из public.users
  const haptic = useHapticFeedback();
  const profileLogger = logger.createLogger('ProfileScreen');

  const [remainingDays, setRemainingDays] = useState(26); // Мок: Осталось дней в подписке
  const [avgMinutesPerDay, setAvgMinutesPerDay] = useState(20); // Мок: Средний показатель

  useEffect(() => {
    profileLogger.info('Профиль открыт', { telegramUser, supabaseUserData });
    // Здесь можно будет загружать реальные данные о подписке и активности
  }, [profileLogger, telegramUser, supabaseUserData]);

  const userToDisplay = supabaseUserData || telegramUser;

  // Обработчик для кнопки "Закрыть"
  const handleClose = () => {
    haptic.buttonClick();
    profileLogger.info('Закрытие профиля');
    onClose();
  };
  
  // Максимальное значение для нормализации высоты столбцов графика
  const maxGraphValue = Math.max(...weeklyActivityData.map(d => d.value), 1); // Минимум 1, чтобы избежать деления на 0

  return (
    <div 
      className="fixed inset-0 bg-white z-50 flex flex-col text-black font-['Inter',_sans-serif]"
      style={{ paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="ml-2 text-gray-700 font-medium">Закрыть</span>
        </button>
        <div className="text-lg font-semibold">Ученик</div>
        <button className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
          {/* Иконка троеточия */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Информация о пользователе */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 mb-4">
            {userToDisplay?.photo_url ? (
              <Image
                src={userToDisplay.photo_url}
                alt={userToDisplay.first_name || 'Профиль'}
                width={96}
                height={96}
                className="rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-medium text-gray-500">
                {userToDisplay?.first_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-semibold mb-1">
            Привет, {userToDisplay?.first_name || 'Ученик'}
          </h2>
          <p className="text-sm text-gray-500">
            Осталось в Nova: {remainingDays} дней
          </p>
        </div>

        {/* Статистика активности */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold mb-1">20 мин. на этой неделе</h3>
          <p className="text-xs text-gray-500 mb-4">Средний показатель за день: {avgMinutesPerDay} мин.</p>
          
          <div className="flex justify-between items-end h-32 space-x-1">
            {weeklyActivityData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gray-700 rounded-t-md transition-all duration-500 ease-out"
                  style={{ height: `${(item.value / maxGraphValue) * 100}%` }}
                ></div>
                <span className="mt-1 text-xs text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
           <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>0с</span>
            <span>5м</span>
            <span>30м</span>
            <span>1ч</span>
          </div>
        </div>

        {/* Меню */}
        <div className="space-y-3">
          {[
            { label: 'Продлить подписку', href: '/subscribe' }, // Пример раута
            { label: 'До / После', href: '/before-after' },
            { label: 'Добавить на рабочий стол', action: () => profileLogger.info('Добавить на рабочий стол') },
            { label: 'Поддержка', href: '/support' },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                haptic.buttonClick();
                if (item.action) item.action();
                // Для ссылок можно использовать router.push(item.href) если Link не подходит
                profileLogger.info(`Нажатие на пункт меню: ${item.label}`);
                if(item.href && !item.action) {
                  // onClose(); // Возможно, закрывать профиль при переходе
                  // Тут нужна логика навигации, если это не просто action
                   profileLogger.info(`Переход по ссылке: ${item.href}`);
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <span className="text-base font-medium">{item.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen; 