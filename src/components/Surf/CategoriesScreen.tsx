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

  useEffect(() => {
    setIsLoaded(true);
    // Сброс состояния при изменении категории
    return () => setIsLoaded(false);
  }, [selectedCategory]);

  // Данные о продуктах для каждой категории
  const products = {
    coffee: [
      { id: 'cappuccino', name: 'Cappuccino', price: 4.50, image: '/surf/coffee_categ.png', description: 'Rich, creamy foam with a shot of espresso' },
      { id: 'iced-latte', name: 'Iced Latte', price: 5.00, image: '/surf/coffee_categ.png', description: 'Refreshing cold coffee with milk' },
      { id: 'espresso', name: 'Espresso', price: 3.50, image: '/surf/coffee_categ.png', description: 'Strong concentrated shot of coffee' },
    ],
    tea: [
      { id: 'green-tea', name: 'Green Tea', price: 3.50, image: '/surf/tea_categ.png', description: 'Light, refreshing antioxidant-rich tea' },
      { id: 'black-tea', name: 'Black Tea', price: 3.50, image: '/surf/tea_categ.png', description: 'Full-bodied classic tea' },
      { id: 'herbal-tea', name: 'Herbal Tea', price: 4.00, image: '/surf/tea_categ.png', description: 'Caffeine-free blend of herbs' },
    ],
    food: [
      { id: 'croissant', name: 'Croissant', price: 3.00, image: '/surf/croissant.png', description: 'Buttery, flaky French pastry' },
      { id: 'sandwich', name: 'Sandwich', price: 5.50, image: '/surf/food_categ.png', description: 'Fresh ingredients on artisan bread' },
      { id: 'avocado-toast', name: 'Avocado Toast', price: 6.50, image: '/surf/food_categ.png', description: 'Smashed avocado on toasted bread' },
    ],
  };

  // Получаем продукты для выбранной категории
  const categoryProducts = selectedCategory ? products[selectedCategory as keyof typeof products] : [];
  
  // Получаем заголовок категории
  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      coffee: 'Coffee',
      tea: 'Tea',
      food: 'Food',
    };
    return titles[category] || 'Categories';
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
      
      {/* Лого */}
      <div className="flex justify-center pt-6 pb-2 relative z-10">
        <Image 
          src="/surf/logo.svg" 
          alt="Surf Coffee" 
          width={100} 
          height={40} 
          className="w-24"
        />
      </div>
      
      {/* Заголовок категории */}
      <div className="px-6 pb-2 relative z-10">
        <h2 className="text-3xl font-bold text-black/80">Categories</h2>
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
                        ${product.price.toFixed(2)}
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
            See All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Навигация */}
      <div className="h-16 bg-white border-t border-gray-200 flex justify-around items-center rounded-b-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={onHomeClick} className="flex flex-col items-center text-gray-700 relative group">
          <div className="absolute -inset-4 rounded-full bg-gray-100 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1 relative">Home</span>
        </button>
        
        <button className="flex flex-col items-center relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </button>
        
        <button onClick={onCartClick} className="flex flex-col items-center text-gray-700 relative group">
          <div className="absolute -inset-4 rounded-full bg-gray-100 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-xs mt-1 relative">Cart</span>
        </button>
      </div>
    </div>
  );
};

export default CategoriesScreen; 