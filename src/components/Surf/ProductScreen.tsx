import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ProductScreenProps {
  productName: string;
  onBackClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
}

const ProductScreen = ({ productName, onBackClick, onCartClick, onProfileClick, onLogoClick }: ProductScreenProps) => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isLoaded, setIsLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Анимация загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Сворачивание изображения при скролле
  useEffect(() => {
    const handleScroll = () => {
      if (isImageExpanded && contentRef.current) {
        // Если пользователь начал скроллить контент, сворачиваем изображение
        if (contentRef.current.scrollTop > 20) {
          setIsImageExpanded(false);
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isImageExpanded]);
  
  // Данные о продуктах (хардкод для демо) с ценами в рублях
  const products: Record<string, { name: string; price: number; image: string; description: string; allergens?: string[]; calories?: number; category?: string }> = {
    'cappuccino': {
      name: 'Капучино',
      price: 350,
      image: '/surf/coffee_categ.png',
      description: 'Наш фирменный капучино с идеальным балансом эспрессо, молока и бархатистой пенки. Мягкий вкус с нотками карамели и шоколада.',
      allergens: ['Молоко'],
      calories: 120,
      category: 'coffee'
    },
    'iced-latte': {
      name: 'Айс Латте',
      price: 380,
      image: '/surf/coffee_categ.png',
      description: 'Охлаждающий латте со свежей обжаркой, льдом и нежным молоком. Идеальный выбор для жаркого дня с насыщенным кофейным вкусом.',
      allergens: ['Молоко'],
      calories: 180,
      category: 'coffee'
    },
    'espresso': {
      name: 'Эспрессо',
      price: 250,
      image: '/surf/coffee_categ.png',
      description: 'Насыщенный, крепкий эспрессо из отборных зерен с богатым ароматом и бархатистой пенкой.',
      calories: 5,
      category: 'coffee'
    },
    'green-tea': {
      name: 'Зеленый чай',
      price: 270,
      image: '/surf/tea_categ.png',
      description: 'Премиальный зеленый чай с мягким травяным ароматом и освежающим послевкусием. Богат антиоксидантами и заваривается при идеальной температуре.',
      calories: 0,
      category: 'tea'
    },
    'herbal-tea': {
      name: 'Травяной чай',
      price: 290,
      image: '/surf/tea_categ.png',
      description: 'Ароматный травяной чай из целебных трав, который успокаивает и восстанавливает. Идеальный выбор для вечернего расслабления.',
      calories: 0,
      category: 'tea'
    },
    'black-tea': {
      name: 'Черный чай',
      price: 270,
      image: '/surf/tea_categ.png',
      description: 'Крепкий черный чай с насыщенным вкусом и глубоким ароматом. Идеально подходит для бодрого начала дня.',
      calories: 0,
      category: 'tea'
    },
    'croissant': {
      name: 'Круассан',
      price: 220,
      image: '/surf/croissant.png',
      description: 'Свежеиспеченный круассан с хрустящей корочкой и нежным слоистым тестом внутри. Выпекается каждое утро по традиционному рецепту.',
      allergens: ['Глютен', 'Молоко', 'Яйца'],
      calories: 240,
      category: 'food'
    },
    'sandwich': {
      name: 'Сэндвич',
      price: 380,
      image: '/surf/food_categ.png',
      description: 'Сытный сэндвич на артизанском хлебе с фермерскими ингредиентами. Комбинация свежих овощей, соусов и начинок на ваш выбор.',
      allergens: ['Глютен'],
      calories: 320,
      category: 'food'
    },
    'avocado-toast': {
      name: 'Тост с авокадо',
      price: 450,
      image: '/surf/food_categ.png',
      description: 'Хрустящий тост с авокадо, приправленный специями и зеленью. Питательный и полезный вариант для сытного завтрака или обеда.',
      allergens: ['Глютен'],
      calories: 280,
      category: 'food'
    }
  };
  
  // Получение текущего продукта или использование дефолтного
  const product = products[productName] || {
    name: 'Латте',
    price: 320,
    image: '/surf/coffee_categ.png',
    description: 'Нежный латте с бархатистой текстурой и идеальным балансом эспрессо и молока. Мы используем только свежеобжаренные зерна и локальное молоко.',
    allergens: ['Молоко'],
    calories: 150,
    category: 'coffee'
  };
  
  // Получаем цвет акцента для категории продукта
  const getProductColors = () => {
    const category = product.category || 'coffee';
    const colors: Record<string, { gradient: string, accent: string, shadow: string, light: string, button: string }> = {
      coffee: { 
        gradient: 'from-[#8B5A2B] to-[#3E2723]', 
        accent: 'bg-[#A67C52]',
        shadow: 'shadow-[#A67C52]/30',
        light: 'bg-[#B98D6F]',
        button: 'from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41]'
      },
      tea: { 
        gradient: 'from-[#6B4226] to-[#3E2723]', 
        accent: 'bg-[#8D6E63]',
        shadow: 'shadow-[#8D6E63]/30',
        light: 'bg-[#A1887F]',
        button: 'from-[#8D6E63] to-[#5D4037] hover:from-[#A1887F] hover:to-[#6D4C41]'
      },
      food: { 
        gradient: 'from-[#6D4C41] to-[#3E2723]', 
        accent: 'bg-[#A1887F]',
        shadow: 'shadow-[#A1887F]/30',
        light: 'bg-[#BCAAA4]',
        button: 'from-[#A1887F] to-[#5D4037] hover:from-[#BCAAA4] hover:to-[#6D4C41]'
      },
    };
    return colors[category] || colors.coffee;
  };

  // Получаем соответствующий фон для категории
  const getBgPattern = () => {
    return "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";
  };

  // Получаем эмодзи для категории
  const getProductEmoji = () => {
    const category = product.category || 'coffee';
    const emojis: Record<string, string> = {
      coffee: '☕',
      tea: '🍵',
      food: '🥐',
    };
    return emojis[category] || '✨';
  };
  
  // Расчет цены в зависимости от размера и количества
  const getPrice = () => {
    const sizeMultipliers = {
      small: 0.8,
      medium: 1,
      large: 1.2
    };
    return Math.round(product.price * sizeMultipliers[selectedSize] * quantity);
  };

  // Увеличить количество
  const increaseQuantity = () => {
    if (quantity < 10) setQuantity(prev => prev + 1);
  };

  // Уменьшить количество
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  // Переводы размеров на русский
  const sizeLabels = {
    small: 'Маленький',
    medium: 'Средний',
    large: 'Большой'
  };

  // Добавление товара в корзину
  const addToCart = () => {
    setIsAddingToCart(true); // Начинаем анимацию
    
    // Имитация добавления в корзину
    setTimeout(() => {
      setActiveOrders(prev => prev + 1);
      setIsAddingToCart(false);
      
      // После успешного добавления переходим в корзину
      setTimeout(() => {
        onCartClick();
      }, 300);
    }, 800);
  };

  const toggleImageExpansion = () => {
    setIsImageExpanded(!isImageExpanded);
    
    // Если изображение разворачивается, скроллим страницу вверх
    if (!isImageExpanded && contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const colors = getProductColors();

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: getBgPattern(), 
             backgroundSize: "40px 40px"
           }}></div>
            
      {/* Изображение продукта с эффектом затемнения и зума при загрузке */}
      <div className={`relative bg-black overflow-hidden z-10 transition-all duration-500 ease-in-out ${
        isImageExpanded ? 'h-3/4' : 'h-2/5'
      }`}>
        <div 
          className={`absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        
        {/* Декоративный элемент на изображении */}
        <div className={`absolute top-3 left-3 z-20 rounded-full transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <span className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm rounded-full py-1 px-3 border border-white/10">
            <span className="text-lg">{getProductEmoji()}</span>
            <span className="text-xs font-medium">{product.category?.toUpperCase()}</span>
          </span>
        </div>
        
        <div 
          className={`absolute top-3 right-3 z-20 flex items-center space-x-1 bg-black/40 backdrop-blur-md rounded-full py-1 px-3 border border-white/10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          {product.calories !== undefined && (
            <>
              <svg className="w-4 h-4 text-[#B98D6F]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
              </svg>
              <span className="text-xs">{product.calories} кал</span>
            </>
          )}
        </div>
        
        <div className={`relative h-full w-full transition-transform duration-1000 ${isLoaded ? 'scale-100' : 'scale-110'}`}>
          {/* Оверлей для изображения с цветами категории */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} mix-blend-overlay opacity-20 z-10`}></div>
          
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>
        
        {/* Кнопка расширения/сворачивания изображения */}
        <button 
          className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/10 hover:bg-black/60 ${
            isImageExpanded ? 'rotate-180' : ''
          }`}
          onClick={toggleImageExpansion}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Контент продукта */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto pb-24"
      >
        {/* Информация о продукте с эффектом прозрачности при загрузке */}
        <div className="flex-1 bg-gradient-to-b from-[#2A2118] to-[#1D1816] px-6 py-5 -mt-5 rounded-t-3xl flex flex-col relative z-10 border-t border-white/10">
          {/* Название и цена */}
          <div className={`mb-5 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <div className={`bg-gradient-to-r ${colors.gradient} px-3 py-1 rounded-full text-white font-medium shadow-lg ${colors.shadow}`}>
                <p className="text-xl font-medium">{getPrice()} ₽</p>
              </div>
            </div>
            
            {/* Аллергены если есть */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="flex items-center mt-2 space-x-1">
                <svg className={`w-4 h-4 ${colors.light} bg-clip-text text-transparent`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-white/70">{product.allergens.join(', ')}</span>
              </div>
            )}
          </div>
          
          {/* Выбор размера */}
          <div className={`mb-5 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3 className="text-xl font-medium mb-3 flex items-center">
              Размер
              <div className={`ml-2 w-1.5 h-1.5 rounded-full ${colors.accent} animate-pulse`}></div>
            </h3>
            <div className="flex justify-between space-x-3">
              <button 
                className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'small' ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.shadow}` : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                onClick={() => setSelectedSize('small')}
              >
                {sizeLabels.small}
              </button>
              <button 
                className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'medium' ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.shadow}` : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                onClick={() => setSelectedSize('medium')}
              >
                {sizeLabels.medium}
              </button>
              <button 
                className={`flex-1 py-3 rounded-full transition-all duration-300 ${selectedSize === 'large' ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.shadow}` : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                onClick={() => setSelectedSize('large')}
              >
                {sizeLabels.large}
              </button>
            </div>
          </div>
          
          {/* Выбор количества */}
          <div className={`mb-5 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3 className="text-xl font-medium mb-3 flex items-center">
              Количество
              <div className={`ml-2 w-1.5 h-1.5 rounded-full ${colors.accent} animate-pulse`}></div>
            </h3>
            <div className="flex items-center w-full bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-sm">
              <button 
                onClick={decreaseQuantity}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="flex-1 text-center font-medium text-lg">{quantity}</div>
              <button 
                onClick={increaseQuantity}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Декоративный разделитель */}
          <div className="relative my-6">
            <div className="absolute left-0 right-0 h-[1px] bg-white/10"></div>
            <div className="absolute left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="flex justify-center">
              <div className={`w-2 h-2 rounded-full ${colors.accent} relative top-[-4px] animate-pulse`}></div>
            </div>
          </div>
          
          {/* Описание */}
          <div className={`mb-5 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3 className="text-xl font-medium mb-2">Описание</h3>
            <p className="text-white/70 text-sm leading-relaxed">{product.description}</p>
          </div>
          
          {/* Кнопка добавления в корзину */}
          <div className={`mt-auto mb-20 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button 
              onClick={addToCart}
              disabled={isAddingToCart}
              className={`w-full py-4 bg-gradient-to-r ${colors.button} text-white rounded-full font-bold text-lg transition-all shadow-lg ${colors.shadow} flex items-center justify-center group backdrop-blur-sm border border-white/10 disabled:opacity-70 ${isAddingToCart ? 'animate-pulse' : ''}`}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Добавляем...
                </>
              ) : (
                <>
                  <span className="mr-2">Добавить в корзину</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Фиксированное нижнее меню с логотипом */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          {/* Кнопка назад */}
          <button onClick={onBackClick} className="p-3 relative group">
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Логотип */}
          <div className="cursor-pointer relative" onClick={onLogoClick}>
            <div className="absolute -inset-3 bg-[#A67C52]/10 rounded-full blur-md"></div>
            <Image 
              src="/surf/logo.svg" 
              alt="Surf Coffee" 
              width={120} 
              height={48} 
              className="h-12 w-auto relative"
            />
          </div>
          
          {/* Корзина */}
          <button onClick={onCartClick} className="relative p-3 group">
            <div className="absolute inset-0 scale-0 bg-white/5 rounded-full group-hover:scale-100 transition-transform duration-300"></div>
            {activeOrders > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#A67C52] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeOrders}
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductScreen; 