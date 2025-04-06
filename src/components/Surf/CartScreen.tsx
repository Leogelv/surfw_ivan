import { useState, useEffect, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import CheckoutScreen from './CheckoutScreen';
import useHapticFeedback from '@/hooks/useHapticFeedback';
import useSafeAreaInsets from '@/hooks/useSafeAreaInsets';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

interface CartScreenProps {
  onBackClick: () => void;
  onOrderComplete?: (orderNumber?: string) => void;
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
}

// Компонент для карточки товара с поддержкой свайпов
const SwipeableCartItem = ({ 
  item, 
  onRemove, 
  onChangeQuantity,
  animationDelay 
}: { 
  item: CartItem, 
  onRemove: () => void, 
  onChangeQuantity: (newQuantity: number) => void,
  animationDelay: number
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const minSwipeDistance = 50; // минимальная дистанция для свайпа
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100 + animationDelay);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  const handleTouchStart = (e: TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Ограничиваем свайп влево/вправо
    if (diff < -100) {
      setTranslateX(-100);
    } else if (diff > 100) {
      setTranslateX(100);
    } else {
      setTranslateX(diff);
    }
  };
  
  const handleTouchEnd = () => {
    if (translateX < -minSwipeDistance && item.quantity === 1) {
      // Если осталась 1 штука и свайп влево - удаляем
      onRemove();
    } else if (translateX < -minSwipeDistance) {
      // Если свайп влево - уменьшаем количество
      onChangeQuantity(item.quantity - 1);
    } else if (translateX > minSwipeDistance) {
      // Если свайп вправо - увеличиваем количество
      onChangeQuantity(item.quantity + 1);
    }
    
    // Возвращаем в исходное положение
    setTranslateX(0);
  };
  
  return (
    <div 
      className={`transform transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <div 
        className={`bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer border border-white/5 shadow-[#A67C52]/30 flex p-3 transition-transform`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-16 w-16 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B5A2B] to-[#3E2723] mix-blend-overlay opacity-60 z-10"></div>
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
        </div>
        
        <div className="px-3 flex flex-col justify-center flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-white">{item.name}</h4>
              <p className="text-xs text-white/60">{item.size}</p>
            </div>
            <div className="bg-gradient-to-r from-[#8B5A2B] to-[#3E2723] px-2 py-1 rounded-full text-white font-medium text-sm">
              {item.price} ₽
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-3 bg-white/5 rounded-full px-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.quantity > 1) {
                    onChangeQuantity(item.quantity - 1);
                  } else {
                    onRemove();
                  }
                }} 
                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm">{item.quantity}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeQuantity(item.quantity + 1);
                }}
                className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-white/60 hover:text-white/90 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент рекомендаций для пустой корзины
