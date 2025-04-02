'use client';

import React, { useState, useEffect } from 'react';
import { useCart, DeliveryAddress } from './CartContext';
import Image from 'next/image';

// Объявление типа для Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

interface CheckoutScreenProps {
  onBackClick: () => void;
  onOrderPlaced: () => void;
}

// Данные о спотах Surf Coffee
const SPOTS = [
  {
    id: 'krasnaya-polyana',
    name: 'Surf Coffee Красная Поляна',
    address: 'ул. Горнолыжная, 12, Красная Поляна',
    location: { lat: 43.6798, lng: 40.2948 },
    workHours: '08:00 - 22:00'
  }
];

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onBackClick, onOrderPlaced }) => {
  const { getTotalPrice, address, setAddress, clearCart, setOrderId, setEstimatedTime, setOrderPlaced } = useCart();
  
  const [selectedSpot, setSelectedSpot] = useState(SPOTS[0].id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Загружаем данные из контекста при монтировании
  useEffect(() => {
    if (address) {
      setSelectedSpot(address.spot);
      setName(address.name);
      setPhone(address.phone);
    }
  }, [address]);

  // Форматирование телефонного номера
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 1) {
      return `+7 (${numbers}`;
    } else if (numbers.length <= 4) {
      return `+7 (${numbers.substring(0, 3)}${numbers.length > 3 ? ') ' + numbers.substring(3) : ''}`;
    } else if (numbers.length <= 7) {
      return `+7 (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}${numbers.length > 6 ? '-' + numbers.substring(6) : ''}`;
    } else if (numbers.length <= 9) {
      return `+7 (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}-${numbers.substring(6, 8)}${numbers.length > 8 ? '-' + numbers.substring(8) : ''}`;
    } else {
      return `+7 (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}-${numbers.substring(6, 8)}-${numbers.substring(8, 10)}`;
    }
  };

  // Обработчик изменения телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value);
    setPhone(formattedPhone);
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Введите ваше имя';
    }
    
    // Проверка телефона (должен быть в формате +7 (XXX) XXX-XX-XX)
    const phonePattern = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
    if (!phone || !phonePattern.test(phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Сохраняем адрес доставки
    const deliveryAddress: DeliveryAddress = {
      spot: selectedSpot,
      name,
      phone
    };
    setAddress(deliveryAddress);
    
    // Генерируем случайный номер заказа
    const orderId = Math.floor(100000 + Math.random() * 900000).toString();
    setOrderId(orderId);
    
    // Генерируем случайное время приготовления (от 10 до 30 минут)
    const estimatedTime = Math.floor(10 + Math.random() * 21);
    setEstimatedTime(estimatedTime);
    
    // Устанавливаем флаг размещения заказа
    setOrderPlaced(true);
    
    // Имитация отправки заказа на сервер
    setTimeout(() => {
      setIsSubmitting(false);
      onOrderPlaced();
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Шапка */}
      <div className="p-4 flex items-center justify-between bg-black/30 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBackClick} className="flex items-center justify-center w-10 h-10">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Оформление заказа</h1>
        <div className="w-10 h-10"></div> {/* Пустой элемент для выравнивания */}
      </div>

      {/* Содержимое формы */}
      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Карта (статическое изображение вместо Google Maps) */}
          <div className="rounded-xl overflow-hidden h-48 mb-6 bg-gray-800 relative">
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2">
                  <svg className="w-8 h-8 mx-auto text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                  </svg>
                </div>
                <p className="text-blue-300 font-medium">Surf Coffee Красная Поляна</p>
                <p className="text-gray-400 text-sm">ул. Горнолыжная, 12</p>
              </div>
            </div>
          </div>
          
          {/* Выбор спота */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Выберите спот для самовывоза</label>
            <div className="bg-gray-800 rounded-xl p-3">
              {SPOTS.map(spot => (
                <div 
                  key={spot.id} 
                  className={`p-3 rounded-lg mb-2 last:mb-0 cursor-pointer transition-colors ${
                    selectedSpot === spot.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedSpot(spot.id)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{spot.name}</h3>
                      <p className="text-sm text-gray-300">{spot.address}</p>
                      <p className="text-xs text-gray-400 mt-1">Время работы: {spot.workHours}</p>
                    </div>
                    {selectedSpot === spot.id && (
                      <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Контактные данные */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Контактные данные</h2>
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">Ваше имя</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                }`}
                placeholder="Иван Иванов"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">Номер телефона</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
                }`}
                placeholder="+7 (___) ___-__-__"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>
        </form>
      </div>

      {/* Нижняя панель с итогами и кнопкой */}
      <div className="sticky bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md p-4 border-t border-gray-800">
        <div className="flex justify-between mb-3">
          <span className="text-gray-400">Итого к оплате:</span>
          <span className="font-bold text-xl">{getTotalPrice().toFixed(0)} ₽</span>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-3 font-medium rounded-xl transition-colors flex items-center justify-center ${
            isSubmitting 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Оформление...
            </>
          ) : (
            <>
              Оплатить и оформить
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutScreen; 