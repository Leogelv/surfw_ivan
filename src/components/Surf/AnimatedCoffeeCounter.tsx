import { useEffect, useRef, useState } from 'react';
import { 
  Drop, 
  Coffee, 
  Leaf, 
  Snowflake, 
  PlusCircle,
  Asterisk
} from "@phosphor-icons/react";
import { 
  GiCoconuts, 
  GiMilkCarton, 
  GiHoneycomb, 
  GiVanillaFlower, 
  GiChocolateBar 
} from 'react-icons/gi';

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

interface AnimatedCoffeeCounterProps {
  quantity: number;
  selectedSize: 'small' | 'medium' | 'large';
  accentColor: string;
  modifiers?: {
    milk?: string;
    syrups?: string[];
    extraShot?: boolean;
  };
  productCategory?: string;
}

// Функция получения иконки модификатора на основе его типа
const getModifierIcon = (modifierType: string, size: number, color: string) => {
  const iconProps = { size, color, weight: "duotone" as const };
  const reactIconProps = { size, color, style: { opacity: 0.9 } };

  switch(modifierType.toLowerCase()) {
    case 'растительное':
    case 'овсяное':
      return <Leaf {...iconProps} />;
    case 'миндальное':
      return <Asterisk {...iconProps} />;
    case 'кокосовое':
      return <GiCoconuts {...reactIconProps} />;
    case 'обычное':
    case 'без молока':
      return <GiMilkCarton {...reactIconProps} />;
    case 'карамель':
      return <GiHoneycomb {...reactIconProps} />;
    case 'ваниль':
      return <GiVanillaFlower {...reactIconProps} />;
    case 'лесной орех':
      return <Drop {...iconProps} />;
    case 'кокос':
      return <GiCoconuts {...reactIconProps} />;
    case 'шоколад':
      return <GiChocolateBar {...reactIconProps} />;
    case 'extra shot':
      return <PlusCircle {...iconProps} />;
    default:
      return <Coffee {...iconProps} />;
  }
};

