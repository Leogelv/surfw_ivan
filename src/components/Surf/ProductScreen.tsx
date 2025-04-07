import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import AnimatedCoffeeCounter from './AnimatedCoffeeCounter';
import useSafeAreaInsets from '@/hooks/useSafeAreaInsets';

// Использую интерфейс без глобального определения
interface TelegramWebApp {
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

// Вспомогательная функция для haptic feedback
const triggerHapticFeedback = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

interface ProductScreenProps {
  productName: string;
  onBackClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onAddToCart?: (productId: string, quantity: number) => void;
  showCart?: boolean; // Флаг для отображения иконки корзины
}

const ProductScreen = ({ productName, onBackClick, onCartClick, onProfileClick, onLogoClick, onAddToCart, showCart = true }: ProductScreenProps) => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false); // Новый стейт для анимации кнопки
  const [quantity, setQuantity] = useState(1);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [selectedMilk, setSelectedMilk] = useState<string>('Обычное');
  const [selectedSyrup, setSelectedSyrup] = useState<string[]>([]);
  const [extraShot, setExtraShot] = useState(false);
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [triggerAnimate, setTriggerAnimate] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const prevQuantityRef = useRef<number>(quantity); // Для отслеживания предыдущего значения quantity
  const lastDeltaY = useRef<number>(0);
  const swipeBackThreshold = 100; // Порог для свайпа назад
  
  // Получаем отступы безопасной зоны
  const safeAreaInsets = useSafeAreaInsets();
  
  // Обновляем prevQuantityRef.current после рендера
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      prevQuantityRef.current = quantity;
    }, 50); // Небольшая задержка, чтобы анимация успела запуститься
    
    return () => clearTimeout(timeoutId);
  }, [quantity]);
  
  // Анимация загрузки
  useEffect(() => {
    // Первая анимация - загрузка контента
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Вторая анимация - появление кнопки
    const buttonTimer = setTimeout(() => {
      setIsButtonVisible(true);
    }, 2000); // 2 секунды = 1с на первую анимацию + 1с задержка

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  // Сворачивание изображения при скролле
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        // Если scrollTop < 0, это означает что пользователь тянет экран вниз
        const position = contentRef.current.scrollTop;
        setScrollPosition(position);
        
        // Если пользователь начал скроллить контент вверх, сворачиваем изображение
        if (position > 20 && isImageExpanded) {
          setIsImageExpanded(false);
        }
        
        // Если пользователь тянет экран вниз сильно когда уже в начале списка, 
        // разворачиваем изображение
        if (position <= 0 && !isImageExpanded && position < -30) {
          setIsImageExpanded(true);
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isImageExpanded]);
  
  // Получаем модификаторы для продукта
  const getProductModifiers = () => {
    const isCoffee = product.category === 'coffee';
    const isFood = product.category === 'food';

    const milkOptions = isCoffee ? ['Обычное', 'Растительное', 'Овсяное', 'Миндальное', 'Кокосовое', 'Без молока'] : [];
    const syrupOptions = isCoffee ? ['Карамель', 'Ваниль', 'Лесной орех', 'Кокос', 'Шоколад'] : [];
    
    const foodOptions = isFood ? [
      'Подогреть', 
      'Без глютена', 
      'Дополнительная порция', 
      'Джем',
      'Сливочное масло',
      'Мед'
    ] : [];

    return {
      milkOptions,
      syrupOptions,
      canAddExtraShot: isCoffee,
      foodOptions
    };
  };

  // Получаем цены модификаторов
  const getModifierPrice = (modifier: string): number => {
    const priceMap: Record<string, number> = {
      'Растительное': 70,
      'Овсяное': 70,
      'Миндальное': 90,
      'Кокосовое': 90,
      'Без глютена': 70,
      'Дополнительная порция': 100,
      'Джем': 50,
      'Сливочное масло': 30,
      'Мед': 50,
      'Карамель': 50,
      'Ваниль': 50,
      'Лесной орех': 50,
      'Кокос': 50,
      'Шоколад': 50
    };
    
    return priceMap[modifier] || 0;
  };

  // Обработчик клика на сироп
  const handleSyrupToggle = (syrup: string) => {
    setSelectedSyrup(prev => 
      prev.includes(syrup) 
        ? prev.filter(s => s !== syrup) 
        : [...prev, syrup]
    );
  };

  // Обработчик клика на опцию еды
  const handleFoodOptionToggle = (option: string) => {
    setSelectedFoodOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option) 
        : [...prev, option]
    );
  };
  
  // Данные о продуктах (хардкод для демо) с ценами в рублях
  const products: Record<string, { name: string; price: number; image: string; description: string; allergens?: string[]; calories?: number; category?: string }> = {
    'latte': {
      name: 'Латте',
      price: 350,
      image: '/surf/latte.png',
      description: 'Нежный латте с бархатистой текстурой и идеальным балансом эспрессо и молока. Мы используем только свежеобжаренные зерна и локальное молоко.',
      allergens: ['Молоко'],
      calories: 120,
      category: 'coffee'
    },
    'americano': {
      name: 'Американо',
      price: 280,
      image: '/surf/americano.png',
      description: 'Классический черный кофе с насыщенным вкусом. Приготовлен из отборных зерен свежей обжарки.',
      calories: 10,
      category: 'coffee'
    },
    'iced-latte': {
      name: 'Айс Латте',
      price: 380,
      image: '/surf/icelatte.png',
      description: 'Охлаждающий латте со свежей обжаркой, льдом и нежным молоком. Идеальный выбор для жаркого дня с насыщенным кофейным вкусом.',
      allergens: ['Молоко'],
      calories: 180,
      category: 'coffee'
    },
    'lemonade': {
      name: 'Лимонад Клубника-Базилик',
      price: 290,
      image: '/surf/lemonade.png',
      description: 'Освежающий лимонад с сочной клубникой и ароматным базиликом. Идеальный баланс сладости и свежести.',
      calories: 90,
      category: 'drinks'
    },
    'green-tea': {
      name: 'Зеленый чай',
      price: 270,
      image: '/surf/tea_mint.png',
      description: 'Премиальный зеленый чай с мягким травяным ароматом и освежающим послевкусием. Богат антиоксидантами и заваривается при идеальной температуре.',
      calories: 0,
      category: 'drinks'
    },
    'herbal-tea': {
      name: 'Травяной чай',
      price: 290,
      image: '/surf/tea_categ.png',
      description: 'Ароматный травяной чай из целебных трав, который успокаивает и восстанавливает. Идеальный выбор для вечернего расслабления.',
      calories: 0,
      category: 'drinks'
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
    'salmon-croissant': {
      name: 'Круассан с лососем',
      price: 450,
      image: '/surf/salmoncroissant.png',
      description: 'Слоеный круассан с нежным лососем слабой соли, сливочным сыром и свежими микрозеленью. Идеальный выбор для сытного завтрака.',
      allergens: ['Глютен', 'Молоко', 'Яйца', 'Рыба'],
      calories: 320,
      category: 'food'
    },
    'panini': {
      name: 'Панини',
      price: 380,
      image: '/surf/panini.png',
      description: 'Горячий итальянский сэндвич с хрустящей корочкой, сыром и овощами. Подается с соусом на выбор.',
      allergens: ['Глютен', 'Молоко'],
      calories: 350,
      category: 'food'
    }
  };
  
  // Получение текущего продукта или использование дефолтного
  const product = products[productName] || {
    name: 'Латте',
    price: 320,
    image: '/surf/latte.png',
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
      drinks: { 
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
      drinks: '🍵',
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
    
    let basePrice = Math.round(product.price * sizeMultipliers[selectedSize]);
    
    // Добавляем цену за выбранные сиропы
    const syrupPrice = selectedSyrup.reduce((total, syrup) => total + getModifierPrice(syrup), 0);
    
    // Добавляем цену за выбранное молоко
    const milkPrice = selectedMilk !== 'Обычное' && selectedMilk !== 'Без молока' ? getModifierPrice(selectedMilk) : 0;
    
    // Добавляем цену за дополнительный эспрессо
    const extraShotPrice = extraShot ? 70 : 0;
    
    // Добавляем цену за дополнительные опции для еды
    const foodOptionsPrice = selectedFoodOptions.reduce((total, option) => total + getModifierPrice(option), 0);
    
    const totalItemPrice = basePrice + syrupPrice + milkPrice + extraShotPrice + foodOptionsPrice;
    return totalItemPrice * quantity;
  };

  // Получаем общую сумму дополнительных модификаторов
  const getExtraModifiersPrice = () => {
    let total = 0;
    
    // Молоко
    if (selectedMilk !== 'Обычное' && selectedMilk !== 'Без молока') {
      total += getModifierPrice(selectedMilk);
    }
    
    // Сиропы
    total += selectedSyrup.reduce((sum, syrup) => sum + getModifierPrice(syrup), 0);
    
    // Доп. эспрессо
    if (extraShot) total += 70;
    
    // Опции для еды
    total += selectedFoodOptions.reduce((sum, option) => sum + getModifierPrice(option), 0);
    
    return total;
  };
  
  // Увеличить количество
  const increaseQuantity = () => {
    if (quantity < 10) {
      // Сохраняем текущее значение перед обновлением
      prevQuantityRef.current = quantity;
      setQuantity(prev => prev + 1);
      triggerHapticFeedback('light');
    }
  };

  // Уменьшить количество
  const decreaseQuantity = () => {
    if (quantity > 1) {
      // Сохраняем текущее значение перед обновлением
      prevQuantityRef.current = quantity;
      setQuantity(prev => prev - 1);
      triggerHapticFeedback('light');
    }
  };

  // Переводы размеров на русский
  const sizeLabels = {
    small: 'Маленький',
    medium: 'Средний',
    large: 'Большой'
  };

  // Добавление товара в корзину
  const addToCart = () => {
    // Добавляем тактильный отклик
    triggerHapticFeedback('medium');
    
    setIsAddingToCart(true); // Начинаем анимацию
    
    // Имитация добавления в корзину
    setTimeout(() => {
      setActiveOrders(prev => prev + 1);
      setIsAddingToCart(false);
      
      // Если передан обработчик, используем его
      if (onAddToCart) {
        // Получаем правильный размер для передачи
        const sizeLabel = sizeLabels[selectedSize];
        // Формируем объект, включая все нужные данные: id, количество, размер, изображение
        onAddToCart(productName, quantity);
      }
      
      // В любом случае переходим в корзину
      setTimeout(() => {
        onCartClick();
      }, 300);
    }, 800);
  };

  const colors = getProductColors();

  // Расчет высоты фото в зависимости от прокрутки
  const getImageHeight = () => {
    // Для категорий кофе и напитков делаем вытянутую форму (3:5, высота = 1.67 * ширина)
    const isCoffeeOrDrinks = product.category === 'coffee' || product.category === 'drinks';
    
    if (isImageExpanded) {
      return isCoffeeOrDrinks ? 'calc(100vw * 1.42)' : '100vw'; // Уменьшили с 1.67 до 1.42 (на ~15%)
    }
    
    // Определяем базовую высоту в зависимости от категории
    const baseHeight = isCoffeeOrDrinks 
      ? 'calc(100vw * 1.13)' // Уменьшили с 1.33 до 1.13 (на ~15%)
      : 'calc(100vw * 0.8)'; // Квадратная форма для остальных категорий
    
    // Если скролл имеет отрицательное значение (тянут вниз), расширяем фото
    if (scrollPosition < -50) {
      return isCoffeeOrDrinks ? 'calc(100vw * 1.42)' : '100vw';
    }
    
    return baseHeight;
  };

  // Обработчики для свайпа изображения
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  // Обработчик скролла для отображения заголовка
  const handleScroll = () => {
    if (contentRef.current) {
      const scrollTop = contentRef.current.scrollTop;
      setScrollY(scrollTop);
    }
  };

  // Обработка свайпа вниз для возврата на страницу категорий
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    lastDeltaY.current = deltaY;
    
    // Проверяем условия для активации возврата через свайп вниз
    if (contentRef.current && contentRef.current.scrollTop <= 0 && deltaY > 70) {
      // Если пользователь уже в начале списка и тянет вниз
      if (!isImageExpanded) {
        setIsImageExpanded(true);
        triggerHapticFeedback('light');
      } else if (deltaY > swipeBackThreshold) {
        // Если фото уже увеличено и продолжает тянуть - готовимся к возврату
        if (imageRef.current) {
          imageRef.current.style.transform = `translateY(${deltaY / 2}px) scale(${1 - deltaY / 1000})`;
        }
      }
    }
    
    // Расчет нового размера фото при свайпе
    if (deltaY < 0) {
      // Свайп вверх - складываем фото
      if (isImageExpanded) {
        setIsImageExpanded(false);
      }
    } else if (isImageExpanded) {
      // Свайп вниз при развернутом фото
      const progress = Math.min(1, deltaY / 150);
      setScrollPosition(deltaY);
    }
  };

  const handleTouchEnd = () => {
    // Проверяем, нужно ли вернуться назад
    if (isImageExpanded && lastDeltaY.current > swipeBackThreshold) {
      triggerHapticFeedback('medium');
      // Добавляем небольшую задержку для анимации
      setTimeout(() => {
        onBackClick();
      }, 100);
    }
    
    // Сбрасываем стили для элемента с изображением
    if (imageRef.current) {
      imageRef.current.style.transform = '';
    }
    
    touchStartY.current = null;
    lastDeltaY.current = 0;
  };

  // Получение состава продукта
  const getProductIngredients = () => {
    const category = product.category || 'coffee';
    
    // Разные составы в зависимости от категории и типа продукта
    if (category === 'food') {
      if (product.name.toLowerCase().includes('круассан')) {
        return 'мука, сливочное масло, сахар, соль, дрожжи, яйца';
      } else if (product.name.toLowerCase().includes('панини')) {
        return 'хлеб, сыр, томаты, базилик, оливковое масло';
      } else {
        return 'мука, сахар, яйца, растительные и животные жиры, разрыхлитель';
      }
    } else if (category === 'coffee') {
      return 'кофе арабика, вода' + (product.name.toLowerCase().includes('латте') ? ', молоко' : '');
    } else if (category === 'drinks') {
      if (product.name.toLowerCase().includes('лимонад')) {
        return 'вода, сахар, лимонный сок, клубника, базилик';
      } else if (product.name.toLowerCase().includes('зелен')) {
        return 'листья зеленого чая, природные ароматизаторы';
      } else if (product.name.toLowerCase().includes('травян')) {
        return 'смесь трав, цветов и специй';
      }
      return 'чайные листья, натуральные экстракты';
    }
    
    return '';
  };

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: getBgPattern(), 
             backgroundSize: "30px 30px"
           }}></div>
      
      {/* Круговой градиент по центру */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-radial from-[#8B5A2B]/20 to-transparent opacity-70 z-0"></div>
      
      {/* Кнопка закрытия (вверху) - Фиксированная */}
      <button 
        onClick={onBackClick} 
        className="fixed z-50 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-lg"
        style={{
          top: '100px', // Фиксированный отступ 100px
          left: `${safeAreaInsets.left + 16}px`
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Основное содержимое, начинается под изображением */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto hide-scrollbar relative z-10"
        onScroll={handleScroll}
        style={{ 
          paddingBottom: `${safeAreaInsets.bottom}px`
        }}
      >
        <div className="min-h-full pb-36">
          {/* Фото продукта с возможностью растягивания - занимает всю ширину и начинается от верха */}
          <div 
            ref={imageRef}
            className={`w-full absolute top-0 left-0 right-0 overflow-hidden transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-y-0 scale-100' : 'translate-y-[-10%] scale-110'
            }`}
            style={{ height: getImageHeight() }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} mix-blend-overlay opacity-30 z-10`}></div>
            
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="100vw"
              className={`object-cover object-center transition-transform duration-700 ${isImageExpanded ? 'scale-110' : 'scale-100'}`}
            />
            
            {/* Градиент на фото снизу */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#1D1816] to-transparent z-10"></div>
            
            {/* Калории в правом верхнем углу - Фиксированные */}
            {product.calories && (
              <div 
                className="fixed z-50 flex items-center space-x-1 bg-black/60 backdrop-blur-md rounded-full py-1 px-3 border border-white/10 shadow-lg"
                style={{
                  top: '100px', // Фиксированный отступ 100px
                  right: `${safeAreaInsets.right + 16}px`
                }}
              >
                <svg className={`w-4 h-4 ${colors.accent}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                  <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
                </svg>
                <span className="text-xs font-medium">{product.calories} кал</span>
              </div>
            )}
          </div>
          
          {/* Контент продукта - теперь начинается с отступом равным высоте фото */}
          <div 
            className={`relative bg-gradient-to-b from-[#1D1816] to-[#242019] rounded-t-[2rem] px-6 pt-8 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.25)] border-t border-white/10 transition-all duration-1000 ease-out ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[50%] opacity-0'
            }`}
            style={{ marginTop: getImageHeight() }}
          >
            {/* Название и цена */}
            <div className={`mb-5 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold relative">
                  {/* Декоративные элементы для названия продукта */}
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 text-[#A67C52] opacity-50">
                    <svg className="w-3 h-10" viewBox="0 0 24 100" fill="currentColor">
                      <path d="M5,0 L5,100 M15,20 L15,80" strokeWidth="3" stroke="currentColor"/>
                    </svg>
                  </div>
                  <div className="ml-1">{product.name}</div>
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-[#A67C52] opacity-10">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 18C15.8971 18 15.8971 16 15.8971 16L16 11.9662C17.0304 11.1576 17.6232 10.1649 17.6647 8.6182C17.7144 6.75246 16.4864 5 14.5 5C12.5 5 11.5 7 11.5 9C11.5 10.3894 12.5 12.5 12.5 12.5L13 16C13 16 13 18 7 18"></path>
                      <path d="M11.5 16C11.5 16 11.5 18 6.5 18"></path>
                      <path d="M17.5 13C17.5 13 19 13 19 15C19 16.6667 17.5 16.5 17.5 16.5"></path>
                    </svg>
                  </div>
                </h1>
              </div>
              
              {/* Цена вынесена в отдельный блок под названием */}
              <div className="mt-3 inline-block">
                <div className={`bg-gradient-to-r ${colors.gradient} px-5 py-2 rounded-full text-white font-medium shadow-lg ${colors.shadow} flex items-center`}>
                  <svg className="w-5 h-5 mr-2 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,17V16H9V14H13V13H10A1,1 0 0,1 9,12V9A1,1 0 0,1 10,8H11V7H13V8H15V10H11V11H14A1,1 0 0,1 15,12V15A1,1 0 0,1 14,16H13V17H11Z" />
                  </svg>
                  <p className="text-2xl font-medium">{getPrice()} ₽</p>
                </div>
              </div>
            </div>
            
            {/* Описание продукта */}
            <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '100ms' }}>
              <p className="text-white/80 mb-1">{product.description}</p>
              
              {/* Ингредиенты */}
              {getProductIngredients().length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white/60 text-sm uppercase mb-2 tracking-wider font-medium">Состав:</h3>
                  <div className="flex flex-wrap gap-2">
                    {getProductIngredients().split(', ').map((ingredient: string) => (
                      <div key={ingredient} className="bg-white/5 rounded-full px-3 py-1 text-sm text-white/70">
                        {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Выбор размера только для кофе и напитков */}
            {(product.category === 'coffee' || product.category === 'drinks') && (
              <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: '150ms' }}>
                <h3 className="text-white/60 text-sm uppercase mb-3 tracking-wider font-medium">Размер:</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {['small', 'medium', 'large'].map((size) => (
                    <div 
                      key={size} 
                      className={`p-3 rounded-xl border border-white/10 transition-all cursor-pointer ${
                        selectedSize === size 
                          ? `${colors.accent} border-white/20 shadow-lg ${colors.shadow}` 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setSelectedSize(size as 'small' | 'medium' | 'large');
                      }}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${selectedSize === size ? 'bg-white' : 'bg-white/20'}`}></div>
                        <span className="text-sm">{sizeLabels[size as keyof typeof sizeLabels]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Модификаторы */}
            {getProductModifiers() && (
              <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: '200ms' }}>
                <h3 className="text-white/60 text-sm uppercase mb-3 tracking-wider font-medium">Дополнительно:</h3>
                
                {/* Различные настройки продукта */}
                <div className="grid grid-cols-2 gap-3">
                  {getProductModifiers().syrupOptions.map((modifier: string) => (
                    <div 
                      key={modifier} 
                      className={`p-3 rounded-xl border border-white/10 transition-colors cursor-pointer ${
                        selectedSyrup.includes(modifier) 
                          ? `${colors.accent} border-white/20 shadow-lg ${colors.shadow}` 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        triggerHapticFeedback('light');
                        handleSyrupToggle(modifier);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{modifier}</span>
                        <span className="text-xs text-white/60">+{getModifierPrice(modifier)} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Опции для еды */}
            {product.category === 'food' && (
              <div className={`mb-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: '300ms' }}>
                <h3 className="text-white/60 text-sm uppercase mb-3 tracking-wider font-medium">Опции приготовления:</h3>
                
                <div className="space-y-3">
                  {['Разогреть', 'Добавить приборы', 'Нарезать пополам'].map(option => (
                    <div 
                      key={option} 
                      className={`p-3 rounded-xl border border-white/10 transition-colors cursor-pointer flex items-center justify-between ${
                        selectedFoodOptions.includes(option) 
                          ? `${colors.accent} border-white/20` 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        triggerHapticFeedback('light');
                        handleFoodOptionToggle(option);
                      }}
                    >
                      <span>{option}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${selectedFoodOptions.includes(option) ? 'text-white' : 'text-white/40'}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {selectedFoodOptions.includes(option) ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        )}
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Выбор количества */}
            <div className={`mb-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '400ms' }}>
              <h3 className="text-white/60 text-sm uppercase mb-3 tracking-wider font-medium">Количество:</h3>
              
              <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 border border-white/10">
                <button 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    quantity <= 1 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/10 active:bg-white/15'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                <span className="text-xl font-medium">{quantity}</span>
                
                <button 
                  onClick={increaseQuantity}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 active:bg-white/15"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Фиксированная кнопка добавления в корзину */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/95 backdrop-blur-md px-6 py-5 border-t border-white/10 transition-all duration-700 ease-out ${
          isButtonVisible ? 'translate-y-0 opacity-100' : 'translate-y-[100%] opacity-0'
        }`}
        style={{ paddingBottom: `${safeAreaInsets.bottom + 10}px` }}
      >
        <button 
          onClick={addToCart}
          disabled={isAddingToCart}
          className={`w-full py-4 bg-[#A67C52] hover:bg-[#B98D6F] text-white rounded-xl font-bold text-lg shadow-md shadow-[#A67C52]/20 flex items-center justify-center transition-all relative overflow-hidden group ${
            isAddingToCart ? 'opacity-80' : ''
          }`}
        >
          {/* Новый, более стильный эффект на кнопке */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 transform -skew-y-6"></div>
          </div>
          
          {isAddingToCart ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span className="z-10 flex items-center">
                <span>Добавить в корзину</span>
                <svg className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,7V11H5.83L9.41,7.41L8,6L2,12L8,18L9.41,16.58L5.83,13H21V7H19Z" transform="rotate(180 12 12)"/>
                </svg>
              </span>
            </>
          )}
        </button>
        
        {/* Анимированные чашечки внизу */}
        <AnimatedCoffeeCounter 
          quantity={quantity} 
          selectedSize={selectedSize} 
          accentColor={colors.button.split(' ')[0].replace('from-', '')}
        />
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
        
        /* Добавляем новые стили для анимаций */
        .translate-y-0 {
          transform: translateY(0);
        }
        
        .translate-y-50 {
          transform: translateY(50%);
        }
        
        .translate-y-100 {
          transform: translateY(100%);
        }
        
        .scale-110 {
          transform: scale(1.1);
        }
        
        .scale-100 {
          transform: scale(1);
        }
      `}</style>
    </div>
  );
};

export default ProductScreen; 