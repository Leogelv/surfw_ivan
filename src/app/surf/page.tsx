'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import HomeScreen from '../../components/Surf/HomeScreen';
import CategoriesScreen from '../../components/Surf/CategoriesScreen';
import ProductScreen from '../../components/Surf/ProductScreen';

export default function SurfPage() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'categories' | 'product'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов

  // Обновляем время каждую минуту
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Проверяем, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Функция для анимированного перехода между экранами
  const transitionTo = (screen: 'home' | 'categories' | 'product', callback?: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (callback) callback();
      setCurrentScreen(screen);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  // Обработчики переходов между экранами
  const goToCategories = (category?: string) => {
    transitionTo('categories', () => {
      setSelectedCategory(category || '');
    });
  };

  const goToProduct = (product: string) => {
    transitionTo('product', () => {
      setSelectedProduct(product);
    });
  };

  const goHome = () => {
    transitionTo('home');
  };

  const goToCart = () => {
    // Вибрация (если доступна)
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Здесь будет переход в корзину (пока просто заглушка)
    setTimeout(() => {
      alert('Переход в корзину');
    }, 100);
  };

  // Отображение приложения без рамки на мобильных устройствах
  if (isMobile) {
    return (
      <div className="h-screen bg-black">
        {/* Статус бар */}
        <div className="h-7 flex justify-between items-center px-5 text-xs text-white z-20">
          <span>{currentTime || '9:41'}</span>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.33 4.67L10.8 6.2C13.89 6.91 16.31 9.33 17.02 12.42L18.55 10.89C17.46 7.01 14.2 3.75 10.33 2.67V1H9.33V3C9.67 3 10.01 3.02 10.33 3.05L9.39 3.99C6.25 4.6 3.6 7.25 2.99 10.39L2.05 10.07C2.02 9.75 2 9.41 2 9.07V7.07H1V13.07H7V12.07H5C5 8.19 8.19 5 12.07 5L12.33 4.67ZM19 19.07V21.07H13V20.07H15C15 16.19 11.81 13 7.93 13L7.67 13.33L9.2 14.87C6.11 15.58 3.69 18 2.98 21.09L1.45 19.56C2.54 15.68 5.8 12.42 9.67 11.33V9.67C4.92 10.82 1.33 15.12 1.33 20.07H0.33V22.07H2.33C2.33 17.86 5.12 14.33 8.95 13.25L9.89 14.19C13.03 14.8 15.68 17.45 16.29 20.59L15.35 20.91C15.04 20.93 14.7 20.95 14.36 20.95V22.95H15.36V20.95C19.24 19.87 22.04 16.31 22.04 12.07H24.04V11.07H22.04C22.04 15.02 18.45 18.32 14.36 19.47V19.07H19Z" />
            </svg>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" />
            </svg>
            <div className="relative w-5">
              <div className="absolute inset-0 flex items-end">
                <div className="w-1 h-1 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-2 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-3 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-4 bg-white rounded-sm"></div>
              </div>
            </div>
            <div className="text-xs font-bold">100%</div>
          </div>
        </div>

        {/* Текущий экран с анимацией перехода */}
        <div className={`h-[calc(100vh-7px)] transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentScreen === 'home' && (
            <HomeScreen onCategoryClick={goToCategories} onMenuClick={goToCategories} onCartClick={goToCart} />
          )}
          {currentScreen === 'categories' && (
            <CategoriesScreen 
              selectedCategory={selectedCategory} 
              onProductClick={goToProduct} 
              onHomeClick={goHome} 
              onCartClick={goToCart} 
            />
          )}
          {currentScreen === 'product' && (
            <ProductScreen 
              productName={selectedProduct} 
              onBackClick={() => goToCategories(selectedCategory)} 
              onCartClick={goToCart} 
            />
          )}
        </div>
      </div>
    );
  }

  // Отображение приложения с рамкой телефона на компьютерах
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      {/* Контейнер для телефона */}
      <div className="relative w-full max-w-sm h-[750px] mx-auto overflow-hidden rounded-[40px] border-8 border-black shadow-2xl bg-black">
        {/* Отражение на экране */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent z-10 pointer-events-none"></div>
        
        {/* Выемка для динамика и камеры */}
        <div className="absolute top-0 left-0 right-0 z-20 h-7 bg-black flex justify-center">
          <div className="absolute top-0 w-40 h-7 bg-black rounded-b-2xl flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-700"></div>
            <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-700"></div>
            </div>
            <div className="w-16 h-2 rounded-full bg-gray-800"></div>
          </div>
        </div>

        {/* Статус бар */}
        <div className="absolute top-7 left-0 right-0 h-5 flex justify-between items-center px-5 text-xs text-white z-20">
          <span>{currentTime || '9:41'}</span>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.33 4.67L10.8 6.2C13.89 6.91 16.31 9.33 17.02 12.42L18.55 10.89C17.46 7.01 14.2 3.75 10.33 2.67V1H9.33V3C9.67 3 10.01 3.02 10.33 3.05L9.39 3.99C6.25 4.6 3.6 7.25 2.99 10.39L2.05 10.07C2.02 9.75 2 9.41 2 9.07V7.07H1V13.07H7V12.07H5C5 8.19 8.19 5 12.07 5L12.33 4.67ZM19 19.07V21.07H13V20.07H15C15 16.19 11.81 13 7.93 13L7.67 13.33L9.2 14.87C6.11 15.58 3.69 18 2.98 21.09L1.45 19.56C2.54 15.68 5.8 12.42 9.67 11.33V9.67C4.92 10.82 1.33 15.12 1.33 20.07H0.33V22.07H2.33C2.33 17.86 5.12 14.33 8.95 13.25L9.89 14.19C13.03 14.8 15.68 17.45 16.29 20.59L15.35 20.91C15.04 20.93 14.7 20.95 14.36 20.95V22.95H15.36V20.95C19.24 19.87 22.04 16.31 22.04 12.07H24.04V11.07H22.04C22.04 15.02 18.45 18.32 14.36 19.47V19.07H19Z" />
            </svg>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" />
            </svg>
            <div className="relative w-5">
              <div className="absolute inset-0 flex items-end">
                <div className="w-1 h-1 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-2 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-3 bg-white rounded-sm mr-[2px]"></div>
                <div className="w-1 h-4 bg-white rounded-sm"></div>
              </div>
            </div>
            <div className="text-xs font-bold">100%</div>
          </div>
        </div>

        {/* Текущий экран с анимацией перехода */}
        <div className={`h-full pt-12 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {currentScreen === 'home' && (
            <HomeScreen onCategoryClick={goToCategories} onMenuClick={goToCategories} onCartClick={goToCart} />
          )}
          {currentScreen === 'categories' && (
            <CategoriesScreen 
              selectedCategory={selectedCategory} 
              onProductClick={goToProduct} 
              onHomeClick={goHome} 
              onCartClick={goToCart} 
            />
          )}
          {currentScreen === 'product' && (
            <ProductScreen 
              productName={selectedProduct} 
              onBackClick={() => goToCategories(selectedCategory)} 
              onCartClick={goToCart} 
            />
          )}
        </div>

        {/* Индикатор внизу с улучшенным дизайном */}
        <div className="absolute bottom-0 left-0 right-0 h-5 flex justify-center items-center">
          <div className="w-32 h-1 bg-white/20 rounded-full mb-1"></div>
        </div>
        
        {/* Боковые кнопки телефона */}
        <div className="absolute top-20 -right-2 h-12 w-1 bg-gray-800 rounded-l-full"></div>
        <div className="absolute top-36 -right-2 h-16 w-1 bg-gray-800 rounded-l-full"></div>
        <div className="absolute top-20 -left-2 h-16 w-1 bg-gray-800 rounded-r-full"></div>
      </div>
    </div>
  );
} 