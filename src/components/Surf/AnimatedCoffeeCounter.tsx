import { useEffect, useRef, useState } from 'react';

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
}

const AnimatedCoffeeCounter: React.FC<AnimatedCoffeeCounterProps> = ({ 
  quantity, 
  selectedSize,
  accentColor = "#A67C52" // Значение по умолчанию 
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
      'large': 'space-x-2.5' // Увеличил отступы для больших чашек для лучшего визуального баланса
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
    
    return baseHeight + extraHeight;
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
  
  return (
    <div className="flex justify-center mt-3 relative overflow-visible" style={{ height: `${getContainerHeight()}px` }}>
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
        className={`flex ${getSpacing()} coffee-wave-container items-end justify-center`}
        style={{
          padding: `${Math.max(6, Math.min(12, quantity * 1.2))}px 0`,
          // Ширина контейнера в зависимости от размера
          width: '100%',
          maxWidth: selectedSize === 'large' ? '90%' : selectedSize === 'medium' ? '95%' : '100%',
          height: '100%'
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
                  boxShadow: `0 0 10px 3px ${accentColor}40`,
                  borderRadius: '50%',
                  opacity: 0
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
                <div className="absolute inset-0 splash-effect"></div>
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
              fontSize: selectedSize === 'large' ? '17px' : selectedSize === 'medium' ? '14px' : '12px',
              height: selectedSize === 'large' ? '36px' : selectedSize === 'medium' ? '30px' : '24px',
              opacity: 0.95,
            }}
          >
            <span className={`bg-[${accentColor}]/30 text-[#C09371] font-bold rounded-full px-3 py-1 shadow-inner counter-badge ${
              quantity !== prevQuantityRef.current ? 'counter-update' : ''
            }`}>
              +{quantity - 5}
            </span>
          </div>
        )}
        
        {/* Показываем исчезающий индикатор +N при уменьшении количества ниже порога */}
        {quantity <= 5 && prevQuantityRef.current > 5 && (
          <div 
            key={`removing-plus-${prevQuantityRef.current}-${animationTrigger}`}
            className="flex items-center justify-center ml-2 coffee-icon-plus counter-fade-out"
            style={{
              position: 'absolute',
              right: '0',
              fontSize: selectedSize === 'large' ? '17px' : selectedSize === 'medium' ? '14px' : '12px',
              height: selectedSize === 'large' ? '36px' : selectedSize === 'medium' ? '30px' : '24px',
            }}
          >
            <span className={`bg-[${accentColor}]/30 text-[#C09371] font-bold rounded-full px-3 py-1 shadow-inner`}>
              +{prevQuantityRef.current - 5}
            </span>
          </div>
        )}
      </div>
      
      {/* Стили для анимаций */}
      <style jsx global>{`
        /* Контейнер для чашек с волновым движением */
        .coffee-wave-container {
          animation: floatMotion 8s infinite ease-in-out;
          transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          position: relative;
        }
        
        /* Анимация "пульса" для контейнера при изменении количества */
        .container-pulse {
          animation: containerPulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Анимация размера для контейнера */
        .size-transition {
          animation: sizePulse 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Базовые стили для чашек */
        .coffee-icon {
          transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
          position: relative;
          will-change: transform, opacity, filter;
          touch-action: none; /* Предотвращает проблемы с событиями касания на мобильных */
        }
        
        /* Эффект "вспышки" вокруг новой чашки */
        .cup-glow-ring {
          animation: cupGlowRingEffect 2s ease-out forwards;
          pointer-events: none;
        }
        
        /* Эффект "вспышки" на фоне при добавлении */
        .cup-flash-effect {
          animation: flashEffect 0.7s ease-out forwards;
          pointer-events: none; /* Предотвращает помехи с тач-событиями */
        }
        
        /* Эффект блика на чашке */
        .shine-effect {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%);
          border-radius: 50%;
          animation: shineEffect 2s infinite ease-in-out;
          pointer-events: none;
        }
        
        /* Эффект "всплеска" при добавлении */
        .splash-effect {
          border-radius: 50%;
          animation: splashEffect 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          pointer-events: none;
        }
        
        /* Супер-плавная анимация появления с 3D эффектом "отскока" */
        .coffee-bounce-in {
          animation: bounceInEffect 0.8s cubic-bezier(0.18, 1.5, 0.5, 1) forwards;
          transform-origin: center bottom;
          backface-visibility: hidden; /* Оптимизация производительности */
          will-change: transform, opacity; /* Оптимизация для GPU-рендеринга */
        }
        
        /* Эффект "встряхивания" для новой чашки */
        .coffee-shake {
          animation: shakeEffect 0.7s ease-in-out;
          animation-delay: 0.3s;
        }
        
        /* Анимация выпадения/удаления */
        .coffee-fall-out {
          animation: fallOutEffect 0.9s cubic-bezier(0.55, -0.15, 0.55, 0.3) forwards;
          pointer-events: none;
        }
        
        /* Плавное появление счетчика */
        .counter-fade-in {
          animation: fadeInEffect 0.6s ease-out forwards;
        }
        
        /* Плавное исчезновение счетчика */
        .counter-fade-out {
          animation: fadeOutEffect 0.6s ease-in forwards;
          pointer-events: none;
        }
        
        /* Анимация обновления счетчика */
        .counter-update {
          animation: updateCounterEffect 0.4s ease forwards;
        }
        
        /* Фоновая пульсация для чашек (три варианта с разным таймингом) */
        .coffee-icon-0 {
          animation: softPulse1 3.5s infinite ease-in-out;
        }
        
        .coffee-icon-1 {
          animation: softPulse2 4s infinite ease-in-out;
        }
        
        .coffee-icon-2 {
          animation: softPulse3 4.5s infinite ease-in-out; 
        }
        
        /* Счетчик */
        .counter-badge {
          transform-origin: center;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* ===== KEYFRAMES ===== */
        
        /* Фоновая вспышка при добавлении чашки */
        @keyframes flashEffect {
          0% { opacity: 0; }
          20% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        
        /* Пульсация при изменении размера контейнера */
        @keyframes sizePulse {
          0% { transform: scale(0.97); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        /* Обновление счетчика */
        @keyframes updateCounterEffect {
          0% { transform: scale(1); }
          40% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        
        /* Пульсация контейнера при изменении количества */
        @keyframes containerPulse {
          0% { transform: scale(0.97) translateY(0); }
          50% { transform: scale(1.02) translateY(-2px); }
          100% { transform: scale(1) translateY(0); }
        }
        
        /* Эффект блика на чашке */
        @keyframes shineEffect {
          0%, 100% { opacity: 0; transform: translateX(-100%) rotate(-20deg); }
          30%, 70% { opacity: 0.7; transform: translateX(100%) rotate(-20deg); }
        }
        
        /* Ультра плавная 3D анимация появления */
        @keyframes bounceInEffect {
          0% { 
            opacity: 0; 
            transform: scale(0.3) translateY(10px) rotateX(15deg); 
          }
          35% { 
            opacity: 0.7;
            transform: scale(0.8) translateY(-5px) rotateX(-8deg);
          }
          70% { 
            opacity: 1; 
            transform: scale(1.1) translateY(2px) rotateX(5deg); 
          }
          85% {
            transform: scale(0.95) translateY(-1px) rotateX(-3deg);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0) rotateX(0); 
          }
        }
        
        /* Эффект "всплеска" */
        @keyframes splashEffect {
          0% { 
            box-shadow: 0 0 0 0px rgba(198, 156, 109, 0.7); 
          }
          100% { 
            box-shadow: 0 0 0 15px rgba(198, 156, 109, 0); 
          }
        }
        
        /* Анимация встряхивания */
        @keyframes shakeEffect {
          0%, 100% { transform: rotate(0) translateY(0); }
          20% { transform: rotate(-5deg) translateY(-2px); }
          40% { transform: rotate(4deg) translateY(0); }
          60% { transform: rotate(-3deg) translateY(-1px); }
          80% { transform: rotate(2deg) translateY(0); }
        }
        
        /* Улучшенная анимация выпадения */
        @keyframes fallOutEffect {
          0% {
            opacity: 1;
            transform: translateX(30%) translateY(0) rotate(0deg);
          }
          30% {
            opacity: 0.9;
            transform: translateX(35%) translateY(5px) rotate(5deg);
          }
          60% {
            opacity: 0.5;
            transform: translateX(15%) translateY(20px) rotate(10deg);
          }
          100% {
            opacity: 0;
            transform: translateX(0%) translateY(40px) rotate(25deg);
          }
        }
        
        /* Появление с затуханием */
        @keyframes fadeInEffect {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        /* Исчезновение с затуханием */
        @keyframes fadeOutEffect {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        
        /* Фоновые анимации пульсации чашек (три разных паттерна) */
        @keyframes softPulse1 {
          0%, 100% { opacity: 0.95; transform: translateY(0) scale(1); }
          50% { opacity: 0.85; transform: translateY(-2px) scale(1.03); }
        }
        
        @keyframes softPulse2 {
          0%, 100% { opacity: 0.92; transform: translateY(0) scale(1) rotate(0deg); }
          50% { opacity: 0.82; transform: translateY(1px) scale(1.02) rotate(0.5deg); }
        }
        
        @keyframes softPulse3 {
          0%, 100% { opacity: 0.9; transform: translateY(0) scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: translateY(-1.5px) scale(1.01) rotate(-0.5deg); }
        }
        
        /* Плавающее движение для контейнера */
        @keyframes floatMotion {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(0.2deg); }
          50% { transform: translateY(0) rotate(-0.2deg); }
          75% { transform: translateY(1.5px) rotate(0.1deg); }
        }
        
        /* Оптимизация для мобильных устройств - предотвращает дерганье */
        @media (max-width: 768px) {
          .coffee-icon {
            transform: translateZ(0); /* Активирует GPU-ускорение */
          }
          
          .coffee-wave-container {
            -webkit-transform: translateZ(0);
            -webkit-backface-visibility: hidden;
          }
        }
        
        /* Эффект свечения для кольца вокруг новой чашки */
        @keyframes cupGlowRingEffect {
          0% { opacity: 0; }
          20% { opacity: 0.4; }
          50% { opacity: 0.2; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCoffeeCounter; 