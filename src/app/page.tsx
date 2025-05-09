'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import HomeScreen from '../components/Surf/HomeScreen';
import CategoriesScreen from '../components/Surf/CategoriesScreen';
import ProductScreen from '../components/Surf/ProductScreen';
import CartScreen from '../components/Surf/CartScreen';
import ProfileScreen from '../components/Surf/ProfileScreen';
import OrdersScreen from '../components/Surf/OrdersScreen';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';

const products: Record<string, { name: string; price: number; size: string; image: string }> = {
    'latte': {
        name: 'Латте',
        price: 350,
        size: 'medium',
        image: '/surf/latte.png'
    },
    'americano': {
        name: 'Американо',
        price: 280,
        size: 'medium',
        image: '/surf/americano.png'
    },
    'cappuccino': {
        name: 'Капучино',
        price: 350,
        size: 'medium',
        image: '/surf/coffee_categ.png'
    },
    'iced-latte': {
        name: 'Айс Латте',
        price: 380,
        size: 'medium',
        image: '/surf/icelatte.png'
    },
    'lemonade': {
        name: 'Лимонад Клубника-Базилик',
        price: 290,
        size: 'medium',
        image: '/surf/lemonade.png'
    },
    'green-tea': {
        name: 'Зеленый чай',
        price: 270,
        size: 'medium',
        image: '/surf/tea_mint.png'
    },
    'herbal-tea': {
        name: 'Травяной чай',
        price: 290,
        size: 'medium',
        image: '/surf/tea_categ.png'
    },
    'croissant': {
        name: 'Круассан',
        price: 220,
        size: 'medium',
        image: '/surf/croissant.png'
    },
    'salmon-croissant': {
        name: 'Круассан с лососем',
        price: 450,
        size: 'medium',
        image: '/surf/salmoncroissant.png'
    },
    'panini': {
        name: 'Панини',
        price: 380,
        size: 'medium',
        image: '/surf/panini.png'
    }
};

