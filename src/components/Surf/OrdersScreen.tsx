import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OrdersScreenProps {
  onBackClick: () => void;
}

// Типы для заказов
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  items: OrderItem[];
  total: number;
  created: string;
  estimatedTime: number; // в минутах
  spot: string;
}

const OrdersScreen = ({ onBackClick }: OrdersScreenProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Демо-данные для заказов
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '2589',
      status: 'preparing',
      items: [
        { name: 'Капучино', quantity: 1, price: 350, size: 'Средний' },
        { name: 'Круассан', quantity: 1, price: 220 }
      ],
      total: 570,
      created: '15 июн, 14:30',
      estimatedTime: 8,
      spot: 'Кофейня Surf на Ленина'
    },
    {
      id: '2588',
      status: 'ready',
      items: [
        { name: 'Американо', quantity: 2, price: 280, size: 'Большой' },
        { name: 'Тост с авокадо', quantity: 1, price: 450 }
      ],
      total: 1010,
      created: '15 июн, 14:15',
      estimatedTime: 0,
      spot: 'Кофейня Surf на Ленина'
    }
  ]);

  // Анимация загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Получить заголовок для статуса
  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: 'Принят',
      preparing: 'Готовится',
      ready: 'Готов к выдаче',
      completed: 'Выполнен'
    };
    return statusMap[status];
  };

  // Получить цвет для статуса
  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      pending: 'bg-[#A67C52]',
      preparing: 'bg-[#A67C52]',
      ready: 'bg-green-500',
      completed: 'bg-gray-500'
    };
    return colorMap[status];
  };

  // Получить иконку для статуса
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'preparing':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'ready':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  // Получить прогресс для заказа
  const getOrderProgress = (status: Order['status']) => {
    const progressMap = {
      pending: 25,
      preparing: 50,
      ready: 75,
      completed: 100
    };
    return progressMap[status];
  };

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", 
             backgroundSize: "40px 40px"
           }}></div>
           
      {/* Заголовок */}
      <div className="px-6 pt-4 pb-2 relative z-10 flex items-center">
        <button onClick={onBackClick} className="p-2 mr-2 bg-white/5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold flex items-center">
          Мои заказы
          <div className="ml-2 w-2 h-2 rounded-full bg-[#A67C52] animate-pulse"></div>
        </h2>
      </div>
      
      {/* Заказы */}
      <div className="flex-1 overflow-auto px-6 pb-24 relative z-10">
        {orders.length > 0 ? (
          <div className="flex flex-col space-y-6 mt-4">
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                className={`transform transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/30">
                  {/* Шапка заказа */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} mr-2 animate-pulse`}></span>
                          <h4 className="font-bold text-lg">Заказ #{order.id}</h4>
                        </div>
                        <p className="text-sm text-white/60 mt-1">{order.created}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} bg-opacity-20 text-white flex items-center`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Прогресс заказа */}
                    <div className="mt-4">
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 bottom-0 ${getStatusColor(order.status)}`} 
                          style={{ width: `${getOrderProgress(order.status)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/50 mt-1">
                        <span>Принят</span>
                        <span>Готовится</span>
                        <span>Готов</span>
                        <span>Выполнен</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Детали заказа */}
                  <div className="p-4">
                    {/* Место получения */}
                    <div className="mb-3 flex items-start">
                      <svg className="h-5 w-5 text-[#A67C52] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Место получения</p>
                        <p className="text-sm text-white/70">{order.spot}</p>
                      </div>
                    </div>
                    
                    {/* Время готовки */}
                    {order.status === 'preparing' && (
                      <div className="mb-3 flex items-start">
                        <svg className="h-5 w-5 text-[#A67C52] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium">Примерное время готовки</p>
                          <p className="text-sm text-white/70">{order.estimatedTime} минут</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Готов к выдаче */}
                    {order.status === 'ready' && (
                      <div className="mb-3 bg-green-500/20 p-3 rounded-lg flex items-center">
                        <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-medium">Ваш заказ готов! Заберите его на кассе.</p>
                      </div>
                    )}
                    
                    {/* Состав заказа */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Состав заказа:</h5>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <div className="text-white/80">
                              {item.name} {item.size && <span className="text-white/60 text-xs">({item.size})</span>}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-white/60">x{item.quantity}</span>
                              <span>{item.price * item.quantity} ₽</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                        <span className="font-medium">Итого:</span>
                        <span className="font-medium">{order.total} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center h-64 text-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-medium text-white/80 mb-2">У вас нет активных заказов</h3>
            <p className="text-sm text-white/60">Закажите что-нибудь из нашего меню</p>
          </div>
        )}
      </div>
      
      {/* Нижняя кнопка */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-6 py-4 border-t border-white/10">
        <button 
          onClick={onBackClick}
          className="w-full py-4 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-[#A67C52]/30 flex items-center justify-center"
        >
          <span>Вернуться в меню</span>
        </button>
      </div>
    </div>
  );
};

export default OrdersScreen; 