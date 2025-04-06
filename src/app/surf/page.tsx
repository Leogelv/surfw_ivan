'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import HomeScreen from '../../components/Surf/HomeScreen';
import CategoriesScreen from '../../components/Surf/CategoriesScreen';
import ProductScreen from '../../components/Surf/ProductScreen';
import CartScreen from '../../components/Surf/CartScreen';
import ProfileScreen from '../../components/Surf/ProfileScreen';
import OrdersScreen from '../../components/Surf/OrdersScreen';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';
import { AnimationContext } from '@/context/AnimationContext';

export default function SurfApp() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'categories' | 'product' | 'cart' | 'orders'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<'home' | 'categories' | 'product' | 'orders'>('home');
  const [cartItems, setCartItems] = useState<Array<{id: string, quantity: number}>>([]);
  const [newOrderNumber, setNewOrderNumber] = useState<string | undefined>(undefined);
  
  // Состояния для плавной анимации перехода
  const [animationState, setAnimationState] = useState({
    productId: null as string | null,
    imagePosition: null as { top: number; left: number; width: number; height: number } | null,
    scrollPosition: 0,
    isAnimating: false
  });
  
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

  // Метод для захвата позиции изображения для плавной анимации
  const captureImagePosition = (
    productId: string, 
    position: { top: number; left: number; width: number; height: number },
    scrollPosition: number
  ) => {
    setAnimationState(prev => ({
      ...prev,
      productId,
      imagePosition: position,
      scrollPosition,
      isAnimating: true
    }));
  };

  // Метод для добавления товара в корзину
  const addToCart = (productId: string, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item => 
          item.id === productId ? {...item, quantity: item.quantity + quantity} : item
        );
      } else {
        return [...prev, {id: productId, quantity}];
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

  // Улучшенный transitionTo с учетом анимаций
  const transitionTo = (screen: 'home' | 'categories' | 'product' | 'cart' | 'orders', callback?: () => void) => {
    setIsTransitioning(true);
    if ((screen === 'cart' || screen === 'orders') && currentScreen !== 'cart' && currentScreen !== 'orders') {
      setPreviousScreen(currentScreen);
    }
    
    // Если переход от категорий к продукту и есть информация о позиции изображения,
    // мы позволяем произойти плавной анимации
    const isAnimatedTransition = currentScreen === 'categories' && screen === 'product' && animationState.imagePosition;
    
    // Задержка для завершения анимации
    const delay = isAnimatedTransition ? 450 : 300;
    
    setTimeout(() => {
      if (callback) callback();
      setCurrentScreen(screen);
      
      // Если это был анимированный переход, через некоторое время сбрасываем флаг анимации
      if (isAnimatedTransition) {
        setTimeout(() => {
          setAnimationState(prev => ({ ...prev, isAnimating: false }));
        }, 500);
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, delay);
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

  // Анимированное изображение для перехода
  const TransitionImage = () => {
    if (!animationState.isAnimating || !animationState.imagePosition) return null;
    
    // Позиция изображения на начальном экране
    const startPosition = animationState.imagePosition;
    
    // Финальная позиция (верхняя часть экрана продукта)
    const finalPosition = {
      top: 0,
      left: 0, 
      width: window.innerWidth,
      height: window.innerWidth * 1.42, // Соотношение как в ProductScreen
    };
    
    // Стиль для анимации
    const transitionStyle = {
      position: 'fixed',
      top: `${startPosition.top - animationState.scrollPosition}px`,
      left: `${startPosition.left}px`,
      width: `${startPosition.width}px`,
      height: `${startPosition.height}px`,
      zIndex: 1000,
      transition: 'all 450ms cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 1,
      borderRadius: '16px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      animation: 'fadeOut 450ms ease-out forwards',
    } as React.CSSProperties;
    
    useEffect(() => {
      if (animationState.isAnimating) {
        // Запускаем анимацию перемещения
        requestAnimationFrame(() => {
          const element = document.getElementById('transition-image');
          if (element) {
            element.style.top = `${0}px`;
            element.style.left = `${0}px`;
            element.style.width = `${finalPosition.width}px`;
            element.style.height = `${finalPosition.height}px`;
            element.style.borderRadius = '0px';
          }
        });
      }
    }, [animationState.isAnimating]);
    
    return (
      <div id="transition-image" style={transitionStyle}>
        <img 
          src={`/surf/${animationState.productId}.png`} 
          alt="Transition"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>
    );
  };

  return (
    <TelegramProvider>
      <AnimationContext.Provider value={{ transitionState: animationState, captureImagePosition }}>
        <div style={contentStyle} className="h-screen bg-black">
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
            {currentScreen === 'home' && (
              <HomeScreen 
                onCategoryClick={goToCategories} 
                onMenuClick={goToCategories} 
                onCartClick={goToCart} 
                onProfileClick={toggleProfile}
                onLogoClick={goHome}
                onOrdersClick={goToOrders}
                cartItemCount={cartItemCount}
                showCart={cartItems.length > 0}
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
                onOrdersClick={goToOrders}
                cartItemCount={cartItemCount}
                showCart={cartItems.length > 0}
              />
            )}
            {currentScreen === 'product' && (
              <ProductScreen 
                productName={selectedProduct} 
                onBackClick={() => goToCategories(selectedCategory)} 
                onCartClick={goToCart}
                onProfileClick={toggleProfile}
                onLogoClick={goHome}
                onAddToCart={(id, quantity) => {
                  addToCart(id, quantity);
                  goToCart();
                }}
                showCart={cartItems.length > 0}
                animatedEntry={animationState.isAnimating}
              />
            )}
            {currentScreen === 'cart' && (
              <CartScreen 
                onBackClick={goBack}
                onOrderComplete={(orderNumber) => {
                  resetCartAndSetOrder(orderNumber);
                  goHome();
                }}
              />
            )}
            {currentScreen === 'orders' && (
              <OrdersScreen 
                onBackClick={goBack}
                newOrderNumber={newOrderNumber}
              />
            )}
          </div>

          {/* Анимированное изображение для перехода */}
          {currentScreen === 'product' && animationState.isAnimating && animationState.imagePosition && (
            <TransitionImage />
          )}

          {showProfile && (
            <ProfileScreen 
              onClose={toggleProfile} 
              onHomeClick={goHome}
              onCartClick={goToCart}
              onOrdersClick={goToOrders}
            />
          )}
        </div>
      </AnimationContext.Provider>
    </TelegramProvider>
  );
} 