import Image from 'next/image';
import { useState, useEffect } from 'react';

interface HomeScreenProps {
  onCategoryClick: (category: string) => void;
  onMenuClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
}

const HomeScreen = ({ onCategoryClick, onMenuClick, onCartClick, onProfileClick, onLogoClick }: HomeScreenProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Эффект пульсации для логотипа
  const [logoScale, setLogoScale] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Анимация загрузки экрана
  useEffect(() => {
    // Сбрасываем состояние при размонтировании
    setIsLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Обработчик наведения на категорию
  const handleCategoryHover = (category: string | null) => {
    setActiveCategory(category);
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
      
      {/* Заголовок */}
      <div className={`px-6 pt-4 pb-2 relative z-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="text-white flex items-center space-x-2 opacity-80">
          <div className="text-xl">✨</div>
          <h2 className="text-2xl font-bold">Surf Coffee</h2>
        </div>
        <div className="flex items-center mt-4">
          <h3 className="text-3xl font-bold text-white mr-2 flex items-center">
            Меню
            <div className="ml-2 w-2 h-2 rounded-full bg-[#A67C52] animate-pulse"></div>
          </h3>
          <div className="h-[2px] flex-grow rounded-full bg-gradient-to-r from-[#8B5A2B] to-[#3E2723]"></div>
        </div>
      </div>
      
      {/* Категории */}
      <div className="flex-1 flex flex-col space-y-2 p-2 relative z-10">
        {/* Кофе */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'coffee' ? 'scale-[1.02] shadow-lg shadow-[#8B5A2B]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '100ms' }}
          onClick={() => onCategoryClick('coffee')}
          onMouseEnter={() => handleCategoryHover('coffee')}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <Image
            src="/surf/coffee_categ.png"
            alt="Кофе"
            fill
            className="object-cover transition-transform duration-700 hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center">
            <h2 className="text-white text-6xl font-bold drop-shadow-lg tracking-wider">КОФЕ</h2>
          </div>
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8B5A2B] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#A67C52] z-20 animate-pulse"></div>
        </div>
        
        {/* Чай */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'tea' ? 'scale-[1.02] shadow-lg shadow-[#6B4226]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '200ms' }}
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
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B4226] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#8D6E63] z-20 animate-pulse"></div>
        </div>
        
        {/* Еда */}
        <div 
          className={`flex-1 relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ${
            activeCategory === 'food' ? 'scale-[1.02] shadow-lg shadow-[#6D4C41]/20' : 
            activeCategory ? 'opacity-80 scale-[0.99]' : ''
          } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '300ms' }}
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
          {/* Декоративная накладка */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6D4C41] to-[#3E2723] mix-blend-overlay opacity-15"></div>
          
          {/* Пульсирующая точка */}
          <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#A1887F] z-20 animate-pulse"></div>
        </div>
      </div>
      
      {/* Фиксированное нижнее меню с логотипом */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-4 py-3 border-t border-white/10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          {/* Активные заказы */}
          <button className="relative p-2" onClick={onCartClick}>
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="relative cursor-pointer" style={{ transform: `scale(${logoScale})`, transition: 'transform 0.8s ease-in-out' }} onClick={onLogoClick}>
            <div className="absolute -inset-2 bg-[#A67C52]/10 rounded-full blur-md"></div>
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
            <button onClick={onProfileClick} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
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