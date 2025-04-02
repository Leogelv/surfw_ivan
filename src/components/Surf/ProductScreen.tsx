'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart, CartItem } from './CartContext';

interface ProductScreenProps {
  productName: string;
  onBackClick: () => void;
  onCartClick: () => void;
  isMobile?: boolean; // Опциональный параметр для мобильной версии
}

const ProductScreen = ({ productName, onBackClick, onCartClick, isMobile = false }: ProductScreenProps) => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isLoaded, setIsLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToCart } = useCart();
  
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
      name: 'Капучино',
      price: 350,
      image: '/surf/coffee_categ.png',
      description: 'Наш фирменный капучино с идеальным балансом эспрессо, молока и бархатистой пенки. Мягкий вкус с нотками карамели и шоколада.',
      allergens: ['Молоко'],
      calories: 120
    },
    'iced-latte': {
      name: 'Айс Латте',
      price: 390,
      image: '/surf/coffee_categ.png',
      description: 'Охлаждающий латте со свежей обжаркой, льдом и нежным молоком. Идеальный выбор для жаркого дня с насыщенным кофейным вкусом.',
      allergens: ['Молоко'],
      calories: 180
    },
    'espresso': {
      name: 'Эспрессо',
      price: 250,
      image: '/surf/coffee_categ.png',
      description: 'Насыщенный, крепкий эспрессо из отборных зерен с богатым ароматом и бархатистой пенкой.',
      calories: 5
    },
    'green-tea': {
      name: 'Зеленый чай',
      price: 270,
      image: '/surf/tea_categ.png',
      description: 'Премиальный зеленый чай с мягким травяным ароматом и освежающим послевкусием. Богат антиоксидантами и заваривается при идеальной температуре.',
      calories: 0
    },
    'herbal-tea': {
      name: 'Травяной чай',
      price: 290,
      image: '/surf/tea_categ.png',
      description: 'Ароматный травяной чай из целебных трав, который успокаивает и восстанавливает. Идеальный выбор для вечернего расслабления.',
      calories: 0
    },
    'black-tea': {
      name: 'Черный чай',
      price: 270,
      image: '/surf/tea_categ.png',
      description: 'Крепкий черный чай с насыщенным вкусом и глубоким ароматом. Идеально подходит для бодрого начала дня.',
      calories: 0
    },
    'croissant': {
      name: 'Круассан',
      price: 220,
      image: '/surf/croissant.png',
      description: 'Свежеиспеченный круассан с хрустящей корочкой и нежным слоистым тестом внутри. Выпекается каждое утро по традиционному рецепту.',
      allergens: ['Глютен', 'Молоко', 'Яйца'],
      calories: 240
    },
    'sandwich': {
      name: 'Сэндвич',
      price: 420,
      image: '/surf/food_categ.png',
      description: 'Сытный сэндвич на артизанском хлебе с фермерскими ингредиентами. Комбинация свежих овощей, соусов и начинок на ваш выбор.',
      allergens: ['Глютен'],
      calories: 320
    },
    'avocado-toast': {
      name: 'Тост с авокадо',
      price: 480,
      image: '/surf/food_categ.png',
      description: 'Хрустящий тост с авокадо, приправленный специями и зеленью. Питательный и полезный вариант для сытного завтрака или обеда.',
      allergens: ['Глютен'],
      calories: 280
    }
  };
  
  // Получение текущего продукта или использование дефолтного
  const product = products[productName] || {
    name: 'Латте',
    price: 350,
    image: '/surf/coffee_categ.png',
    description: 'Нежный латте с бархатистой текстурой и идеальным балансом эспрессо и молока. Мы используем только свежеобжаренные зерна и локальное молоко.',
    allergens: ['Молоко'],
    calories: 150
  };
  
  // Расчет цены в зависимости от размера и количества
  const getPrice = () => {
    const sizeMultipliers = {
      small: 0.8,
      medium: 1,
      large: 1.2
    };
    return (product.price * sizeMultipliers[selectedSize] * quantity).toFixed(0) + ' ₽';
  };
  
  // Получение числовой цены для корзины
  const getNumericPrice = () => {
    const sizeMultipliers = {
      small: 0.8,
      medium: 1,
      large: 1.2
    };
    return parseFloat((product.price * sizeMultipliers[selectedSize]).toFixed(0));
  };

  // Увеличить количество
  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(prev => prev + 1);
  };

  // Уменьшить количество
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };
  
  // Добавление товара в корзину
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Добавляем товар в корзину
    const cartItem: CartItem = {
      id: `${productName}-${selectedSize}`,
      name: product.name,
      price: getNumericPrice(),
      quantity: quantity,
      image: product.image,
      size: selectedSize
    };
    
    addToCart(cartItem);
    
    // Показываем уведомление об успешном добавлении
    setTimeout(() => {
      setIsAddingToCart(false);
      setShowSuccess(true);
      
      // Через 2 секунды скрываем уведомление
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    }, 500);
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
              <p className="text-xl font-medium">{getPrice()}</p>
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
          <h3 className="text-xl font-medium mb-3">Размер</h3>
          <div className="flex justify-between space-x-3">
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'small' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('small')}
            >
              Маленький
            </button>
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'medium' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('medium')}
            >
              Средний
            </button>
            <button 
              className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'large' ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={() => setSelectedSize('large')}
            >
              Большой
            </button>
          </div>
        </div>
        
        {/* Выбор количества */}
        <div className={`mb-4 flex items-center transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-medium mr-4">Количество</h3>
          <div className="flex items-center bg-white/10 rounded-full">
            <button 
              onClick={decreaseQuantity}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button 
              onClick={increaseQuantity}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Описание */}
        <div className={`mb-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-medium mb-2">Описание</h3>
          <p className="text-white/80 leading-relaxed">{product.description}</p>
        </div>
        
        {/* Кнопка добавления в корзину */}
        <div className="mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`w-full py-4 rounded-full text-lg font-medium transition-all relative overflow-hidden
                      ${isAddingToCart ? 'bg-amber-700 text-transparent' : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'}`}
          >
            <span className={`transition-opacity ${isAddingToCart ? 'opacity-0' : 'opacity-100'}`}>
              Добавить в корзину - {getPrice()}
            </span>
            {isAddingToCart && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          
          {/* Уведомление об успешном добавлении */}
          <div className={`absolute bottom-5 left-0 right-0 mx-auto max-w-xs bg-green-500/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center transform
                          ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Добавлено в корзину</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductScreen; 