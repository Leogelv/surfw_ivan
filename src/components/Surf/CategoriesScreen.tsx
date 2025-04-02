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
    const colors: Record<string, string> = {
      coffee: 'from-amber-800 to-amber-950',
      tea: 'from-green-800 to-green-950',
      food: 'from-orange-800 to-orange-950',
    };
    return colors[category] || 'from-gray-800 to-gray-950';
  };

  return (
    <div className="h-full bg-[#F5F0E8] flex flex-col">
      {/* Размытый фон наверху */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-800/10 to-transparent z-0"></div>
      
      {/* Фиксированный хедер с логотипом */}
      <div className="fixed top-7 left-0 right-0 z-30 bg-white/80 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Активные заказы */}
          <button className="relative p-2">
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="cursor-pointer" onClick={onHomeClick}>
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={100} 
              height={40} 
              className="h-10 w-auto"
            />
          </div>
          
          {/* Иконки справа */}
          <div className="flex space-x-2">
            <button onClick={onCartClick} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Заголовок категории */}
      <div className="px-6 pt-20 pb-2 relative z-10">
        <h2 className="text-3xl font-bold text-black/80">Категории</h2>
        <div className="flex items-center mt-4">
          <h3 className="text-2xl font-bold text-black mr-2">{getCategoryTitle(selectedCategory)}</h3>
          <div className={`h-1 flex-grow rounded-full bg-gradient-to-r ${getCategoryColor(selectedCategory)}`}></div>
        </div>
      </div>

      {/* Список продуктов */}
      <div className="flex-1 overflow-auto px-6 pb-4 relative z-10">
        <div className="flex flex-col space-y-4">
          {categoryProducts.map((product, index) => (
            <div 
              key={product.id} 
              className={`transform transition-all duration-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div 
                className={`bg-white rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 ${hoveredProduct === product.id ? 'scale-[1.02]' : ''}`}
                onClick={() => onProductClick(product.id)}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="flex p-2">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent"></div>
                  </div>
                  <div className="px-4 flex flex-col justify-center flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-gray-900">{product.name}</h4>
                      <span className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {product.price} ₽
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Ссылка "Смотреть все" */}
        <div className="text-right mt-4">
          <button className="text-amber-800 font-medium hover:text-amber-600 transition-colors flex items-center ml-auto">
            Смотреть все
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen; 