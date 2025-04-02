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
    <div className="h-full bg-gradient-to-b from-[#0A0908] via-[#1E1B19] to-[#0A0908] flex flex-col justify-between">
      {/* Категории с улучшенным отображением для 100vh */}
      <div className="flex flex-col h-full space-y-2 p-4">
        {/* Кофе */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'coffee' ? 'scale-[1.02] shadow-lg shadow-amber-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('coffee')}
          onMouseEnter={() => handleCategoryHover('coffee')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="absolute inset-0">
            <Image
              src="/surf/coffee_categ.png"
              alt="Кофе"
              fill
              className="object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-5xl font-bold drop-shadow-lg tracking-wider">КОФЕ</h2>
          </div>
        </div>
        
        {/* Чай */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'tea' ? 'scale-[1.02] shadow-lg shadow-green-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('tea')}
          onMouseEnter={() => handleCategoryHover('tea')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="absolute inset-0">
            <Image
              src="/surf/tea_categ.png"
              alt="Чай"
              fill
              className="object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-5xl font-bold drop-shadow-lg tracking-wider">ЧАЙ</h2>
          </div>
        </div>
        
        {/* Еда */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'food' ? 'scale-[1.02] shadow-lg shadow-red-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('food')}
          onMouseEnter={() => handleCategoryHover('food')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="absolute inset-0">
            <Image
              src="/surf/food_categ.png"
              alt="Еда"
              fill
              className="object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-5xl font-bold drop-shadow-lg tracking-wider">ЕДА</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen; 