function SurfApp() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'categories' | 'product' | 'cart' | 'orders'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<'home' | 'categories' | 'product' | 'orders'>('home');
  const [cartItems, setCartItems] = useState<Array<{id: string, name: string, price: number, size: string, image: string, quantity: number}>>([]);
  const [newOrderNumber, setNewOrderNumber] = useState<string | undefined>(undefined);
  
  const { isFullScreenEnabled, webApp, telegramHeaderPadding, initializeTelegramApp } = useTelegram();

  // Количество товаров в корзине
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Обработчик события смены категории
  useEffect(() => {
    const handleCategoryChange = (e: CustomEvent) => {
      const { category } = e.detail;
      console.log('Обрабатываем смену категории:', category);
      
      // Если мы не на экране категорий, нужно сначала перейти на него
      if (currentScreen !== 'categories') {
        transitionTo('categories', () => {
          setSelectedCategory(category);
        });
      } else {
        // Если уже на экране категорий, просто меняем выбранную категорию
        setSelectedCategory(category);
      }
    };

    window.addEventListener('categoriesScreenCategoryChange', handleCategoryChange as EventListener);
    
    return () => {
      window.removeEventListener('categoriesScreenCategoryChange', handleCategoryChange as EventListener);
    };
  }, [currentScreen]); // Теперь зависим от currentScreen

  // Метод для сброса корзины и сохранения номера заказа
  const resetCartAndSetOrder = (orderNumber?: string) => {
    setCartItems([]);
    if (orderNumber) {
      setNewOrderNumber(orderNumber);
    }
  };

  // Метод для добавления товара в корзину
  const addToCart = (productId: string, quantity: number = 1) => {
    const product = products[productId]; // Получаем продукт из объекта products
    if (!product) return;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item => 
          item.id === productId ? {...item, quantity: item.quantity + quantity} : item
        );
      } else {
        return [...prev, {
          id: productId,
          name: product.name,
          price: product.price,
          size: product.size,
          image: product.image,
          quantity
        }];
      }
    });
  };

  useEffect(() => {
    // Проверка, находимся ли мы в контексте Telegram или в обычном браузере
    const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
    
    // Инициализация Telegram WebApp только если он доступен
    if (isTelegramWebApp && webApp) {
      initializeTelegramApp();
    } else {
      console.log('Running in browser mode, skipping Telegram WebApp initialization');
    }
  }, [webApp, initializeTelegramApp]);

  // Устанавливаем CSS-переменную для отступа в зависимости от режима фулскрин
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Проверка, находимся ли мы в контексте Telegram
      const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
      
      // Устанавливаем отступы только если мы в Telegram и включен полноэкранный режим
      if (isTelegramWebApp && isFullScreenEnabled && currentScreen !== 'home' && currentScreen !== 'product') {
        document.documentElement.style.setProperty(
          '--telegram-header-padding', 
          `${telegramHeaderPadding}px`
        );
        document.documentElement.style.setProperty(
          '--telegram-header-gradient',
          'linear-gradient(to bottom, #1D1816 90%, #1D1816 95%)'
        );
      } else {
        // В обычном браузере или если не в полноэкранном режиме
        document.documentElement.style.setProperty('--telegram-header-padding', '0px');
        document.documentElement.style.setProperty('--telegram-header-gradient', 'none');
      }
    }
  }, [isFullScreenEnabled, telegramHeaderPadding, currentScreen]);

  const transitionTo = (screen: 'home' | 'categories' | 'product' | 'cart' | 'orders', callback?: () => void) => {
    setIsTransitioning(true);
    if ((screen === 'cart' || screen === 'orders') && currentScreen !== 'cart' && currentScreen !== 'orders') {
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

  const goToOrders = () => {
    transitionTo('orders');
  };

  const goBack = () => {
    if (currentScreen === 'cart' || currentScreen === 'orders') {
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

  const contentStyle = {
    paddingTop: 'var(--telegram-header-padding)',
    transition: 'padding-top 0.3s ease'
  };

  // Сбрасываем номер заказа после отображения
  useEffect(() => {
    if (newOrderNumber && currentScreen === 'orders') {
      const timer = setTimeout(() => setNewOrderNumber(undefined), 500);
      return () => clearTimeout(timer);
    }
  }, [newOrderNumber, currentScreen]);

  // Функция для получения продукта по ID
  const getProductById = (id: string) => {
    return products[id];
  };

  return (
    <div className="relative min-h-screen bg-[#1D1816] text-white overflow-x-hidden">
      {/* Фоновый градиент для заголовка в полноэкранном режиме */}
      <div 
        className={`fixed top-0 left-0 right-0 z-10 h-24 bg-[var(--telegram-header-gradient)] pointer-events-none transition-opacity duration-300
                   ${currentScreen !== 'home' && currentScreen !== 'product' ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Затемнение для профиля */}
      {showProfile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={toggleProfile}
        />
      )}

      {/* Основной контент */}
      <div 
        className={`relative z-0 transition-transform duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={contentStyle}
      >
        {currentScreen === 'home' && (
          <HomeScreen 
            onCategorySelect={goToCategories} 
            onProductSelect={goToProduct}
            onToggleProfile={toggleProfile}
            onGoToOrders={goToOrders}
            cartItemCount={cartItemCount}
          />
        )}
        
        {currentScreen === 'categories' && (
          <CategoriesScreen 
            selectedCategory={selectedCategory}
            onGoBack={goHome}
            onProductSelect={goToProduct}
          />
        )}
        
        {currentScreen === 'product' && (
          <ProductScreen 
            productId={selectedProduct}
            product={getProductById(selectedProduct)}
            onGoBack={() => goToCategories(selectedCategory)}
            onAddToCart={addToCart}
            onGoToCart={goToCart}
            cartItemCount={cartItemCount}
          />
        )}
        
        {currentScreen === 'cart' && (
          <CartScreen 
            items={cartItems}
            onUpdateQuantity={(id, qty) => {
              setCartItems(prev => 
                prev.map(item => item.id === id ? {...item, quantity: qty} : item)
                  .filter(item => item.quantity > 0)
              );
            }}
            onGoBack={goBack}
            onCheckout={resetCartAndSetOrder}
            onGoToOrders={goToOrders}
          />
        )}
        
        {currentScreen === 'orders' && (
          <OrdersScreen 
            onGoBack={goBack}
            onGoHome={goHome}
            newOrderNumber={newOrderNumber}
          />
        )}
      </div>

      {/* Профиль */}
      <ProfileScreen 
        isOpen={showProfile} 
        onClose={toggleProfile}
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold mb-4">Приложение для практик</h1>
        <p className="mb-6">
          Документация для квиза практик с интеграцией Supabase подготовлена и доступна в репозитории.
        </p>
        <a 
          href="https://github.com/Leogelv/surfw_ivan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Посмотреть репозиторий
        </a>
      </div>
    </main>
  );
}
