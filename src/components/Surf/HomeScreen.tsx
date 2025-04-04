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
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
        style={{ background: 'radial-gradient(circle at center, rgba(166, 124, 82, 0.3) 0%, transparent 70%)' }}>
      </div>
      
      {activeOrders > 0 && (
        <button onClick={onOrdersClick} className={`fixed top-5 left-5 z-40 flex items-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} ${clickedCategory ? 'opacity-0 translate-y-10' : ''}`}>
          <div className="w-10 h-10 relative flex items-center justify-center bg-[#A67C52] rounded-full shadow-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute -top-1 -right-1 bg-white text-[#A67C52] text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {activeOrders}
            </div>
          </div>
          <span className="text-white font-medium text-sm">Активные заказы</span>
        </button>
      )}
      
      <button onClick={onMenuClick} className={`fixed top-5 right-5 z-40 p-2 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} ${clickedCategory ? 'opacity-0 translate-y-10' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="flex-1 overflow-hidden flex flex-col px-4 py-14 relative">
        <div className={`text-center mb-5 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} ${clickedCategory ? 'opacity-0 translate-y-10' : ''}`}
          style={{ transitionDelay: '50ms' }}>
          <h1 className="text-4xl font-bold text-white tracking-tighter">
            <span className="text-[#F2C04F]">Vibe</span> Cafe
          </h1>
          <p className="text-white/60 text-sm mt-1 font-medium">
            Выберите категорию
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 flex-1 relative">
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
              alt="Coffee"
              fill
              className={`object-cover transition-transform duration-700 
                ${clickedCategory === 'coffee' ? 'scale-110' : 'hover:scale-110'}`}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
              <div className="w-full flex flex-col items-center justify-center transition-transform duration-500">
                <Image 
                  src="/surf/coffee.svg" 
                  alt="Coffee"
                  width={180}
                  height={100}
                  className={`w-auto h-24 transition-all duration-800 
                  ${clickedCategory === 'coffee' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Кофе</h2>
                <p className="text-white/60 text-sm">Свежая обжарка</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                <span className="text-2xl">☕</span>
              </div>
            </div>
          </div>
          
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
              <div className="w-full flex flex-col items-center justify-center transition-transform duration-500">
                <Image 
                  src="/surf/drinks.svg"
                  alt="Напитки"
                  width={180}
                  height={100}
                  className={`w-auto h-24 transition-all duration-800 
                  ${clickedCategory === 'drinks' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Напитки</h2>
                <p className="text-white/60 text-sm">Чай и лимонады</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                <span className="text-2xl">🍵</span>
              </div>
            </div>
          </div>
          
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
              alt="Food"
              fill
              className={`object-cover transition-transform duration-700 
                ${clickedCategory === 'food' ? 'scale-110' : 'hover:scale-110'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
              <div className="w-full flex flex-col items-center justify-center transition-transform duration-500">
                <Image 
                  src="/surf/food.svg"
                  alt="Food"
                  width={180}
                  height={100}
                  className={`w-auto h-24 transition-all duration-800 
                  ${clickedCategory === 'food' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Еда</h2>
                <p className="text-white/60 text-sm">Свежая выпечка</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                <span className="text-2xl">🥐</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-5 py-4 border-t border-white/10 transition-all duration-700 
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          ${clickedCategory ? 'opacity-0 translate-y-10' : ''}`}
        style={{ transitionDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          <button onClick={onOrdersClick} className="p-3 relative group">
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
          </button>
          
          <div className="relative cursor-pointer" style={{ transform: `scale(${logoScale})`, transition: 'transform 0.8s ease-in-out' }} onClick={onLogoClick}>
            <Image 
              src="/surf/logo.svg" 
              alt="Vibe Cafe Logo"
              width={100} 
              height={40}
              className="h-10 w-auto"
            />
          </div>
          
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