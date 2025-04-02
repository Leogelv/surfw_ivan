import Image from 'next/image';
import { useState, useEffect } from 'react';

interface CategoriesScreenProps {
  selectedCategory: string;
  onProductClick: (product: string) => void;
  onHomeClick: () => void;
  onCartClick: () => void;
}

const CategoriesScreen = ({ selectedCategory, onProductClick, onHomeClick, onCartClick }: CategoriesScreenProps) => {
  // Анимация для категорий
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов

  useEffect(() => {
    setIsLoaded(true);
    // Сброс состояния при изменении категории
    return () => setIsLoaded(false);
  }, [selectedCategory]);

  // Данные о продуктах для каждой категории (цены в рублях)
  const products = {
    coffee: [
      { id: 'cappuccino', name: 'Капучино', price: 350, image: '/surf/coffee_categ.png', description: 'Насыщенный эспрессо с нежной молочной пенкой' },
      { id: 'iced-latte', name: 'Айс Латте', price: 380, image: '/surf/coffee_categ.png', description: 'Освежающий холодный кофе с молоком' },
      { id: 'espresso', name: 'Эспрессо', price: 250, image: '/surf/coffee_categ.png', description: 'Крепкий концентрированный кофе' },
    ],
    tea: [
      { id: 'green-tea', name: 'Зеленый чай', price: 270, image: '/surf/tea_categ.png', description: 'Легкий, освежающий чай, богатый антиоксидантами' },
      { id: 'black-tea', name: 'Черный чай', price: 270, image: '/surf/tea_categ.png', description: 'Классический насыщенный чай' },
      { id: 'herbal-tea', name: 'Травяной чай', price: 290, image: '/surf/tea_categ.png', description: 'Успокаивающий чай без кофеина' },
    ],
    food: [
      { id: 'croissant', name: 'Круассан', price: 220, image: '/surf/croissant.png', description: 'Хрустящий масляный французский круассан' },
      { id: 'sandwich', name: 'Сэндвич', price: 380, image: '/surf/food_categ.png', description: 'Свежие ингредиенты на ремесленном хлебе' },
      { id: 'avocado-toast', name: 'Тост с авокадо', price: 450, image: '/surf/food_categ.png', description: 'Авокадо на тосте из цельнозернового хлеба' },
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
        gradient: 'from-amber-700 to-amber-950', 
        accent: 'bg-amber-500',
        shadow: 'shadow-amber-500/30'
      },
      tea: { 
        gradient: 'from-green-700 to-green-950', 
        accent: 'bg-green-500',
        shadow: 'shadow-green-500/30'
      },
      food: { 
        gradient: 'from-orange-700 to-orange-950', 
        accent: 'bg-orange-500',
        shadow: 'shadow-orange-500/30'
      },
    };
    return colors[category] || { 
      gradient: 'from-gray-700 to-gray-950', 
      accent: 'bg-gray-500',
      shadow: 'shadow-gray-500/30'
    };
  };

  // Получаем соответствующий фон для категории
  const getBgPattern = (category: string) => {
    if (category === 'coffee') return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
    if (category === 'tea') return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23248D46' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
    if (category === 'food') return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D97706' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
    return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23808080' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0A0908] via-[#1E1B19] to-[#0A0908]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: getBgPattern(selectedCategory), 
             backgroundSize: "40px 40px"
           }}></div>
      
      {/* Круговой градиент по центру верха */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-radial from-amber-700/30 to-transparent z-0"></div>
      
      {/* Заголовок категории */}
      <div className="px-6 pt-4 pb-2 relative z-10">
        <div className="text-white flex items-center space-x-2 opacity-80">
          <div className="text-xl">{getCategoryEmoji(selectedCategory)}</div>
          <h2 className="text-2xl font-bold">Категории</h2>
        </div>
        <div className="flex items-center mt-4">
          <h3 className="text-3xl font-bold text-white mr-2 flex items-center">
            {getCategoryTitle(selectedCategory)}
            <div className={`ml-2 w-2 h-2 rounded-full animate-pulse ${colors.accent}`}></div>
          </h3>
          <div className={`h-[2px] flex-grow rounded-full bg-gradient-to-r ${colors.gradient}`}></div>
        </div>
      </div>

      {/* Список продуктов */}
      <div className="flex-1 overflow-auto px-6 pb-24 relative z-10">
        <div className="flex flex-col space-y-4 mt-4">
          {categoryProducts.map((product, index) => (
            <div 
              key={product.id} 
              className={`transform transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div 
                className={`bg-[#131212]/70 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300 
                  border border-white/5 ${colors.shadow} ${hoveredProduct === product.id ? 'scale-[1.02] shadow-lg shadow-black/50' : 'shadow-md shadow-black/30'}`}
                onClick={() => onProductClick(product.id)}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="flex p-3">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} mix-blend-overlay opacity-60 z-10`}></div>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                    {/* Маленький индикатор в углу */}
                    <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${colors.accent} z-20 animate-pulse`}></div>
                  </div>
                  <div className="px-3 flex flex-col justify-center flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white">{product.name}</h4>
                      <div className={`bg-gradient-to-r ${colors.gradient} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {product.price} ₽
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-snug">{product.description}</p>
                    
                    {/* Кнопка для добавления */}
                    <div className="flex justify-end mt-1">
                      <button className={`text-xs font-medium text-white/80 hover:text-white flex items-center transition-all`}>
                        <span className="mr-1">Выбрать</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${hoveredProduct === product.id ? 'translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Декоративные элементы */}
        <div className="relative mt-6 mb-4">
          <div className="absolute left-0 right-0 h-[1px] bg-white/10"></div>
          <div className="absolute left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="flex justify-center">
            <div className={`w-2 h-2 rounded-full ${colors.accent} relative top-[-4px] animate-pulse`}></div>
          </div>
        </div>
        
        {/* Ссылка "Смотреть все" */}
        <div className="flex justify-center mt-2">
          <button className={`text-white/80 font-medium hover:text-white transition-colors flex items-center space-x-2 py-2 px-4 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10`}>
            <span>Смотреть все</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Фиксированное нижнее меню с логотипом */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-md px-4 py-3 border-t border-white/10">
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
          <div className="cursor-pointer relative" onClick={onHomeClick}>
            <div className="absolute -inset-2 bg-white/5 rounded-full blur-md"></div>
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={100} 
              height={40} 
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
    </div>
  );
};

export default CategoriesScreen; 