const EmptyCartRecommendations = ({ onAddToCart }: { onAddToCart: (productId: string) => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Демо-товары для рекомендаций
  const recommendations = [
    {
      id: 'cappuccino',
      name: 'Капучино',
      price: 350,
      image: '/surf/coffee_categ.png',
      description: 'Классический итальянский напиток, в котором эспрессо смешивается с молоком'
    },
    {
      id: 'americano',
      name: 'Американо',
      price: 280,
      image: '/surf/coffee_categ.png',
      description: 'Эспрессо, смягченный горячей водой'
    },
    {
      id: 'croissant',
      name: 'Круассан',
      price: 220,
      image: '/surf/croissant.png',
      description: 'Свежая выпечка с хрустящей корочкой'
    }
  ];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % recommendations.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [recommendations.length]);
  
  return (
    <div className={`mt-10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h3 className="text-xl font-medium mb-4 text-center">Рекомендуем попробовать</h3>
      
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {recommendations.map((item, index) => (
            <div key={item.id} className="w-full flex-shrink-0 px-4">
              <div className="bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/30 p-4">
                <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8B5A2B]/30 to-[#3E2723]/30 mix-blend-overlay z-10"></div>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                  <div className="bg-gradient-to-r from-[#8B5A2B] to-[#3E2723] px-2 py-1 rounded-full text-white font-medium text-sm">
                    {item.price} ₽
                  </div>
                </div>
                
                <p className="text-sm text-white/70 mb-3 line-clamp-2">{item.description}</p>
                
                <button 
                  onClick={() => onAddToCart(item.id)}
                  className="w-full py-2 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-[#A67C52]/20"
                >
                  Добавить в корзину
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-4 space-x-1">
          {recommendations.map((_, index) => (
            <button 
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex ? 'bg-[#A67C52] w-4' : 'bg-white/30'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CartScreen = ({ onBackClick, onOrderComplete, cartItems, setCartItems }: CartScreenProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Состояние для бонусов
  const [bonusPoints, setBonusPoints] = useState(150);
  const [useBonusPoints, setUseBonusPoints] = useState(false);
  const [bonusToUse, setBonusToUse] = useState(0);
  
  const haptic = useHapticFeedback();
  const safeAreaInsets = useSafeAreaInsets();

  // Рассчитываем общую сумму
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Вычисляем максимум баллов, который можно списать (до 50% от стоимости заказа)
  const maxBonusToUse = Math.min(bonusPoints, Math.floor(totalAmount * 0.5));

  // Рассчитываем финальную сумму с учетом скидки
  const finalAmount = totalAmount - bonusToUse;

  // Анимация загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // При изменении useBonusPoints устанавливаем максимальное значение бонусов для списания
  useEffect(() => {
    if (useBonusPoints) {
      setBonusToUse(maxBonusToUse);
    } else {
      setBonusToUse(0);
    }
  }, [useBonusPoints, maxBonusToUse]);

  // Изменение количества товара
  const updateQuantity = (id: string, newQuantity: number) => {
    haptic.selectionChanged();
    if (newQuantity < 1) return;
    
    // Проверяем, есть ли товар уже в корзине
    const existingItem = cartItems.find(item => item.id === id);
    
    if (existingItem) {
      // Если товар уже есть, просто обновляем его количество
      const updatedCartItems = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      // Обновляем корзину в родительском компоненте
      setCartItems(updatedCartItems);
    } else {
      // Если товара нет в корзине, добавляем его
      // Для поиска товара обычно должен быть API или хранилище продуктов
      // В данном примере мы просто добавляем товар из рекомендаций
      const recommendedProducts: Record<string, CartItem> = {
        'cappuccino': {
          id: 'cappuccino',
          name: 'Капучино',
          price: 350,
          size: 'medium',
          image: '/surf/coffee_categ.png',
          quantity: newQuantity
        },
        'americano': {
          id: 'americano',
          name: 'Американо',
          price: 280,
          size: 'medium',
          image: '/surf/coffee_categ.png',
          quantity: newQuantity
        },
        'croissant': {
          id: 'croissant',
          name: 'Круассан',
          price: 220,
          size: 'medium',
          image: '/surf/croissant.png',
          quantity: newQuantity
        }
      };
      
      const newItem = recommendedProducts[id];
      if (newItem) {
        // Добавляем товар в корзину
        const updatedCartItems = [...cartItems, newItem];
        // Обновляем корзину в родительском компоненте
        setCartItems(updatedCartItems);
      }
    }
  };

  // Удаление товара из корзины
  const removeItem = (id: string) => {
    haptic.impactOccurred('medium');
    // Удаляем товар из cartItems
    const updatedCartItems = cartItems.filter(item => item.id !== id);
    // Обновляем состояние корзины в родительском компоненте
    setCartItems(updatedCartItems);
  };

  // Переключатель использования бонусов
  const toggleBonusUse = () => {
    haptic.selectionChanged();
    setUseBonusPoints(!useBonusPoints);
  };

  // Оформление заказа
  const checkout = () => {
    haptic.buttonClick();
    setShowCheckout(true);
  };

  // Вернуться к корзине из оформления заказа
  const backToCart = () => {
    haptic.buttonClick();
    setShowCheckout(false);
  };

  // Вернуться на главную страницу
  const goHome = () => {
    haptic.buttonClick();
    // Сначала скрываем оформление заказа
    setShowCheckout(false);
    // Затем вызываем обработчик завершения заказа, если он передан
    if (onOrderComplete) {
      onOrderComplete();
    } else {
      // Иначе просто возвращаемся к предыдущему экрану
      onBackClick();
    }
  };

  if (showCheckout) {
    return (
      <CheckoutScreen 
        onBackClick={backToCart} 
        onHomeClick={goHome}
        onOrderComplete={(orderNumber: string) => {
          if (onOrderComplete) {
            onOrderComplete(orderNumber);
          } else {
            goHome();
          }
        }}
        total={finalAmount}
        items={cartItems}
      />
    );
  }

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", 
             backgroundSize: "40px 40px"
           }}></div>
           
      {/* Заголовок */}
      <div 
        className="px-6 pt-4 pb-2 relative z-10 flex items-center"
        style={{ paddingTop: `${safeAreaInsets.top + 4}px` }}
      >
        <button 
          onClick={() => {
            haptic.buttonClick();
            onBackClick();
          }} 
          className="p-2 mr-2 bg-white/5 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold flex items-center">
          Корзина
          <div className="ml-2 w-2 h-2 rounded-full bg-[#A67C52] animate-pulse"></div>
        </h2>
      </div>
      
      {/* Товары в корзине */}
      <div className="flex-1 overflow-auto px-6 pb-24 relative z-10">
        {cartItems.length > 0 ? (
          <div className="flex flex-col space-y-4 mt-4">
            {cartItems.map((item, index) => (
              <SwipeableCartItem 
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onChangeQuantity={(quantity) => updateQuantity(item.id, quantity)}
                animationDelay={index * 100}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className={`flex flex-col items-center justify-center pt-12 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-xl font-medium text-white/80 mb-2">Ваша корзина пуста</h3>
              <p className="text-sm text-white/60 text-center max-w-xs">Добавьте что-нибудь из меню, чтобы оформить заказ</p>
              
              <button 
                onClick={() => {
                  haptic.buttonClick();
                  onBackClick();
                }}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-full font-medium text-sm transition-all shadow-lg shadow-[#A67C52]/20 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Перейти в меню
              </button>
            </div>
            
            {/* Slider с рекомендациями */}
            <EmptyCartRecommendations onAddToCart={(productId) => {
              // Добавляем товар в корзину с количеством 1
              updateQuantity(productId, 1);
              haptic.impactOccurred('medium');
            }} />
          </div>
        )}
        
        {cartItems.length > 0 && (
          <>
            {/* Карточка "Лицензия Серфера" с бонусами */}
            <div className={`mt-6 mb-4 transition-all duration-700 delay-150 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-gradient-to-br from-[#8B5A2B]/30 to-[#3E2723]/30 backdrop-blur-sm rounded-xl overflow-hidden border border-[#A67C52]/30 shadow-[#A67C52]/20 shadow-lg p-4 relative">
                {/* Декоративный элемент */}
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#A67C52]/10 blur-xl"></div>
                <div className="absolute right-4 top-4">
                  <svg className="w-12 h-12 text-[#A67C52]/20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,5C19.89,4.65 18.67,4.5 17.5,4.5C15.55,4.5 13.45,4.9 12,6C10.55,4.9 8.45,4.5 6.5,4.5C4.55,4.5 2.45,4.9 1,6V20.65C1,20.9 1.25,21.15 1.5,21.15C1.6,21.15 1.65,21.1 1.75,21.1C3.1,20.45 5.05,20 6.5,20C8.45,20 10.55,20.4 12,21.5C13.35,20.65 15.8,20 17.5,20C19.15,20 20.85,20.3 22.25,21.05C22.35,21.1 22.4,21.1 22.5,21.1C22.75,21.1 23,20.85 23,20.6V6C22.4,5.55 21.75,5.25 21,5M21,18.5C19.9,18.15 18.7,18 17.5,18C15.8,18 13.35,18.65 12,19.5V8C13.35,7.15 15.8,6.5 17.5,6.5C18.7,6.5 19.9,6.65 21,7V18.5Z" />
                  </svg>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#A67C52] rounded-lg mr-3 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Лицензия Серфера</h3>
                    <div className="flex items-center mt-1">
                      <svg className="w-4 h-4 text-[#A67C52] mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z" />
                      </svg>
                      <span className="text-white/80 text-sm font-medium">{bonusPoints} бонусов</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative h-1.5 bg-[#2A2118] rounded-full overflow-hidden mb-1">
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#A67C52] to-[#5D4037] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((bonusPoints / 500) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 mb-4">
                  <span>0</span>
                  <span>До VIP уровня: {Math.max(500 - bonusPoints, 0)}</span>
                  <span>500</span>
                </div>
                
                {/* Переключатель для использования бонусов, только если есть товары и бонусы */}
                {cartItems.length > 0 && bonusPoints > 0 && (
                  <div className="flex items-center justify-between mt-2 bg-[#2A2118]/70 p-3 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Списать {maxBonusToUse} баллов</div>
                      <div className="text-xs text-white/60">Скидка {Math.round((bonusToUse / totalAmount) * 100)}%</div>
                    </div>
                    <button 
                      onClick={toggleBonusUse}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${useBonusPoints ? 'bg-[#A67C52]' : 'bg-white/20'}`}
                    >
                      <div 
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                          useBonusPoints ? 'right-0.5' : 'left-0.5'
                        }`}
                      ></div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative my-6">
              <div className="absolute left-0 right-0 h-[1px] bg-white/10"></div>
              <div className="absolute left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="flex justify-center">
                <div className="w-2 h-2 rounded-full bg-[#A67C52] relative top-[-4px] animate-pulse"></div>
              </div>
            </div>
            
            <div className={`transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-lg font-medium mb-3">Ранее вы заказывали</h3>
              <div className="bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/10 p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <h4 className="font-bold">Заказ #2548</h4>
                  </div>
                  <button 
                    className="text-[#A67C52] text-sm hover:text-[#B98D6F] transition-colors"
                    onClick={() => {
                      haptic.buttonClick();
                      checkout();
                    }}
                  >
                    Повторить
                  </button>
                </div>
                <div className="mt-2 text-sm text-white/70">
                  <div>Капучино (средний) x 1</div>
                  <div>Эспрессо x 2</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Итоговая сумма и кнопка оформления заказа */}
      {cartItems.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-6 py-4 border-t border-white/10"
          style={{ paddingBottom: `${safeAreaInsets.bottom + 10}px` }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80">Итого:</span>
            <div className="flex flex-col items-end">
              {useBonusPoints && bonusToUse > 0 && (
                <div className="flex items-center text-sm text-[#A67C52]">
                  <span className="line-through text-white/40 mr-2">{totalAmount} ₽</span>
                  <span>−{bonusToUse} ₽</span>
                </div>
              )}
              <div className="text-xl font-bold">{finalAmount} ₽</div>
            </div>
          </div>
          <button 
            onClick={() => {
              haptic.buttonClick();
              checkout();
            }}
            className="w-full py-4 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-[#A67C52]/30 flex items-center justify-center group backdrop-blur-sm border border-white/10"
          >
            <span className="mr-2">Оформить заказ</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartScreen; 