import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface CategoriesScreenProps {
  selectedCategory: string;
  onProductClick: (product: string) => void;
  onHomeClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onOrdersClick?: () => void;
  cartItemCount?: number;
  showCart?: boolean; // Флаг для отображения иконки корзины
}

const CategoriesScreen = ({ 
  selectedCategory, 
  onProductClick, 
  onHomeClick, 
  onCartClick, 
  onProfileClick, 
  onLogoClick,
  onOrdersClick = onCartClick,
  cartItemCount = 0,
  showCart = true
}: CategoriesScreenProps) => {
  // Анимация для категорий
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    // Сброс состояния при изменении категории
    return () => setIsLoaded(false);
  }, [selectedCategory]);

  // Данные о продуктах для каждой категории (цены в рублях)
  const products = {
    coffee: [
      { id: 'cappuccino', name: 'Капучино', price: 350, image: '/surf/coffee_categ.png', description: 'Насыщенный эспрессо с нежной молочной пенкой', calories: 120 },
      { id: 'iced-latte', name: 'Айс Латте', price: 380, image: '/surf/coffee_categ.png', description: 'Освежающий холодный кофе с молоком', calories: 180 },
      { id: 'espresso', name: 'Эспрессо', price: 250, image: '/surf/coffee_categ.png', description: 'Крепкий концентрированный кофе', calories: 5 },
      { id: 'mocha', name: 'Мокко', price: 420, image: '/surf/coffee_categ.png', description: 'Кофе с шоколадным сиропом и молоком', calories: 220 },
      { id: 'americano', name: 'Американо', price: 280, image: '/surf/coffee_categ.png', description: 'Эспрессо с добавлением горячей воды', calories: 10 },
    ],
    tea: [
      { id: 'green-tea', name: 'Зеленый чай', price: 270, image: '/surf/tea_categ.png', description: 'Легкий, освежающий чай, богатый антиоксидантами', calories: 0 },
      { id: 'black-tea', name: 'Черный чай', price: 270, image: '/surf/tea_categ.png', description: 'Классический насыщенный чай', calories: 0 },
      { id: 'herbal-tea', name: 'Травяной чай', price: 290, image: '/surf/tea_categ.png', description: 'Успокаивающий чай без кофеина', calories: 0 },
      { id: 'fruit-tea', name: 'Фруктовый чай', price: 310, image: '/surf/tea_categ.png', description: 'Ароматный чай с кусочками фруктов', calories: 5 },
    ],
    food: [
      { id: 'croissant', name: 'Круассан', price: 220, image: '/surf/croissant.png', description: 'Хрустящий масляный французский круассан', calories: 240 },
      { id: 'sandwich', name: 'Сэндвич', price: 380, image: '/surf/food_categ.png', description: 'Свежие ингредиенты на ремесленном хлебе', calories: 320 },
      { id: 'avocado-toast', name: 'Тост с авокадо', price: 450, image: '/surf/food_categ.png', description: 'Авокадо на тосте из цельнозернового хлеба', calories: 280 },
      { id: 'brownie', name: 'Брауни', price: 260, image: '/surf/food_categ.png', description: 'Шоколадный десерт с орехами', calories: 310 },
    ],
  };

  // Получаем продукты для выбранной категории
  const categoryProducts = selectedCategory ? products[selectedCategory as keyof typeof products] : [];
  
  // Получаем заголовок категории
  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      coffee: 'Кофе',
      tea: 'Чай',
      food: 'Еда',
    };
    return titles[category] || 'Категории';
  };

  // Получаем цвет акцента для категории
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { gradient: string, accent: string, shadow: string }> = {
      coffee: { 
        gradient: 'from-[#8B5A2B] to-[#3E2723]', 
        accent: 'bg-[#A67C52]',
        shadow: 'shadow-[#A67C52]/30'
      },
      tea: { 
        gradient: 'from-[#6B4226] to-[#3E2723]', 
        accent: 'bg-[#8D6E63]',
        shadow: 'shadow-[#8D6E63]/30'
      },
      food: { 
        gradient: 'from-[#6D4C41] to-[#3E2723]', 
        accent: 'bg-[#A1887F]',
        shadow: 'shadow-[#A1887F]/30'
      },
    };
    return colors[category] || { 
      gradient: 'from-[#5D4037] to-[#3E2723]', 
      accent: 'bg-[#8D6E63]',
      shadow: 'shadow-[#8D6E63]/30'
    };
  };

  // Получаем соответствующий фон для категории
  const getBgPattern = (category: string) => {
    return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
  };

  // Получаем эмодзи для категории
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      coffee: '☕',
      tea: '🍵',
      food: '🥐',
    };
    return emojis[category] || '✨';
  };

  const colors = getCategoryColor(selectedCategory);

  // Обработчик скролла карточек продуктов
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const cardWidth = clientWidth * 0.9; // Примерная ширина карточки
      const index = Math.round(scrollLeft / cardWidth);
      setActiveProductIndex(Math.min(index, categoryProducts.length - 1));
    }
  };

  // Плавный скролл к выбранной карточке
  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth * 0.9;
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  // Обработчик выбора категории из выпадающего меню
  const selectCategory = (category: string) => {
    setShowCategoryDropdown(false);
    if (category !== selectedCategory) {
      onProductClick(products[category as keyof typeof products][0].id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: getBgPattern(selectedCategory), 
             backgroundSize: "40px 40px"
           }}></div>
      
      {/* Круговой градиент по центру верха */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-radial from-[#8B5A2B]/30 to-transparent z-0"></div>
      
      {/* Заголовок категории c выпадающим меню */}
      <div className="px-6 pt-4 pb-2 relative z-10">
        <div className="flex items-center mt-2">
          <div className="relative">
            <button 
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="text-3xl font-bold text-white mr-2 flex items-center"
            >
              {getCategoryTitle(selectedCategory)}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`ml-2 h-4 w-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <div className={`ml-2 w-2 h-2 rounded-full animate-pulse ${colors.accent}`}></div>
            </button>
          </div>
          <div className={`h-[2px] flex-grow rounded-full bg-gradient-to-r ${colors.gradient}`}></div>
        </div>
      </div>

      {/* Горизонтальная лента продуктов с эффектом залипания */}
      <div className={`flex-1 relative overflow-hidden px-2 pb-24 z-10 transition-opacity duration-300 ${showCategoryDropdown ? 'opacity-20' : 'opacity-100'}`}>
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto py-4 px-2 hide-scrollbar snap-x snap-mandatory h-full"
          onScroll={handleScroll}
        >
          {categoryProducts.map((product, index) => {
            const isActive = index === activeProductIndex;
            
            return (
              <div 
                key={product.id} 
                className={`flex-shrink-0 w-[90%] snap-center mx-1 transition-all duration-300 ${
                  isActive 
                    ? 'scale-105 opacity-100 z-20' 
                    : 'scale-90 opacity-80 z-10'
                } ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => {
                  if (showCategoryDropdown) return; // Игнорировать клики при открытом меню
                  scrollToCard(index);
                  if (index === activeProductIndex) {
                    onProductClick(product.id);
                  }
                }}
              >
                <div className={`bg-[#2A2118]/85 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer h-auto
                  border border-white/5 ${colors.shadow} transition-all duration-300 hover:shadow-lg`}>
                  
                  {/* Изображение продукта (на весь экран при активности) */}
                  <div className={`relative ${isActive ? 'h-72' : 'h-56'} w-full transition-all duration-300`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} mix-blend-overlay opacity-60 z-10`}></div>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                    
                    {/* Калории в верхнем правом углу */}
                    {product.calories !== undefined && (
                      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-black/40 backdrop-blur-md rounded-full py-1 px-3 border border-white/10">
                        <svg className="w-4 h-4 text-[#B98D6F]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                          <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
                        </svg>
                        <span className="text-xs">{product.calories} кал</span>
                      </div>
                    )}
                    
                    {/* Маленький индикатор в углу */}
                    <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${colors.accent} z-20 animate-pulse`}></div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-xl text-white">{product.name}</h4>
                      <div className={`bg-gradient-to-r ${colors.gradient} text-white px-3 py-1 rounded-full text-sm font-medium shadow-inner`}>
                        {product.price} ₽
                      </div>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                    
                    {/* Кнопка для выбора продукта */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product.id);
                      }} 
                      className={`w-full py-3 rounded-full bg-gradient-to-r ${colors.gradient} text-white font-medium transition-transform hover:scale-105 flex items-center justify-center space-x-2`}
                    >
                      <span>Выбрать</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Индикаторы карточек */}
        <div className="absolute bottom-24 left-0 right-0 flex justify-center space-x-1 z-20">
          {categoryProducts.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${index === activeProductIndex ? `${colors.accent} w-4` : 'bg-white/30'}`}
              onClick={() => scrollToCard(index)}
            />
          ))}
        </div>
      </div>
      
      {/* Фиксированное нижнее меню с логотипом */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-5 py-4 border-t border-white/10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          {/* Назад на главную */}
          <button className="p-3 relative group" onClick={onHomeClick}>
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="cursor-pointer" onClick={onLogoClick}>
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
            {showCart && cartItemCount > 0 && (
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
      
      {/* Полноэкранное выпадающее меню категорий */}
      {showCategoryDropdown && (
        <div className="fixed inset-0 bg-[#1D1816]/80 backdrop-blur-md z-50 flex items-center justify-center transition-opacity duration-300 animate-fadeIn">
          <div className="bg-[#2A2118]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-4/5 max-w-xs overflow-hidden p-2">
            <div className="flex justify-between items-center mb-3 px-3 pt-2">
              <h3 className="text-xl font-bold text-white">Категории</h3>
              <button 
                onClick={() => setShowCategoryDropdown(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {Object.keys(products).map((category) => (
                <button
                  key={category}
                  onClick={() => selectCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-r from-[#A67C52]/20 to-transparent border-l-4 border-[#A67C52]' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="bg-black/20 p-2 rounded-full">
                    <span className="text-2xl">{getCategoryEmoji(category)}</span>
                  </div>
                  <div>
                    <span className={`text-lg font-medium ${selectedCategory === category ? 'text-[#A67C52]' : 'text-white'}`}>
                      {getCategoryTitle(category)}
                    </span>
                    <p className="text-xs text-white/50">
                      {products[category as keyof typeof products].length} позиций
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Стили для скрытия полосы прокрутки */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CategoriesScreen; 