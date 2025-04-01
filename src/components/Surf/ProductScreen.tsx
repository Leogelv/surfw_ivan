import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProductScreenProps {
  productName: string;
  onBackClick: () => void;
  onCartClick: () => void;
}

const ProductScreen = ({ productName, onBackClick, onCartClick }: ProductScreenProps) => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isLoaded, setIsLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Анимация загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Данные о продуктах (хардкод для демо)
  const products: Record<string, { name: string; price: number; image: string; description: string; allergens?: string[]; calories?: number }> = {
    'cappuccino': {
      name: 'Cappuccino',
      price: 4.50,
      image: '/surf/coffee_categ.png',
      description: 'Наш фирменный капучино с идеальным балансом эспрессо, молока и бархатистой пенки. Мягкий вкус с нотками карамели и шоколада.',
      allergens: ['Milk'],
      calories: 120
    },
    'iced-latte': {
      name: 'Iced Latte',
      price: 5.00,
      image: '/surf/coffee_categ.png',
      description: 'Охлаждающий латте со свежей обжаркой, льдом и нежным молоком. Идеальный выбор для жаркого дня с насыщенным кофейным вкусом.',
      allergens: ['Milk'],
      calories: 180
    },
    'espresso': {
      name: 'Espresso',
      price: 3.00,
      image: '/surf/coffee_categ.png',
      description: 'Насыщенный, крепкий эспрессо из отборных зерен с богатым ароматом и бархатистой пенкой.',
      calories: 5
    },
    'green-tea': {
      name: 'Green Tea',
      price: 3.50,
      image: '/surf/tea_categ.png',
      description: 'Премиальный зеленый чай с мягким травяным ароматом и освежающим послевкусием. Богат антиоксидантами и заваривается при идеальной температуре.',
      calories: 0
    },
    'herbal-tea': {
      name: 'Herbal Tea',
      price: 4.00,
      image: '/surf/tea_categ.png',
      description: 'Ароматный травяной чай из целебных трав, который успокаивает и восстанавливает. Идеальный выбор для вечернего расслабления.',
      calories: 0
    },
    'black-tea': {
      name: 'Black Tea',
      price: 3.50,
      image: '/surf/tea_categ.png',
      description: 'Крепкий черный чай с насыщенным вкусом и глубоким ароматом. Идеально подходит для бодрого начала дня.',
      calories: 0
    },
    'croissant': {
      name: 'Croissant',
      price: 3.00,
      image: '/surf/croissant.png',
      description: 'Свежеиспеченный круассан с хрустящей корочкой и нежным слоистым тестом внутри. Выпекается каждое утро по традиционному рецепту.',
      allergens: ['Gluten', 'Milk', 'Eggs'],
      calories: 240
    },
    'sandwich': {
      name: 'Sandwich',
      price: 5.50,
      image: '/surf/food_categ.png',
      description: 'Сытный сэндвич на артизанском хлебе с фермерскими ингредиентами. Комбинация свежих овощей, соусов и начинок на ваш выбор.',
      allergens: ['Gluten'],
      calories: 320
    },
    'avocado-toast': {
      name: 'Avocado Toast',
      price: 6.50,
      image: '/surf/food_categ.png',
      description: 'Хрустящий тост с авокадо, приправленный специями и зеленью. Питательный и полезный вариант для сытного завтрака или обеда.',
      allergens: ['Gluten'],
      calories: 280
    }
  };
  
  // Получение текущего продукта или использование дефолтного
  const product = products[productName] || {
    name: 'Latte',
    price: 4.50,
    image: '/surf/coffee_categ.png',
    description: 'Нежный латте с бархатистой текстурой и идеальным балансом эспрессо и молока. Мы используем только свежеобжаренные зерна и локальное молоко.',
    allergens: ['Milk'],
    calories: 150
  };
  
  // Расчет цены в зависимости от размера и количества
  const getPrice = () => {
    const sizeMultipliers = {
      small: 0.8,
      medium: 1,
      large: 1.2
    };
    return (product.price * sizeMultipliers[selectedSize] * quantity).toFixed(2);
  };

  // Увеличить количество
  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(prev => prev + 1);
  };

  // Уменьшить количество
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  return (
    <div className="h-full flex flex-col text-white">
      {/* Изображение продукта с эффектом затемнения и зума при загрузке */}
      <div className="relative h-2/5 bg-black overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        <button 
          onClick={onBackClick}
          className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-md rounded-full p-2 transition-transform hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div 
          className={`absolute top-4 right-4 z-20 flex items-center space-x-1 bg-black/40 backdrop-blur-md rounded-full py-1 px-3 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          {product.calories !== undefined && (
            <>
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
              </svg>
              <span className="text-xs">{product.calories} cal</span>
            </>
          )}
        </div>
        <div className={`relative h-full w-full transition-transform duration-1000 ${isLoaded ? 'scale-100' : 'scale-110'}`}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
      
      {/* Информация о продукте с эффектом прозрачности при загрузке */}
      <div className="flex-1 bg-gradient-to-b from-[#3D322B] to-[#2A201A] px-6 py-5 -mt-5 rounded-t-3xl flex flex-col relative z-10">
        {/* Название и цена */}
        <div className={`mb-5 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
              <p className="text-xl font-medium">${getPrice()}</p>
            </div>
          </div>
          
          {/* Аллергены если есть */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="flex items-center mt-2 space-x-1">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-amber-200">{product.allergens.join(', ')}</span>
            </div>
          )}
        </div>
        
        {/* Выбор размера */}
        <div className={`mb-5 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-medium mb-3">Size</h3>
          <div className="flex justify-between space-x-3">
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'small' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('small')}
            >
              Small
            </button>
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'medium' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('medium')}
            >
              Medium
            </button>
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'large' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('large')}
            >
              Large
            </button>
          </div>
        </div>
        
        {/* Выбор количества */}
        <div className={`mb-5 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-medium mb-3">Quantity</h3>
          <div className="flex items-center w-full bg-white/10 rounded-full p-1">
            <button 
              onClick={decreaseQuantity}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="flex-1 text-center font-medium text-lg">{quantity}</div>
            <button 
              onClick={increaseQuantity}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Описание */}
        <div className={`mb-5 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-medium mb-2">Description</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
        </div>
        
        {/* Кнопка добавления в корзину */}
        <div className={`mt-auto transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button 
            onClick={onCartClick}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-full font-bold text-lg transition-colors shadow-lg flex items-center justify-center group"
          >
            <span className="mr-2">Add to Cart</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 transition-transform group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductScreen; 