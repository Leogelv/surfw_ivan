'use client';

import React, { useState } from 'react';
import { useCart, CartItem } from './CartContext';
import Image from 'next/image';

interface CartScreenProps {
  onBackClick: () => void;
  onCheckoutClick: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onBackClick, onCheckoutClick }) => {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Обработчик удаления товара с анимацией
  const handleRemove = (itemId: string) => {
    setIsRemoving(itemId);
    
    // Анимация перед удалением
    setTimeout(() => {
      removeFromCart(itemId);
      setIsRemoving(null);
    }, 300);
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
        <h1 className="text-xl font-semibold">Корзина</h1>
        <div className="w-10 h-10"></div> {/* Пустой элемент для выравнивания */}
      </div>

      {/* Содержимое корзины */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,20C19,21.11 18.11,22 17,22C15.89,22 15,21.11 15,20C15,18.89 15.89,18 17,18C18.11,18 19,18.89 19,20M7,18C5.89,18 5,18.89 5,20C5,21.11 5.89,22 7,22C8.11,22 9,21.11 9,20C9,18.89 8.11,18 7,18M7.2,14.63L7.17,14.75C7.17,14.89 7.28,15 7.42,15H19.58C19.72,15 19.83,14.89 19.83,14.75L19.8,14.63L18.5,11H8.5L7.2,14.63M17.31,10L19,13.07V10H17.31M1,10V12H7V10M9,6.5V10H11.07L9,6.5M13,10H15V6.5L13,10M17,10H19V6.5L17,10M9.28,4.48L11.78,9.5H16.22L18.72,4.48L15.37,7.31L13,4L10.63,7.31L7.28,4.48Z" />
            </svg>
            <p className="text-lg">Ваша корзина пуста</p>
            <button 
              onClick={onBackClick}
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
            >
              Вернуться к меню
            </button>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li 
                  key={item.id} 
                  className={`bg-gray-800/50 backdrop-blur-md rounded-xl p-3 flex items-center transition-all duration-300 
                    ${isRemoving === item.id ? 'opacity-0 scale-95 transform' : 'opacity-100'}`}
                >
                  {/* Изображение товара */}
                  <div className="w-16 h-16 relative bg-gray-700 rounded-lg overflow-hidden">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 64px) 100vw, 64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2,17H22V19H2V17M6.25,7H9V6H6V3H14V6H11V7H17.8C18.8,7 19.8,8 20,9L20.5,16H3.5L4.05,9C4.05,8 5.05,7 6.25,7M13,9V11H18V9H13M6,9V10H8V9H6M9,9V10H11V9H9M6,11V12H8V11H6M9,11V12H11V11H9M6,13V14H8V13H6M9,13V14H11V13H9M7,4V5H13V4H7Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Информация о товаре */}
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                      </button>
                    </div>
                    
                    {item.size && (
                      <p className="text-sm text-gray-400">Размер: {item.size}</p>
                    )}
                    
                    {item.options && item.options.length > 0 && (
                      <p className="text-sm text-gray-400">
                        {item.options.join(', ')}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-gray-700 rounded-full">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
                          disabled={item.quantity <= 1}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,13H5V11H19V13Z" />
                          </svg>
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                          </svg>
                        </button>
                      </div>
                      <p className="font-bold">{(item.price * item.quantity).toFixed(0)} ₽</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Нижняя панель с итогами и кнопкой */}
      {items.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md p-4 border-t border-gray-800">
          <div className="flex justify-between mb-3">
            <span className="text-gray-400">Итого:</span>
            <span className="font-bold text-xl">{getTotalPrice().toFixed(0)} ₽</span>
          </div>
          <button 
            onClick={onCheckoutClick}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
          >
            Оформить заказ
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartScreen; 