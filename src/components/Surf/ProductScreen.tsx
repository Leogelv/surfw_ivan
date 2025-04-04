import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

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
  const [quantity, setQuantity] = useState(1);
  const [activeOrders, setActiveOrders] = useState(2); // Имитация активных заказов
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [selectedMilk, setSelectedMilk] = useState<string>('Обычное');
  const [selectedSyrup, setSelectedSyrup] = useState<string[]>([]);
  const [extraShot, setExtraShot] = useState(false);
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
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
      setQuantity(prev => prev + 1);
      triggerHapticFeedback('light');
    }
  };

  // Уменьшить количество
  const decreaseQuantity = () => {
    if (quantity > 1) {
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
        onAddToCart(productName, quantity);
      } else {
        // Иначе просто перейти в корзину
        setTimeout(() => {
          onCartClick();
        }, 300);
      }
    }, 800);
  };

  const colors = getProductColors();

  // Расчет высоты фото в зависимости от прокрутки
  const getImageHeight = () => {
    if (isImageExpanded) return '100vw'; // Квадратное фото при развернутом состоянии
    
    // Определяем базовую высоту и максимальную прокрутку для эффекта
    const baseHeight = 'calc(100vw * 0.8)'; // 80% ширины экрана = квадрат с учетом отступов
    const minHeight = 'calc(100vw * 0.5)'; // 50% ширины экрана при максимальном скролле
    
    // Если скролл имеет отрицательное значение (тянут вниз), расширяем фото
    if (scrollPosition < -50) {
      return '100vw'; // Полностью квадратное изображение при свайпе вниз
    }
    
    return baseHeight; // Базовая высота в квадратной пропорции
  };

  // Обработчики для свайпа изображения
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current) {
      startTouchY.current = e.touches[0].clientY;
      startScrollTop.current = contentRef.current.scrollTop;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (contentRef.current && startTouchY.current !== null) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startTouchY.current;
      
      // Если мы в начале списка и тянем вниз - разворачиваем изображение
      if (contentRef.current.scrollTop <= 0 && diff > 50 && !isImageExpanded) {
        setIsImageExpanded(true);
        triggerHapticFeedback('light');
        e.preventDefault(); // Предотвращаем стандартный скролл
      }
      
      // Если изображение развернуто и тянем вверх - сворачиваем его
      if (isImageExpanded && diff < -50) {
        setIsImageExpanded(false);
        triggerHapticFeedback('light');
      }
    }
  };

  const handleTouchEnd = () => {
    startTouchY.current = null;
  };

  // Refs для свайпов
  const startTouchY = useRef<number | null>(null);
  const startScrollTop = useRef<number>(0);

  // Получение состава продукта
  const getProductIngredients = () => {
    const category = product.category || 'coffee';
    
    // Разные составы в зависимости от категории и типа продукта
    if (category === 'food') {
      if (product.name.toLowerCase().includes('круассан')) {
        return 'мука, сливочное масло, сахар, соль, дрожжи, яйца';
      } else if (product.name.toLowerCase().includes('сэндвич')) {
        return 'хлеб, куриное филе, томаты, салат, соус, специи';
      } else if (product.name.toLowerCase().includes('авокадо')) {
        return 'хлеб, авокадо, помидоры черри, микрозелень, оливковое масло, соль, перец';
      }
      return 'мука, сахар, яйца, растительные и животные жиры, разрыхлитель';
    } else if (category === 'coffee') {
      return 'кофе арабика, вода' + (product.name.toLowerCase().includes('капучино') || product.name.toLowerCase().includes('латте') ? ', молоко' : '');
    } else if (category === 'tea') {
      if (product.name.toLowerCase().includes('зеленый')) {
        return 'листья зеленого чая, природные ароматизаторы';
      } else if (product.name.toLowerCase().includes('черный')) {
        return 'листья черного чая';
      } else if (product.name.toLowerCase().includes('травяной')) {
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
             backgroundSize: "40px 40px"
           }}></div>
           
      {/* Декоративные иконки серф-тематики */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[5%] opacity-5 animate-pulse text-white">
          <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,9L21,15L12,21L3,15L3,9L12,3L21,9M5,10.5V13.5L12,18L19,13.5V10.5L12,6L5,10.5Z"/>
          </svg>
        </div>
        <div className="absolute top-[60%] right-[8%] opacity-5 animate-pulse" style={{animationDelay: '1.5s'}}>
          <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22,16A5,5 0 0,1 17,21H7A5,5 0 0,1 2,16V8A5,5 0 0,1 7,3H17A5,5 0 0,1 22,8V16M9.5,9A1.5,1.5 0 0,0 8,10.5A1.5,1.5 0 0,0 9.5,12A1.5,1.5 0 0,0 11,10.5A1.5,1.5 0 0,0 9.5,9M14.5,9A1.5,1.5 0 0,0 13,10.5A1.5,1.5 0 0,0 14.5,12A1.5,1.5 0 0,0 16,10.5A1.5,1.5 0 0,0 14.5,9M9.5,13.5A1.5,1.5 0 0,0 8,15A1.5,1.5 0 0,0 9.5,16.5A1.5,1.5 0 0,0 11,15A1.5,1.5 0 0,0 9.5,13.5M14.5,13.5A1.5,1.5 0 0,0 13,15A1.5,1.5 0 0,0 14.5,16.5A1.5,1.5 0 0,0 16,15A1.5,1.5 0 0,0 14.5,13.5Z"/>
          </svg>
        </div>
        <div className="absolute bottom-[20%] left-[15%] opacity-5 animate-pulse" style={{animationDelay: '2.5s'}}>
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M13.41,13L20.29,19.88L18.88,21.29L12,14.41L5.12,21.29L3.71,19.88L13.36,10.22L13.16,10C12.38,9.23 12.38,7.97 13.16,7.19L17.5,2.82L18.43,3.74L15.19,7L16.15,7.94L19.39,4.69L20.31,5.61L17.06,8.85L18,9.81L21.26,6.56L22.18,7.5L17.81,11.84C17.03,12.62 15.77,12.62 15,11.84L14.78,11.64L13.41,13Z"/>
          </svg>
        </div>
      </div>
      
      {/* Серф-волны фоновые */}
      <div className="absolute top-40 left-0 right-0 z-0 opacity-30 pointer-events-none">
        <div className="relative w-full overflow-hidden h-32">
          <svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-24 text-[#A67C52] animate-wave">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".1" fill="currentColor"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".25" fill="currentColor"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" opacity=".3" fill="currentColor"></path>
          </svg>
        </div>
      </div>
      
      {/* Изображение продукта с эффектом затемнения и зума при загрузке */}
      <div className="absolute top-0 left-0 right-0 z-10 transition-all duration-500 ease-in-out"
           style={{ height: getImageHeight() }}>
        <div 
          className={`absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        
        {/* Кнопка закрытия над фоткой - делаем меньше и с отступом 100px сверху */}
        <div className="absolute top-[100px] right-3 z-50">
          <button 
            onClick={() => {
              triggerHapticFeedback('medium');
              onBackClick();
            }}
            className="bg-black/70 backdrop-blur-md p-1.5 rounded-full border border-white/20 hover:bg-black/90 transition-all active:scale-95 shadow-lg shadow-black/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

          {/* Эффект брызг волны */}
          <div className="absolute bottom-0 left-0 right-0 h-20 z-10 overflow-hidden opacity-40">
            <svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-40 text-white">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".5" fill="currentColor"></path>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Контент продукта - начинается ниже за счет уменьшения текстовой плашки */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto pb-32 relative z-20"
        style={{ 
          paddingTop: getImageHeight(),
          transition: 'padding-top 0.5s ease-in-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Информация о продукте с эффектом наезжающей шапки */}
        <div className="flex-1 bg-gradient-to-b from-[#2A2118] to-[#1D1816] px-6 py-5 -mt-10 rounded-t-3xl flex flex-col relative z-10 border-t border-white/10">          
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
              <div className={`bg-gradient-to-r ${colors.gradient} px-3 py-1 rounded-full text-white font-medium shadow-lg ${colors.shadow}`}>
                <p className="text-xl font-medium">{getPrice()} ₽</p>
              </div>
            </div>
            
            {/* Дополнительная плашка с доп. ценой */}
            {getExtraModifiersPrice() > 0 && (
              <div className="flex justify-between items-center my-4 p-2 bg-[#A67C52]/20 rounded-lg border border-[#A67C52]/30">
                <span className="text-sm">Модификаторы</span>
                <span className="text-sm font-medium">+{getExtraModifiersPrice()} ₽</span>
              </div>
            )}
            
            {/* Описание продукта с иконками */}
            <div className="text-white/70 mt-3 mb-3">
              <div className="flex items-start space-x-2">
                <div className="text-[#A67C52]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                  </svg>
                </div>
                <p>{product.description}</p>
              </div>
              
              {/* Показываем калории */}
              {product.calories !== undefined && (
                <div className="flex items-center mt-2 text-sm">
                  <span className="mr-1 flex items-center text-[#B98D6F]">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11V21Z" />
                      <path d="M13 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H13V21Z" fillOpacity="0.3" />
                    </svg>
                    Калории:
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 rounded-full">{product.calories} кал</span>
                </div>
              )}
            </div>
            
            {/* Состав и аллергены в блоке под названием и описанием */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
              {/* Волнистый декоративный элемент */}
              <div className="absolute top-0 right-0 opacity-10 text-[#A67C52]">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,30 C10,50 30,0 40,30 C50,60 70,0 80,30 C90,60 100,0 100,30" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <path d="M0,60 C10,90 30,30 40,60 C50,90 70,30 80,60 C90,90 100,30 100,60" stroke="currentColor" fill="none" strokeWidth="2"/>
                </svg>
              </div>
              
              {/* Состав */}
              {getProductIngredients() && (
                <div className="text-sm text-white/60 mb-2 flex items-start">
                  <span className="font-medium mr-2 text-[#A67C52] whitespace-nowrap">Состав:</span>
                  <span>{getProductIngredients()}.</span>
                </div>
              )}
              
              {/* Аллергены */}
              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-1 text-[#A67C52]">Аллергены:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map(allergen => (
                      <span key={allergen} className="text-xs px-2 py-1 bg-white/10 rounded-full flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A67C52] mr-1"></span>
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Выбор размера - с чип-листом как был */}
            <div className="mb-5">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                Размер
                <div className="ml-2 w-1.5 h-1.5 rounded-full bg-[#A67C52] animate-pulse"></div>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => {
                  // Определяем иконку в зависимости от категории продукта
                  const isCoffee = product.category === 'coffee';
                  const isTea = product.category === 'tea';
                  
                  // Класс для размера иконки
                  const iconSizeClass = size === 'small' ? 'h-4 w-4' : 
                                     size === 'medium' ? 'h-5 w-5' : 'h-6 w-6';
                  
                  return (
                    <button 
                      key={size} 
                      onClick={() => {
                        setSelectedSize(size);
                        triggerHapticFeedback();
                      }}
                      className={`py-3 rounded-xl transition-all flex flex-col items-center justify-center relative overflow-hidden group ${
                        selectedSize === size 
                          ? 'bg-gradient-to-r from-[#A67C52] to-[#5D4037] text-white' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Декоративная волна для серф-эстетики */}
                      <div className={`absolute inset-x-0 bottom-0 h-1 opacity-50 ${selectedSize === size ? 'bg-white' : 'bg-[#A67C52]'}`}>
                        <svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-full animate-wave fill-current ${selectedSize === size ? 'text-white' : 'text-[#A67C52]'}`}>
                          <path d="M0,10 C30,20 30,0 60,10 C90,20 90,0 120,10 V30 H0 Z"/>
                        </svg>
                      </div>
                      
                      {/* Иконка в зависимости от категории продукта */}
                      <div className={`mb-1 ${iconSizeClass} transition-transform group-hover:scale-110`}>
                        {isCoffee && (
                          <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                          </svg>
                        )}
                        {isTea && (
                          <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4,19H20V21H4V19M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                          </svg>
                        )}
                        {!isCoffee && !isTea && (
                          <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M13.41,13L20.29,19.88L18.88,21.29L12,14.41L5.12,21.29L3.71,19.88L13.36,10.22L13.16,10C12.38,9.23 12.38,7.97 13.16,7.19L17.5,2.82L18.43,3.74L15.19,7L16.15,7.94L19.39,4.69L20.31,5.61L17.06,8.85L18,9.81L21.26,6.56L22.18,7.5L17.81,11.84C17.03,12.62 15.77,12.62 15,11.84L14.78,11.64L13.41,13Z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{sizeLabels[size]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Выбор количества - более интерактивный */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                Количество
                <div className="ml-2 w-1.5 h-1.5 rounded-full bg-[#A67C52] animate-pulse"></div>
              </h3>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 bg-white/5 rounded-xl p-1">
                  <button 
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                      quantity <= 1 ? 'text-white/30' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="flex-1 text-center font-medium text-lg">{quantity}</span>
                  <button 
                    onClick={increaseQuantity}
                    disabled={quantity >= 10}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                      quantity >= 10 ? 'text-white/30' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                
                {/* Визуализация количества через иконки */}
                <div className="flex items-center justify-center overflow-hidden">
                  <div className="flex space-x-1 py-2 px-4 bg-[#232019]/60 backdrop-blur-sm rounded-full overflow-x-auto hide-scrollbar">
                    {Array.from({ length: Math.min(quantity, 10) }).map((_, index) => {
                      const isCoffee = product.category === 'coffee';
                      const isTea = product.category === 'tea';
                      const iconSize = selectedSize === 'small' ? 'h-4 w-4' :
                                     selectedSize === 'medium' ? 'h-5 w-5' : 'h-6 w-6';
                      
                      return (
                        <div 
                          key={index} 
                          className={`${iconSize} text-[#A67C52] ${index === 0 ? '' : '-ml-1'} transform ${
                            index % 2 === 0 ? 'rotate-3' : '-rotate-3'
                          }`}
                          style={{ 
                            animationDelay: `${index * 0.1}s`,
                            transform: `rotate(${index % 2 === 0 ? '3deg' : '-3deg'}) translateY(${Math.sin(index) * 2}px)`
                          }}
                        >
                          {isCoffee && (
                            <svg className="w-full h-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                            </svg>
                          )}
                          {isTea && (
                            <svg className="w-full h-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4,19H20V21H4V19M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                            </svg>
                          )}
                          {!isCoffee && !isTea && (
                            <svg className="w-full h-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M13.41,13L20.29,19.88L18.88,21.29L12,14.41L5.12,21.29L3.71,19.88L13.36,10.22L13.16,10C12.38,9.23 12.38,7.97 13.16,7.19L17.5,2.82L18.43,3.74L15.19,7L16.15,7.94L19.39,4.69L20.31,5.61L17.06,8.85L18,9.81L21.26,6.56L22.18,7.5L17.81,11.84C17.03,12.62 15.77,12.62 15,11.84L14.78,11.64L13.41,13Z" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                    {quantity > 10 && (
                      <div className="text-xs text-[#A67C52] opacity-80 px-1">+{quantity - 10}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Модификаторы для напитков и еды */}
            {isLoaded && (
              <div className="mb-6">
                {/* Модификаторы для кофе */}
                {product.category === 'coffee' && (
                  <>
                    {/* Выбор молока */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Молоко</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {getProductModifiers().milkOptions.map((milk) => (
                          <button
                            key={milk}
                            onClick={() => {
                              setSelectedMilk(milk);
                              triggerHapticFeedback();
                            }}
                            className={`py-2 px-3 rounded-lg text-sm flex items-center justify-between transition-all ${
                              selectedMilk === milk 
                                ? 'bg-[#A67C52] text-white' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span>{milk}</span>
                            {selectedMilk === milk && (
                              <div className="flex items-center">
                                {getModifierPrice(milk) > 0 && (
                                  <span className="text-xs bg-white/20 px-1.5 rounded mr-1.5">+{getModifierPrice(milk)}₽</span>
                                )}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Выбор сиропов */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Сиропы</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {getProductModifiers().syrupOptions.map((syrup) => (
                          <button
                            key={syrup}
                            onClick={() => {
                              handleSyrupToggle(syrup);
                              triggerHapticFeedback();
                            }}
                            className={`py-2 px-3 rounded-lg text-sm flex items-center justify-between transition-all ${
                              selectedSyrup.includes(syrup) 
                                ? 'bg-[#A67C52] text-white' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span>{syrup}</span>
                            {selectedSyrup.includes(syrup) && (
                              <div className="flex items-center">
                                <span className="text-xs bg-white/20 px-1.5 rounded mr-1.5">+50₽</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Дополнительный эспрессо */}
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setExtraShot(!extraShot);
                          triggerHapticFeedback();
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-sm flex items-center justify-between transition-all ${
                          extraShot 
                            ? 'bg-[#A67C52] text-white' 
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span>Дополнительный эспрессо</span>
                        {extraShot && (
                          <div className="flex items-center">
                            <span className="text-xs bg-white/20 px-1.5 rounded mr-1.5">+70₽</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Модификаторы для еды */}
                {product.category === 'food' && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Дополнительно</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {getProductModifiers().foodOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            handleFoodOptionToggle(option);
                            triggerHapticFeedback();
                          }}
                          className={`py-2 px-3 rounded-lg text-sm flex items-center justify-between transition-all ${
                            selectedFoodOptions.includes(option) 
                              ? 'bg-[#A67C52] text-white' 
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span>{option}</span>
                          {selectedFoodOptions.includes(option) && (
                            <div className="flex items-center">
                              {getModifierPrice(option) > 0 && (
                                <span className="text-xs bg-white/20 px-1.5 rounded mr-1.5">+{getModifierPrice(option)}₽</span>
                              )}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Декоративный разделитель */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
          </div>
        </div>
      </div>
      
      {/* Фиксированная кнопка добавления в корзину */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/95 backdrop-blur-md px-6 py-5 border-t border-white/10">
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
                <span className="mr-2">Добавить в корзину за {getPrice()} ₽</span>
                <svg className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,7V11H5.83L9.41,7.41L8,6L2,12L8,18L9.41,16.58L5.83,13H21V7H19Z" transform="rotate(180 12 12)"/>
                </svg>
              </span>
            </>
          )}
        </button>
        
        {/* Иконки размера/количества под кнопкой с proper анимацией */}
        <div className="mt-3 flex justify-center">
          {product.category === 'coffee' || product.category === 'tea' ? (
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-white/60 mb-1">Размер</div>
                <div className="flex justify-center">
                  {/* Иконка чашки с анимацией размера */}
                  <div 
                    className="transition-all duration-800 ease-in-out transform animate-overshoot"
                    style={{ 
                      height: selectedSize === 'small' ? '35px' : selectedSize === 'medium' ? '55px' : '80px',
                      width: 'auto',
                    }}
                  >
                    <svg className="h-full w-auto" viewBox="0 0 24 24" fill="currentColor" style={{color: '#A67C52'}}>
                      <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-white/60 mb-1">Количество</div>
                <div className="flex justify-center space-x-1">
                  {/* Отображение количества иконок согласно выбранному количеству */}
                  {Array.from({ length: Math.min(quantity, 7) }).map((_, index) => (
                    <svg 
                      key={index} 
                      style={{color: '#A67C52', height: '20px', width: 'auto', opacity: 0.7 + (index * 0.3 / quantity)}}
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
                    </svg>
                  ))}
                  {quantity > 7 && <span className="text-[#A67C52] text-xs ml-1">+{quantity - 7}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">Количество</div>
              <div className="flex justify-center space-x-1">
                {/* Иконки еды согласно количеству */}
                {Array.from({ length: Math.min(quantity, 7) }).map((_, index) => (
                  <svg 
                    key={index} 
                    style={{color: '#A67C52', height: '20px', width: 'auto', opacity: 0.7 + (index * 0.3 / quantity)}}
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M13.41,13L20.29,19.88L18.88,21.29L12,14.41L5.12,21.29L3.71,19.88L13.36,10.22L13.16,10C12.38,9.23 12.38,7.97 13.16,7.19L17.5,2.82L18.43,3.74L15.19,7L16.15,7.94L19.39,4.69L20.31,5.61L17.06,8.85L18,9.81L21.26,6.56L22.18,7.5L17.81,11.84C17.03,12.62 15.77,12.62 15,11.84L14.78,11.64L13.41,13Z" />
                  </svg>
                ))}
                {quantity > 7 && <span className="text-[#A67C52] text-xs ml-1">+{quantity - 7}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Стили для скрытия полосы прокрутки и анимации волны */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes wave {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-wave {
          animation: wave 8s infinite linear;
        }
        @keyframes floating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-floating {
          animation: floating 5s ease-in-out infinite;
        }
        @keyframes overshoot {
          0% {
            transform: scale(1);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes overshoot-delayed {
          0% {
            transform: scale(0.8);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-overshoot {
          animation: overshoot 800ms ease-in-out;
        }
        .animate-overshoot-delayed {
          animation: overshoot-delayed 800ms ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProductScreen; 