import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface HomeScreenProps {
  onCategoryClick: (category: string) => void;
  onMenuClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onOrdersClick?: () => void;
  cartItemCount?: number;
  showCart?: boolean;
}

const HomeScreen = ({ 
  onCategoryClick, 
  onMenuClick, 
  onCartClick, 
  onProfileClick, 
  onLogoClick, 
  onOrdersClick = onCartClick, 
  cartItemCount = 0,
  showCart = true 
}: HomeScreenProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState(2);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const coffeeRef = useRef<HTMLDivElement>(null);
  const drinksRef = useRef<HTMLDivElement>(null);
  const foodRef = useRef<HTMLDivElement>(null);
  
  const [logoScale, setLogoScale] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCategoryHover = (category: string | null) => {
    if (!isTransitioning) {
      setActiveCategory(category);
    }
  };
  
  const handleCategoryClick = (category: string) => {
    if (isTransitioning) return;
    
    setClickedCategory(category);
    setIsTransitioning(true);
    
    setTimeout(() => {
      onCategoryClick(category);
    }, 800);
  };
  
  const getCategoryRef = (category: string) => {
    if (category === 'coffee') return coffeeRef;
    if (category === 'drinks') return drinksRef;
    if (category === 'food') return foodRef;
    return null;
  };
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816] overflow-hidden">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
             backgroundSize: "40px 40px"
           }}></div>

      {/* Круговой градиент по центру верха */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-radial from-[#8B5A2B]/30 to-transparent z-0"></div>
      
      {/* Категории */}
      <div className="flex-1 flex flex-col space-y-1 p-1 relative z-10">
        {/* Кофе */}
        <div 
          ref={coffeeRef}
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'coffee' ? 'scale-[1.02] shadow-lg shadow-[#8B5A2B]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            ${clickedCategory === 'coffee' ? 'scale-[1.1] z-50 fixed inset-0 rounded-none' : ''}
            ${clickedCategory && clickedCategory !== 'coffee' ? 'opacity-0' : ''}
          `}
          style={{ 
            transitionDelay: '100ms',
            transitionProperty: clickedCategory ? 'all' : undefined,
            transitionDuration: clickedCategory ? '800ms' : undefined,
            transitionTimingFunction: clickedCategory ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined 
          }}
          onClick={() => handleCategoryClick('coffee')}
          onMouseEnter={() => handleCategoryHover('coffee')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/coffee_categ.png"
            alt="Кофе"
            fill
            className={`object-cover transition-transform duration-700 
              ${clickedCategory === 'coffee' ? 'scale-110' : 'hover:scale-110'}`}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <Image
              src="/surf/coffee.svg"
              alt="Кофе"
              width={180}
              height={100}
              className={`w-auto h-24 transition-all duration-800 
                ${clickedCategory === 'coffee' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
            />
          </div>
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B5A2B] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#A67C52] z-20 animate-pulse"></div>
        </div>
        
        {/* Напитки */}
        <div 
          ref={drinksRef}
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'drinks' ? 'scale-[1.02] shadow-lg shadow-[#6B4226]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            ${clickedCategory === 'drinks' ? 'scale-[1.1] z-50 fixed inset-0 rounded-none' : ''}
            ${clickedCategory && clickedCategory !== 'drinks' ? 'opacity-0' : ''}
          `}
          style={{ 
            transitionDelay: '200ms',
            transitionProperty: clickedCategory ? 'all' : undefined,
            transitionDuration: clickedCategory ? '800ms' : undefined,
            transitionTimingFunction: clickedCategory ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined 
          }}
          onClick={() => handleCategoryClick('drinks')}
          onMouseEnter={() => handleCategoryHover('drinks')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/tea_categ.png"
            alt="Напитки"
            fill
            className={`object-cover transition-transform duration-700 
              ${clickedCategory === 'drinks' ? 'scale-110' : 'hover:scale-110'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <Image
              src="/surf/drinks.svg"
              alt="Напитки"
              width={180}
              height={100}
              className={`w-auto h-24 transition-all duration-800 
                ${clickedCategory === 'drinks' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
            />
          </div>
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B4226] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#8D6E63] z-20 animate-pulse"></div>
        </div>
        
        {/* Еда */}
        <div 
          ref={foodRef}
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'food' ? 'scale-[1.02] shadow-lg shadow-[#6D4C41]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            ${clickedCategory === 'food' ? 'scale-[1.1] z-50 fixed inset-0 rounded-none' : ''}
            ${clickedCategory && clickedCategory !== 'food' ? 'opacity-0' : ''}
          `}
          style={{ 
            transitionDelay: '300ms',
            transitionProperty: clickedCategory ? 'all' : undefined,
            transitionDuration: clickedCategory ? '800ms' : undefined,
            transitionTimingFunction: clickedCategory ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined 
          }}
          onClick={() => handleCategoryClick('food')}
          onMouseEnter={() => handleCategoryHover('food')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/food_categ.png"
            alt="Еда"
            fill
            className={`object-cover transition-transform duration-700 
              ${clickedCategory === 'food' ? 'scale-110' : 'hover:scale-110'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <Image
              src="/surf/food.svg"
              alt="Еда"
              width={180}
              height={100}
              className={`w-auto h-24 transition-all duration-800 
                ${clickedCategory === 'food' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
            />
          </div>
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6D4C41] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#A1887F] z-20 animate-pulse"></div>
        </div>
      </div>
      
      {/* Фиксированное нижнее меню с логотипом */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-5 py-4 border-t border-white/10 transition-all duration-700
        ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        ${clickedCategory ? 'opacity-0 translate-y-10' : ''}`}
          style={{ transitionDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          {/* Мои заказы */}
          <button className="relative p-3 group" onClick={onOrdersClick}>
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="relative cursor-pointer" style={{ transform: `scale(${logoScale})`, transition: 'transform 0.8s ease-in-out' }} onClick={onLogoClick}>
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={150} 
              height={65} 
              className="h-14 w-auto relative"
            />
          </div>
          
          {/* Иконки справа */}
          <div className="flex space-x-3">
            {showCart && (
              <button onClick={onCartClick} className="p-3 relative group">
                <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
                {cartItemCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </div>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            )}
            <button onClick={onProfileClick} className="p-3 relative group">
              <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen; 