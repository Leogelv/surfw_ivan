'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';

interface OrderScreenProps {
  onHomeClick: () => void;
}

const OrderScreen: React.FC<OrderScreenProps> = ({ onHomeClick }) => {
  const { orderId, estimatedTime, clearCart } = useCart();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Устанавливаем начальное время для таймера
  useEffect(() => {
    if (estimatedTime) {
      setRemainingTime(estimatedTime * 60); // Переводим минуты в секунды
      setIsLoading(false);
    }
  }, [estimatedTime]);

  // Запускаем таймер обратного отсчета
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime === null || prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // Форматирование времени в виде MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Процент оставшегося времени
  const getTimePercentage = (): number => {
    if (remainingTime === null || estimatedTime === null) return 0;
    const totalSeconds = estimatedTime * 60;
    return Math.max(0, (remainingTime / totalSeconds) * 100);
  };

  // Новый заказ (сброс стейта)
  const handleNewOrder = () => {
    clearCart();
    onHomeClick();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg">Загрузка информации о заказе...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Шапка */}
      <div className="p-4 flex items-center justify-between bg-black/30 backdrop-blur-md">
        <div className="w-10 h-10"></div> {/* Пустой элемент для выравнивания */}
        <h1 className="text-xl font-semibold">Ваш заказ</h1>
        <div className="w-10 h-10"></div> {/* Пустой элемент для выравнивания */}
      </div>

      {/* Содержимое с информацией о заказе */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 text-center shadow-xl">
          {/* Анимация успешного заказа */}
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2">Заказ принят!</h2>
          <p className="text-gray-400 mb-6">Ваш заказ успешно оформлен и готовится.</p>

          {/* Номер заказа */}
          <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Номер заказа</p>
            <p className="text-3xl font-bold tracking-wider"># {orderId}</p>
          </div>

          {/* Время приготовления */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-1">Ожидаемое время приготовления</p>
            <p className="text-xl font-semibold">
              {estimatedTime} {estimatedTime === 1 ? 'минута' : 
                estimatedTime && estimatedTime < 5 ? 'минуты' : 'минут'}
            </p>
          </div>

          {/* Таймер */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-2">Осталось времени</p>
            <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-1000"
                style={{ width: `${getTimePercentage()}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center font-bold">
                {remainingTime !== null && remainingTime > 0 ? formatTime(remainingTime) : 'Готово!'}
              </div>
            </div>
          </div>

          {/* Инструкции */}
          <div className="bg-blue-900/30 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <p className="text-sm text-blue-100">
                Пожалуйста, покажите номер заказа бариста при получении. 
                Мы сообщим вам, когда ваш заказ будет готов.
              </p>
            </div>
          </div>

          {/* Кнопка нового заказа */}
          <button
            onClick={handleNewOrder}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
          >
            Новый заказ
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderScreen; 