const AnimatedCoffeeCounter: React.FC<AnimatedCoffeeCounterProps> = ({ 
  quantity, 
  selectedSize,
  accentColor = "#A67C52", // Значение по умолчанию
  modifiers = {},
  productCategory = 'coffee'
}) => {
  const prevQuantityRef = useRef<number>(quantity);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0); // Для принудительного триггера анимаций

  // Обновляем prevQuantityRef.current после рендера и анимации
  useEffect(() => {
    // Триггерим анимацию при изменении количества
    if (quantity !== prevQuantityRef.current) {
      setAnimationTrigger(prev => prev + 1);
      
      // Добавляем haptic feedback при изменении количества
      if (quantity > prevQuantityRef.current) {
        // Более легкая вибрация при добавлении
        triggerHapticFeedback('light');
      } else if (quantity < prevQuantityRef.current) {
        // Более сильная при удалении
        triggerHapticFeedback('medium');
      }
      
      // Создаем эффект "дрожания" контейнера при изменении количества
      if (containerRef.current) {
        containerRef.current.classList.add('container-pulse');
        
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.classList.remove('container-pulse');
          }
        }, 600);
      }
      
      // Запаздывающее обновление prevQuantity
      const timeoutId = setTimeout(() => {
        prevQuantityRef.current = quantity;
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [quantity]);
  
  // Получаем размер чашки в зависимости от выбранного размера
  // Совершенно четкие 3 состояния с заметной разницей
  const getSizeMultiplier = () => {
    return {
      'small': 0.7,
      'medium': 1.2,
      'large': 1.8
    }[selectedSize];
  };
  
  // Базовый размер для чашки
  const getBaseSize = () => {
    const multiplier = getSizeMultiplier();
    return 28 * multiplier; // Немного уменьшаем базовый размер для лучших пропорций
  };
  
  // Получаем отступ между иконками в зависимости от размера
  const getSpacing = () => {
    return {
      'small': 'space-x-2', // Меньше отступы для маленьких чашек
      'medium': 'space-x-2.5', // Средние отступы
      'large': 'space-x-2' // Меньше отступы для больших чашек для компактности
    }[selectedSize];
  };
  
  // Получаем высоту контейнера в зависимости от размера и количества
  const getContainerHeight = () => {
    const baseHeight = {
      'small': 45,
      'medium': 55,
      'large': 70
    }[selectedSize];
    
    // Увеличиваем высоту при большом количестве
    const extraHeight = quantity > 3 ? Math.min(10, (quantity - 3) * 2) : 0;
    
    // Добавляем дополнительную высоту для модификаторов
    const hasModifiers = (modifiers.milk && modifiers.milk !== 'Обычное') || 
                         (modifiers.syrups && modifiers.syrups.length > 0) || 
                         modifiers.extraShot;
    const modifiersHeight = hasModifiers ? 35 : 0; // Высота для иконок модификаторов
    
    return baseHeight + extraHeight + modifiersHeight;
  };

  // Определяем новый размер для всех чашек - обновляется при изменении selectedSize
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.add('size-transition');
      
      // Добавляем haptic feedback при изменении размера
      triggerHapticFeedback('light');
      
      return () => {
        if (containerRef.current) {
          containerRef.current.classList.remove('size-transition');
        }
      };
    }
  }, [selectedSize]);
  
  // Должны ли мы показывать модификаторы для данной категории продуктов
  const shouldShowModifiers = ['coffee', 'drinks'].includes(productCategory.toLowerCase());
  
  // Подготавливаем массив модификаторов для отображения
  const getModifiersToShow = () => {
    if (!shouldShowModifiers) return [];
    
    const modifiersArray = [];
    
    // Добавляем молоко, если оно не обычное
    if (modifiers.milk && modifiers.milk !== 'Обычное' && modifiers.milk !== 'Без молока') {
      modifiersArray.push({
        type: modifiers.milk,
        name: modifiers.milk
      });
    }
    
    // Добавляем сиропы
    if (modifiers.syrups && modifiers.syrups.length > 0) {
      modifiers.syrups.forEach(syrup => {
        modifiersArray.push({
          type: syrup,
          name: syrup
        });
      });
    }
    
    // Добавляем доп. эспрессо
    if (modifiers.extraShot) {
      modifiersArray.push({
        type: 'extra shot',
        name: 'Доп. эспрессо'
      });
    }
    
    return modifiersArray;
  };
  
  const modifiersToShow = getModifiersToShow();
  
  return (
    <div className="flex flex-col justify-center mt-2 relative overflow-visible" style={{ height: `${getContainerHeight()}px` }}>
      {/* Эффект фона при добавлении чашки */}
      {quantity > prevQuantityRef.current && (
        <div 
          key={`flash-${animationTrigger}`}
          className="absolute inset-0 cup-flash-effect"
          style={{
            background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          }}
        />
      )}
      
      <div 
        ref={containerRef}
        className={`flex ${getSpacing()} coffee-wave-container items-end`}
        style={{
          padding: `${Math.max(6, Math.min(12, quantity * 1.2))}px 0`,
          // Ширина контейнера в зависимости от размера
          maxWidth: selectedSize === 'large' ? '85%' : selectedSize === 'medium' ? '90%' : '95%',
          height: modifiersToShow.length > 0 ? 'calc(100% - 35px)' : '100%'
        }}
      >
        {/* Показываем максимум 5 чашек */}
        {Array.from({ length: Math.min(quantity, 5) }).map((_, index) => {
          // Определяем режимы анимации
          const isAdding = quantity > prevQuantityRef.current;
          const isRemoving = quantity < prevQuantityRef.current;
          
          // Определяем, является ли чашка новой
          const isNewCup = index >= prevQuantityRef.current && isAdding;
          
          // Определяем, является ли эта чашка последней (самой правой) в наборе
          const isLastCup = index === Math.min(quantity, 5) - 1;
          
          // Базовый размер чашки
          const baseSize = getBaseSize();
          
          // Задержки анимации, зависящие от расположения (чем правее, тем позже анимация)
          const delayFactor = index * 0.05;
          
          // Цвет для чашек: первые три обычные, последние две с бликами
          const cupColor = index < 3 ? 'text-[#C09371]' : 'text-[#D8AD8F]';
          
          // Стартовое смещение для эффекта "волны"
          const offsetY = Math.sin(index * 0.8) * 3;
          
          // Анимация "взбалтывания" для чашки
          const shouldShake = isNewCup || (isLastCup && isAdding);
          
          // Различные классы анимаций для чашек
          const pulseAnimClass = `coffee-icon-${index % 3}`; // Базовая пульсация
          const appearClass = isNewCup ? 'coffee-bounce-in' : ''; // Появление
          const shakeClass = shouldShake ? 'coffee-shake' : ''; // Встряхивание для новой чашки
          
          return (
            <div 
              key={`cup-${index}-${quantity}-${animationTrigger}`}
              className={`relative coffee-icon ${pulseAnimClass} ${shakeClass}`}
              style={{ 
                height: `${baseSize}px`, 
                width: `${baseSize}px`,
                transform: `translateY(${offsetY}px)`,
                transition: `all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${delayFactor}s`,
                filter: isLastCup && isAdding ? 'drop-shadow(0 0 3px rgba(255,233,191,0.6))' : '',
                zIndex: isLastCup ? 5 : 'auto'
              }}
            >
              {/* Эффект "вспышки" вокруг новой чашки */}
              {isNewCup && (
                <div className="absolute inset-0 cup-glow-ring" style={{
                  boxShadow: `0 0 15px 5px ${accentColor}60`,
                  borderRadius: '50%'
                }}></div>
              )}
              
              {/* Сама иконка чашки */}
              <svg
                viewBox="0 0 24 24"
                className={`w-full h-full ${cupColor} ${appearClass}`}
                fill="currentColor"
                style={{ filter: isNewCup ? 'saturate(1.5)' : '' }}
              >
                <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
              </svg>
              
              {/* Блик на чашке */}
              {(isNewCup || isLastCup) && (
                <div className="absolute top-1/4 left-1/4 w-1/3 h-1/6 shine-effect" 
                     style={{ transform: 'rotate(-20deg)' }}></div>
              )}
              
              {/* Эффект "всплеска" при появлении новой чашки */}
              {isNewCup && (
                <div className="absolute top-0 left-0 right-0 bottom-0 splash-effect"></div>
              )}
            </div>
          );
        })}
        
        {/* Добавляем "призрачную" чашку, которая анимируется при удалении */}
        {quantity < prevQuantityRef.current && prevQuantityRef.current <= 5 && (
          <div 
            key={`removing-cup-${prevQuantityRef.current}-${animationTrigger}`}
            className="absolute coffee-icon coffee-fall-out"
            style={{ 
              right: '0',
              transform: 'translateX(30%)',
              height: `${getBaseSize()}px`, 
              width: `${getBaseSize()}px`,
              zIndex: -1
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-[#C09371]"
              fill="currentColor"
            >
              <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z" />
            </svg>
          </div>
        )}
        
        {/* Показываем "+N" справа если чашек больше 5 */}
        {quantity > 5 && (
          <div 
            key={`plus-${quantity}-${animationTrigger}`}
            className={`flex items-center justify-center ml-1 coffee-icon-plus ${
              quantity > 5 && prevQuantityRef.current <= 5 ? 'counter-fade-in' : ''
            }`}
            style={{
              // Корректируем размер счетчика в зависимости от размера
              height: `${getBaseSize() * 0.8}px`, 
              paddingLeft: '4px',
              paddingRight: '4px',
              fontWeight: 'bold',
              backgroundColor: `${accentColor}80`,
              borderRadius: '8px'
            }}
          >
            <span>+{quantity - 5}</span>
          </div>
        )}
      </div>
      
      {/* Ряд модификаторов */}
      {shouldShowModifiers && modifiersToShow.length > 0 && (
        <div className="flex justify-center mt-3 modifier-container">
          <div className="flex space-x-3 items-center">
            {modifiersToShow.map((modifier, index) => (
              <div 
                key={`modifier-${modifier.type}-${index}`}
                className="modifier-icon fade-in-up"
                style={{ 
                  animationDelay: `${0.1 + index * 0.1}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {/* Иконка модификатора */}
                <div 
                  className="relative p-1.5 rounded-full bg-white/10 modifier-pulse backdrop-blur-sm"
                  style={{ backdropFilter: 'blur(4px)' }}
                >
                  {getModifierIcon(modifier.type, selectedSize === 'small' ? 16 : 20, accentColor)}
                  
                  {/* Эффект свечения */}
                  <div 
                    className="absolute inset-0 rounded-full modifier-glow" 
                    style={{
                      boxShadow: `0 0 8px 2px ${accentColor}40`,
                      opacity: 0.7
                    }}
                  ></div>
                  
                  {/* Декоративное кольцо */}
                  <div className="absolute inset-0 rounded-full border border-white/20 shadow-inner"></div>
                </div>
                
                {/* Название модификатора с эффектом всплывания */}
                <span className="text-xs text-white/70 mt-1 max-w-16 truncate modifier-label-fade">
                  {modifier.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Стили для анимаций и эффектов */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes modifierPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes modifierGlow {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.5;
          }
        }
        
        @keyframes labelFadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .modifier-label-fade {
          animation: labelFadeIn 0.4s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        .modifier-pulse {
          animation: modifierPulse 3s ease-in-out infinite;
        }
        
        .modifier-glow {
          animation: modifierGlow 3s ease-in-out infinite;
        }
        
        .cup-flash-effect {
          animation: flashAnimation 0.8s ease-out;
        }
        
        .container-pulse {
          animation: containerPulse 0.6s ease-out;
        }
        
        .size-transition {
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .coffee-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .coffee-shake {
          animation: shakeAnimation 0.8s ease-in-out;
        }
        
        .coffee-fall-out {
          animation: fallOut 0.5s ease-in-out forwards;
        }
        
        .counter-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .shine-effect {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
          animation: shineEffect 2s ease-in-out infinite;
        }
        
        .splash-effect {
          animation: splashEffect 0.7s ease-out forwards;
        }
        
        /* Анимация пульсации для первой иконки */
        .coffee-icon-0 {
          animation: pulse1 4s ease-in-out infinite;
        }
        
        /* Анимация пульсации для второй иконки */
        .coffee-icon-1 {
          animation: pulse2 4s ease-in-out infinite;
        }
        
        /* Анимация пульсации для третьей иконки */
        .coffee-icon-2 {
          animation: pulse3 4s ease-in-out infinite;
        }
        
        @keyframes flashAnimation {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes containerPulse {
          0% { transform: scale(1); }
          30% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        @keyframes bounceIn {
          0% { 
            opacity: 0;
            transform: scale(0.3); 
          }
          50% { 
            opacity: 1;
            transform: scale(1.1); 
          }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        @keyframes shakeAnimation {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes fallOut {
          0% { 
            opacity: 1;
            transform: translateX(30%) translateY(0); 
          }
          100% { 
            opacity: 0;
            transform: translateX(100%) translateY(20px); 
          }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes shineEffect {
          0% { opacity: 0; transform: translateX(-100%) rotate(-20deg); }
          20% { opacity: 0.6; }
          40% { opacity: 0; transform: translateX(100%) rotate(-20deg); }
          100% { opacity: 0; transform: translateX(100%) rotate(-20deg); }
        }
        
        @keyframes splashEffect {
          0% {
            box-shadow: 0 0 0 0px rgba(255, 255, 255, 0.7),
                       0 0 0 0px rgba(255, 255, 255, 0.5),
                       0 0 0 0px rgba(255, 255, 255, 0.3);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0),
                       0 0 0 20px rgba(255, 255, 255, 0),
                       0 0 0 30px rgba(255, 255, 255, 0);
          }
        }
        
        @keyframes pulse1 {
          0% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes pulse2 {
          0% { transform: translateY(1px); }
          25% { transform: translateY(-1px); }
          50% { transform: translateY(3px); }
          75% { transform: translateY(0); }
          100% { transform: translateY(1px); }
        }
        
        @keyframes pulse3 {
          0% { transform: translateY(2px); }
          25% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          75% { transform: translateY(1px); }
          100% { transform: translateY(2px); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCoffeeCounter; 