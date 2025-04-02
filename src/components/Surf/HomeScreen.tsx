import Image from 'next/image';
import { useState, useEffect } from 'react';

interface HomeScreenProps {
  onCategoryClick: (category: string) => void;
  onMenuClick: () => void;
  onCartClick: () => void;
  isMobile?: boolean; // Опциональный параметр для определения мобильной версии
}

const HomeScreen = ({ onCategoryClick, onMenuClick, onCartClick, isMobile = false }: HomeScreenProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Эффект пульсации для логотипа
  const [logoScale, setLogoScale] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Обработчик наведения на категорию
  const handleCategoryHover = (category: string | null) => {
    setActiveCategory(category);
  };
  
  return (
    <div className="h-full bg-gradient-to-b from-[#0A0908] via-[#1E1B19] to-[#0A0908] flex flex-col">
      {/* Лого с пульсацией */}
      <div className="flex justify-center pt-8 pb-6">
        <div className="relative" style={{ transform: `scale(${logoScale})`, transition: 'transform 0.8s ease-in-out' }}>
          <div className="absolute -inset-2 bg-white/5 rounded-full blur-md"></div>
          <Image 
            src="/surf/logo.svg" 
            alt="Surf Coffee" 
            width={140} 
            height={60} 
            className="w-32 relative"
          />
        </div>
      </div>
      
      {/* Категории */}
      <div className="flex-1 flex flex-col space-y-2 p-2">
        {/* Кофе */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'coffee' ? 'scale-[1.02] shadow-lg shadow-amber-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('coffee')}
          onMouseEnter={() => handleCategoryHover('coffee')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/coffee_categ.png"
            alt="Coffee"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">COFFEE</h2>
          </div>
        </div>
        
        {/* Чай */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'tea' ? 'scale-[1.02] shadow-lg shadow-green-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('tea')}
          onMouseEnter={() => handleCategoryHover('tea')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/tea_categ.png"
            alt="Tea"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">TEA</h2>
          </div>
        </div>
        
        {/* Еда */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'food' ? 'scale-[1.02] shadow-lg shadow-red-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('food')}
          onMouseEnter={() => handleCategoryHover('food')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/food_categ.png"
            alt="Food"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">FOOD</h2>
          </div>
        </div>
      </div>
      
      {/* Навигация */}
      {!isMobile && (
        <div className="h-16 bg-black/40 backdrop-blur-md border-t border-white/10 flex justify-around items-center text-white rounded-b-3xl">
          <button onClick={onMenuClick} className="flex flex-col items-center relative group">
            <div className="absolute -inset-1 scale-0 group-hover:scale-100 rounded-full bg-white/10 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
            </svg>
            <span className="text-xs mt-1 opacity-80 group-hover:opacity-100">Menu</span>
          </button>
          
          <button className="flex flex-col items-center relative group">
            <div className="absolute -inset-3 scale-0 group-hover:scale-100 rounded-full bg-white/5 transition-transform duration-300"></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </button>
          
          <button onClick={onCartClick} className="flex flex-col items-center relative group">
            <div className="absolute -inset-1 scale-0 group-hover:scale-100 rounded-full bg-white/10 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1 opacity-80 group-hover:opacity-100">Cart</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeScreen; 