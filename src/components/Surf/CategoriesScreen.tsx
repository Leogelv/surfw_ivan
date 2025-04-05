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

  // Получаем название категории
  const getCategoryTitle = (category: string): string => {
    const titles: Record<string, { ru: string, en: string }> = {
      coffee: { ru: 'Кофе', en: 'Coffee' },
      drinks: { ru: 'Напитки', en: 'Drinks' },
      food: { ru: 'Еда', en: 'Food' },
    };
    return titles[category]?.ru || category;
  };

  // Получаем цвета для категории
  const getCategoryColors = (category: string): { accent: string, light: string, wave: string } => {
    const colors: Record<string, { accent: string, light: string, wave: string }> = {
      coffee: { accent: 'bg-[#A67C52]', light: 'bg-[#CCA68A]', wave: 'text-[#A67C52]' },
      drinks: { accent: 'bg-[#8D6E63]', light: 'bg-[#BCAAA4]', wave: 'text-[#8D6E63]' },
      food: { accent: 'bg-[#A1887F]', light: 'bg-[#D7CCC8]', wave: 'text-[#A1887F]' },
    };
    return colors[category] || colors.coffee;
  };

  // Получаем узор фона для категории
  const getBgPattern = (category: string): string => {
    const patterns: Record<string, string> = {
      coffee: 'bg-[radial-gradient(circle_at_center,rgba(166,124,82,0.15)_0.5px,transparent_0.5px),radial-gradient(circle_at_center,rgba(166,124,82,0.1)_1px,transparent_1px)]',
      drinks: 'bg-[radial-gradient(circle_at_center,rgba(141,110,99,0.15)_0.5px,transparent_0.5px),radial-gradient(circle_at_center,rgba(141,110,99,0.1)_1px,transparent_1px)]',
      food: 'bg-[radial-gradient(circle_at_center,rgba(161,136,127,0.15)_0.5px,transparent_0.5px),radial-gradient(circle_at_center,rgba(161,136,127,0.1)_1px,transparent_1px)]',
    };
    return patterns[category] || patterns.coffee;
  };

  // Получаем эмодзи для категории
  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      coffee: '☕',
      drinks: '🍵',
      food: '🥐',
    };
    return emojis[category] || '✨';
  };

  // Хардкод данных о продуктах (для демо)
  const productsByCategory: Record<string, Array<{ id: string; name: string; price: number; image: string; description?: string; calories?: number; aspectRatio?: string }>> = {
    coffee: [
      { id: 'latte', name: 'Латте', price: 350, image: '/surf/latte.png', description: 'Нежный латте с бархатистой текстурой', calories: 120, aspectRatio: '3/5' },
      { id: 'americano', name: 'Американо', price: 280, image: '/surf/americano.png', description: 'Классический черный кофе', calories: 10, aspectRatio: '3/5' },
      { id: 'iced-latte', name: 'Айс Латте', price: 380, image: '/surf/icelatte.png', description: 'Охлаждающий латте со льдом', calories: 180, aspectRatio: '3/5' },
    ],
    drinks: [
      { id: 'lemonade', name: 'Лимонад Клубника-Базилик', price: 290, image: '/surf/lemonade.png', description: 'Освежающий лимонад со свежими ягодами', calories: 90, aspectRatio: '3/5' },
      { id: 'green-tea', name: 'Зеленый чай', price: 270, image: '/surf/tea.png', description: 'Премиальный зеленый чай', calories: 0, aspectRatio: '3/5' },
      { id: 'herbal-tea', name: 'Травяной чай', price: 290, image: '/surf/tea_categ.png', description: 'Ароматный травяной чай', calories: 0, aspectRatio: '3/5' },
    ],
    food: [
      { id: 'croissant', name: 'Круассан', price: 220, image: '/surf/croissant.png', description: 'Свежеиспеченный круассан', calories: 240 },
      { id: 'salmon-croissant', name: 'Круассан с лососем', price: 450, image: '/surf/salmoncroissant.png', description: 'Круассан с лососем и сыром', calories: 320 },
      { id: 'panini', name: 'Панини', price: 380, image: '/surf/panini.png', description: 'Горячий итальянский сэндвич', calories: 350 },
      { id: 'pepperoni', name: 'Пицца Пепперони', price: 490, image: '/surf/pepperoni.png', description: 'Сочная пицца с пепперони на тонком тесте', calories: 520 },
    ]
  };

  // Получаем продукты для выбранной категории
  const categoryProducts = selectedCategory ? productsByCategory[selectedCategory] : [];
  
  const colors = getCategoryColors(selectedCategory);

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
      // Проверяем, есть ли в пропсах функция для изменения категории
      if (typeof window !== 'undefined') {
        // Обновляем URL для истории навигации, но без перезагрузки
        window.history.pushState({}, '', `/#${category}`);
        
        // Эмулируем смену категории через URL, чтобы не ломать текущий код SurfApp
        const urlChangeEvent = new CustomEvent('categoriesScreenCategoryChange', { 
          detail: { category } 
        });
        window.dispatchEvent(urlChangeEvent);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816] overflow-hidden">
      {/* Верхний декоративный эффект - только для верхней части, не на весь экран */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0 pointer-events-none"
           style={{ 
             backgroundImage: getBgPattern(selectedCategory), 
             backgroundSize: "40px 40px"
           }}></div>
      
      {/* Круговой градиент по центру верха */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-radial from-[#8B5A2B]/30 to-transparent z-0 pointer-events-none"></div>
      
      {/* Заголовок категории c выпадающим меню - прикрепленный к верху, усиленный sticky */}
      <div className="sticky top-0 z-30 w-full px-6 pt-4 pb-2 bg-gradient-to-b from-[#1D1816] to-[#1D1816]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5">
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
          <div className={`h-[2px] flex-grow rounded-full bg-gradient-to-r ${colors.wave}`}></div>
        </div>
        
        {/* Выпадающий список категорий с абсолютным позиционированием относительно sticky-хедера */}
        {showCategoryDropdown && (
          <div className="absolute left-0 right-0 mt-2 mx-4 p-2 bg-[#2A2118]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-lg z-40 transition-all">
            <div className="grid grid-cols-3 gap-2">
              {productsByCategory && Object.keys(productsByCategory).map(category => {
                const catColors = getCategoryColors(category);
                return (
                  <button
                    key={category}
                    onClick={() => selectCategory(category)}
                    className={`py-2 px-3 rounded-lg transition-all ${
                      category === selectedCategory 
                        ? `bg-gradient-to-r ${catColors.wave} text-white`
                        : 'bg-white/5 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{getCategoryEmoji(category)}</span>
                      <span className="text-sm">{getCategoryTitle(category)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Горизонтальная лента продуктов с эффектом залипания */}
      <div className={`flex-1 overflow-y-hidden relative px-2 pb-24 z-10 transition-opacity duration-300 ${showCategoryDropdown ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        {/* Добавляем сочное фоновое свечение в зависимости от категории */}
        <div className={`absolute -top-20 left-1/2 transform -translate-x-1/2 w-[140%] h-[300px] rounded-full blur-3xl z-0 pointer-events-none ${
          selectedCategory === 'coffee' ? 'bg-gradient-radial from-[#A67C52]/30 via-[#5D4037]/20 to-transparent' :
          selectedCategory === 'drinks' ? 'bg-gradient-radial from-[#8D6E63]/30 via-[#5D4037]/20 to-transparent' :
          'bg-gradient-radial from-[#A1887F]/30 via-[#5D4037]/20 to-transparent'
        }`}></div>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto py-8 px-2 hide-scrollbar snap-x snap-mandatory h-full max-h-[calc(100vh-150px)] relative z-10"
          onScroll={handleScroll}
        >
          {categoryProducts.map((product, index) => {
            const isActive = index === activeProductIndex;
            
            return (
              <div 
                key={product.id} 
                className={`flex-shrink-0 w-[90%] snap-center mx-1 transition-all duration-300 ${
                  isActive 
                    ? 'scale-105 opacity-100 z-20 translate-y-0' 
                    : 'scale-90 opacity-80 z-10 translate-y-2'
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
                <div className={`bg-gradient-to-br from-[#2A2118] via-[#1D1816] to-[#2E241C] backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer h-auto
                  border border-white/10 shadow-xl shadow-black/30 transition-all duration-300 ${
                    selectedCategory === 'coffee' ? 'hover:shadow-[#A67C52]/20' :
                    selectedCategory === 'drinks' ? 'hover:shadow-[#8D6E63]/20' :
                    'hover:shadow-[#A1887F]/20'
                  } hover:shadow-2xl relative`}>
                  
                  {/* Добавляем декоративные элементы для более роскошного вида */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-radial from-white/5 to-transparent rounded-full blur-xl"></div>
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-radial from-white/5 to-transparent rounded-full blur-xl"></div>
                  
                  {/* Изображение продукта с уменьшенной высотой на 15% */}
                  <div className={`relative ${isActive ? 'h-[102vh]' : 'h-[85vh]'} w-full transition-all duration-300 max-h-[500px]`}
                      style={product.aspectRatio ? { aspectRatio: product.aspectRatio } : {}}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.wave} mix-blend-overlay opacity-60 z-10`}></div>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={`object-cover object-center transition-transform duration-500 hover:scale-110`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                    
                    {/* Калории в верхнем правом углу */}
                    {product.calories !== undefined && (
                      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-black/40 backdrop-blur-md rounded-full py-1 px-3 border border-white/10 shadow-lg">
                        <svg className="w-4 h-4 text-[#B98D6F]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                          <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
                        </svg>
                        <span className="text-xs font-medium">{product.calories} кал</span>
                      </div>
                    )}
                    
                    {/* Маленький индикатор в углу */}
                    <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${colors.accent} z-20 animate-pulse`}></div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="font-bold text-xl text-white mb-2">{product.name}</h4>
                    <p className="text-sm text-white/80 line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                    
                    {/* Кнопка для выбора продукта с ценой */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product.id);
                      }} 
                      className={`w-full py-3 rounded-full text-white font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-between px-5 border border-white/10 ${
                        selectedCategory === 'coffee' ? 'bg-gradient-to-r from-[#A67C52]/90 to-[#A67C52]/70 hover:shadow-lg hover:shadow-[#A67C52]/30' :
                        selectedCategory === 'drinks' ? 'bg-gradient-to-r from-[#8D6E63]/90 to-[#8D6E63]/70 hover:shadow-lg hover:shadow-[#8D6E63]/30' :
                        'bg-gradient-to-r from-[#A1887F]/90 to-[#A1887F]/70 hover:shadow-lg hover:shadow-[#A1887F]/30'
                      }`}
                    >
                      <span>Выбрать</span>
                      <span className="rounded-full bg-white/20 px-3 py-1 text-sm">{product.price} ₽</span>
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