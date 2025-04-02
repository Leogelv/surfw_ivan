import Image from 'next/image';
import { useState, useEffect } from 'react';

interface HomeScreenProps {
  onCategoryClick: (category: string) => void;
  onMenuClick: () => void;
  onCartClick: () => void;
}

const HomeScreen = ({ onCategoryClick, onMenuClick, onCartClick }: HomeScreenProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  
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
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0A0908] via-[#1E1B19] to-[#0A0908]">
      {/* Фиксированный хедер с логотипом */}
      <div className="fixed top-7 left-0 right-0 z-30 bg-black/50 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Активные заказы */}
          <button className="relative p-2">
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="relative cursor-pointer" style={{ transform: `scale(${logoScale})`, transition: 'transform 0.8s ease-in-out' }} onClick={goHome}>
            <div className="absolute -inset-2 bg-white/5 rounded-full blur-md"></div>
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={140} 
              height={60} 
              className="h-10 w-auto relative"
            />
          </div>
          
          {/* Иконки справа */}
          <div className="flex space-x-2">
            <button onClick={onCartClick} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Категории */}
      <div className="flex-1 flex flex-col space-y-2 p-2 pt-20">
        {/* Кофе */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${activeCategory === 'coffee' ? 'scale-[1.02] shadow-lg shadow-amber-900/20' : activeCategory ? 'opacity-80 scale-[0.99]' : ''}`}
          onClick={() => onCategoryClick('coffee')}
          onMouseEnter={() => handleCategoryHover('coffee')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/coffee_categ.png"
            alt="Кофе"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">КОФЕ</h2>
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
            alt="Чай"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">ЧАЙ</h2>
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
            alt="Еда"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">ЕДА</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

// Функция для перехода на главную страницу
const goHome = () => {
  // Просто заглушка, в реальном приложении здесь будет логика
};

export default HomeScreen; 