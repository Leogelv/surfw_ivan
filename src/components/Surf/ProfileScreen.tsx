import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTelegram } from '@/context/TelegramContext';
import useHapticFeedback from '@/hooks/useHapticFeedback';

interface ProfileScreenProps {
  onClose: () => void;
  onHomeClick: () => void;
  onCartClick: () => void;
  onOrdersClick: () => void;
}

const ProfileScreen = ({ onClose, onHomeClick, onCartClick, onOrdersClick }: ProfileScreenProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const { user, webApp, isFullScreenEnabled, telegramHeaderPadding } = useTelegram();
  const haptic = useHapticFeedback();

  // Демо-данные для заказов
  const orders = [
    {
      id: '2548',
      date: '15 мая, 14:32',
      status: 'Выполнен',
      items: [
        { name: 'Капучино (средний)', quantity: 1 },
        { name: 'Эспрессо', quantity: 2 }
      ],
      total: 810
    },
    {
      id: '2532',
      date: '10 мая, 11:15',
      status: 'Выполнен',
      items: [
        { name: 'Латте (большой)', quantity: 1 },
        { name: 'Круассан', quantity: 1 }
      ],
      total: 600
    }
  ];

  // Анимация загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Функция для закрытия профиля и возврата на главную
  const handleCloseAndGoHome = () => {
    haptic.buttonClick(); // Haptic feedback при нажатии
    onHomeClick();
    onClose();
  };

  // Функция для перехода к заказам
  const handleOrdersClick = () => {
    haptic.buttonClick(); // Haptic feedback при нажатии
    onOrdersClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1D1816]/95 backdrop-blur-md z-50 flex flex-col text-white">
      {/* Отступ для Telegram Header */}
      {isFullScreenEnabled && (
        <div style={{ height: `${telegramHeaderPadding}px` }} className="w-full"></div>
      )}
      
      {/* Верхняя часть с данными пользователя */}
      <div className="p-6 relative">
        <button 
          onClick={onHomeClick}
          className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/20 shadow-lg hover:shadow-xl transition-all z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={`flex items-center transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="relative w-20 h-20 mr-4">
            {user?.photo_url ? (
              <Image
                src={user.photo_url}
                alt={user.first_name}
                fill
                className="rounded-full object-cover border-2 border-[#A67C52]/50"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-r from-[#A67C52] to-[#5D4037] flex items-center justify-center text-2xl font-bold">
                {user?.first_name?.charAt(0) || 'G'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1D1816]"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.first_name || 'Гость'} {user?.last_name || ''}</h2>
            <p className="text-white/60 text-sm">
              {user?.username ? `@${user.username}` : 'Пользователь Telegram'}
            </p>
          </div>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className="flex-1 overflow-auto px-6 pb-24">
        {/* Бонусная система */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/30 p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Ваши бонусы</h3>
              <div className="bg-gradient-to-r from-[#A67C52] to-[#5D4037] px-3 py-1 rounded-full text-white text-sm font-medium">
                150 ☕
              </div>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-gradient-to-r from-[#A67C52] to-[#5D4037] rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>0</span>
              <span>До следующего уровня: 75</span>
              <span>225</span>
            </div>
          </div>
        </div>

        {/* История заказов */}
        <div className={`transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            История заказов
            <div className="ml-2 w-1.5 h-1.5 rounded-full bg-[#A67C52] animate-pulse"></div>
          </h3>
          {orders.map((order, index) => (
            <div 
              key={order.id}
              className="bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/10 p-4 mb-4"
            >
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="font-medium">Заказ #{order.id}</h4>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{order.date}</p>
                </div>
                <div className="text-right">
                  <div className="text-white/80">{order.total} ₽</div>
                  <div className="text-xs text-green-500">{order.status}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm text-white/70 flex justify-between">
                    <span>{item.name}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <button 
                className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
                onClick={() => { 
                  haptic.buttonClick(); // Haptic feedback при нажатии
                  handleOrdersClick(); 
                }}
              >
                Повторить заказ
              </button>
            </div>
          ))}
        </div>

        {/* Настройки профиля */}
        <div className={`mt-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-lg font-medium mb-3">Настройки</h3>
          <div className="space-y-2">
            <button 
              className="flex items-center w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => haptic.buttonClick()}
            >
              <svg className="h-5 w-5 mr-3 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-left flex-1">Уведомления</span>
              <div className="w-10 h-5 bg-[#A67C52] rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </button>
            <button 
              className="flex items-center w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => haptic.buttonClick()}
            >
              <svg className="h-5 w-5 mr-3 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-left flex-1">Способы оплаты</span>
              <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              className="flex items-center w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => haptic.buttonClick()}
            >
              <svg className="h-5 w-5 mr-3 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-left flex-1">Адреса доставки</span>
              <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Версия и правовая информация */}
        <div className="mt-8 text-center text-white/40 text-xs">
          <p>Версия 1.0.0</p>
          <p className="mt-1">© 2024 Surf Coffee. Все права защищены.</p>
        </div>
      </div>

      {/* Фиксированное нижнее меню с логотипом */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          {/* Мои заказы */}
          <button 
            className="relative p-3 group" 
            onClick={() => { 
              haptic.buttonClick(); // Haptic feedback при нажатии
              handleOrdersClick(); 
            }}
          >
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div 
            className="cursor-pointer relative" 
            onClick={() => { 
              haptic.buttonClick(); // Haptic feedback при нажатии
              handleCloseAndGoHome(); 
            }}
          >
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={150} 
              height={65} 
              className="h-14 w-auto relative"
            />
          </div>
          
          {/* Закрыть профиль */}
          <button 
            onClick={onHomeClick} 
            className="p-3 relative group bg-black/40 hover:bg-black/60 rounded-full active:scale-95 transition-all shadow-lg border border-white/20"
          >
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen; 