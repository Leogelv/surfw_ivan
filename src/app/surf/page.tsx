'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import HomeScreen from '../../components/Surf/HomeScreen';
import CategoriesScreen from '../../components/Surf/CategoriesScreen';
import ProductScreen from '../../components/Surf/ProductScreen';
import CartScreen from '../../components/Surf/CartScreen';
import ProfileScreen from '../../components/Surf/ProfileScreen';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';

function SurfApp() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'categories' | 'product' | 'cart'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<'home' | 'categories' | 'product'>('home');
  
  const { isFullScreenEnabled } = useTelegram();

  // Функция для анимированного перехода между экранами
  const transitionTo = (screen: 'home' | 'categories' | 'product' | 'cart', callback?: () => void) => {
    setIsTransitioning(true);
    // Сохраняем предыдущий экран для возврата из корзины
    if (screen === 'cart' && currentScreen !== 'cart') {
      setPreviousScreen(currentScreen);
    }
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
    transitionTo('cart');
  };

  const goBack = () => {
    // Возвращаемся к предыдущему экрану из корзины
    if (currentScreen === 'cart') {
      if (previousScreen === 'product') {
        goToProduct(selectedProduct);
      } else if (previousScreen === 'categories') {
        goToCategories(selectedCategory);
      } else {
        goHome();
      }
    }
  };

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
  };

  // Кастомный стиль для padding-top в зависимости от полноэкранного режима
  const contentStyle = {
    paddingTop: isFullScreenEnabled ? '50px' : '0',
    transition: 'padding-top 0.3s ease'
  };

  return (
    <div style={contentStyle} className="h-screen bg-black">
      {/* Текущий экран с анимацией перехода */}
      <div className={`h-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {currentScreen === 'home' && (
          <HomeScreen 
            onCategoryClick={goToCategories} 
            onMenuClick={goToCategories} 
            onCartClick={goToCart} 
            onProfileClick={toggleProfile}
            onLogoClick={goHome}
          />
        )}
        {currentScreen === 'categories' && (
          <CategoriesScreen 
            selectedCategory={selectedCategory} 
            onProductClick={goToProduct} 
            onHomeClick={goHome} 
            onCartClick={goToCart}
            onProfileClick={toggleProfile}
            onLogoClick={goHome}
          />
        )}
        {currentScreen === 'product' && (
          <ProductScreen 
            productName={selectedProduct} 
            onBackClick={() => goToCategories(selectedCategory)} 
            onCartClick={goToCart}
            onProfileClick={toggleProfile}
            onLogoClick={goHome}
          />
        )}
        {currentScreen === 'cart' && (
          <CartScreen 
            onBackClick={goBack}
          />
        )}
      </div>

      {/* Профиль (сайдбар) */}
      {showProfile && <ProfileScreen onClose={toggleProfile} />}
    </div>
  );
}

// Оборачиваем приложение в TelegramProvider
export default function SurfPage() {
  return (
    <TelegramProvider>
      <SurfApp />
    </TelegramProvider>
  );
} 