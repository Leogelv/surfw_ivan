import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

// Иконки для разных модификаторов
const modifierIcons: Record<string, string> = {
  // Сиропы
  'Карамель': 'mdi:bottle-tonic-outline',
  'Ваниль': 'mdi:flower-outline',
  'Лесной орех': 'fluent:food-24-filled',
  'Кокос': 'mdi:fruit-cherries',
  'Шоколад': 'lucide:candy',
  
  // Молоко
  'Обычное': 'mdi:cup-water',
  'Растительное': 'mdi:sprout',
  'Овсяное': 'mdi:barley',
  'Миндальное': 'mdi:seed-outline',
  'Кокосовое': 'tabler:coconut',
  'Без молока': 'mdi:cup-off-outline',
  
  // Опции еды
  'Подогреть': 'mdi:stove',
  'Без глютена': 'mdi:food-off-outline',
  'Дополнительная порция': 'mdi:food-variant-plus',
  'Джем': 'mdi:pot-mix-outline',
  'Сливочное масло': 'mdi:butter',
  'Мед': 'mdi:bee',
  
  // Дополнительно
  'extraShot': 'mdi:plus-circle-outline',
  'default': 'mdi:bottle-tonic-outline'
};

// Цвета для разных типов модификаторов
const modifierColors: Record<string, string> = {
  // Сиропы
  'Карамель': '#C68E17',
  'Ваниль': '#F3E5AB',
  'Лесной орех': '#A67B5B',
  'Кокос': '#F8F8F8',
  'Шоколад': '#6B4226',
  
  // Молоко
  'Обычное': '#FFFFFF',
  'Растительное': '#E3F1D9',
  'Овсяное': '#E8D4A9',
  'Миндальное': '#F7E8D4',
  'Кокосовое': '#FFFFFF',
  'Без молока': '#CCCCCC',
  
  // Опции еды
  'Подогреть': '#FF6B6B',
  'Без глютена': '#A5D6A7',
  'Дополнительная порция': '#90CAF9',
  'Джем': '#F48FB1',
  'Сливочное масло': '#FFE082',
  'Мед': '#FFCC80',
  
  // Дополнительно
  'extraShot': '#B71C1C',
  'default': '#A67C52'
};

interface AnimatedModifierIconsProps {
  selectedMilk: string;
  selectedSyrup: string[];
  extraShot: boolean;
  selectedFoodOptions: string[];
  isVisible: boolean;
  accentColor?: string;
  category?: string;
}

const AnimatedModifierIcons: React.FC<AnimatedModifierIconsProps> = ({ 
  selectedMilk, 
  selectedSyrup,
  extraShot,
  selectedFoodOptions,
  isVisible = true,
  accentColor = "#A67C52",
  category = 'coffee'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const prevModifiersRef = useRef<string[]>([]);
  
  // Получаем все активные модификаторы
  const getActiveModifiers = (): string[] => {
    const modifiers: string[] = [];
    
    // Добавляем выбранное молоко, если оно не обычное
    if (selectedMilk !== 'Обычное' && selectedMilk !== 'Без молока') {
      modifiers.push(selectedMilk);
    }
    
    // Добавляем выбранные сиропы
    modifiers.push(...selectedSyrup);
    
    // Добавляем доп. шот
    if (extraShot) {
      modifiers.push('extraShot');
    }
    
    // Добавляем опции еды
    modifiers.push(...selectedFoodOptions);
    
    return modifiers;
  };
  
  // Хук для отслеживания изменений в модификаторах
  useEffect(() => {
    const activeModifiers = getActiveModifiers();
    
    // Проверяем, изменились ли модификаторы
    const prevModifiers = prevModifiersRef.current;
    const hasChanges = JSON.stringify(activeModifiers) !== JSON.stringify(prevModifiers);
    
    if (hasChanges) {
      setAnimationTrigger(prev => prev + 1);
      
      // Сохраняем новые модификаторы
      prevModifiersRef.current = activeModifiers;
      
      // Добавляем анимацию контейнера при изменении модификаторов
      if (containerRef.current) {
        containerRef.current.classList.add('modifiers-container-pulse');
        
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.classList.remove('modifiers-container-pulse');
          }
        }, 600);
      }
    }
  }, [selectedMilk, selectedSyrup, extraShot, selectedFoodOptions]);
  
  // Получаем все активные модификаторы
  const activeModifiers = getActiveModifiers();
  
  // Проверяем, нужно ли отображать этот компонент
  // Если категория не кофе/чай или нет активных модификаторов, скрываем
  if ((!isVisible || !['coffee', 'drinks'].includes(category) || activeModifiers.length === 0)) {
    return null;
  }
  
  return (
    <div className="flex justify-center mt-1 relative overflow-hidden">
      <div 
        ref={containerRef}
        className="flex space-x-2 items-center modifiers-container"
        style={{
          padding: '4px 8px',
          minHeight: '36px'
        }}
      >
        {activeModifiers.map((modifier, index) => {
          // Получаем задержку для анимации
          const delayFactor = index * 0.1;
          
          // Получаем иконку для модификатора
          const iconName = modifierIcons[modifier] || modifierIcons.default;
          
          // Получаем цвет для модификатора
          const color = modifierColors[modifier] || modifierColors.default;
          
          // Проверяем, новый ли это модификатор
          const isNew = !prevModifiersRef.current.includes(modifier);
          
          return (
            <div 
              key={`${modifier}-${index}-${animationTrigger}`}
              className={`flex modifier-icon items-center justify-center p-1 rounded-full transform shadow-sm ${isNew ? 'modifier-bounce-in' : ''}`}
              style={{ 
                backgroundColor: `${color}20`,
                border: `1px solid ${color}40`,
                boxShadow: `0 2px 4px ${color}30`,
                transform: 'scale(1)',
                opacity: 0.95,
                animation: `modifierPulse${index % 3 + 1} 3s infinite ease-in-out`,
                animationDelay: `${delayFactor}s`,
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Эффект "вспышки" вокруг новой иконки */}
              {isNew && (
                <div className="absolute inset-0 modifier-glow-ring" style={{
                  boxShadow: `0 0 12px 4px ${color}40`,
                  borderRadius: '50%'
                }}></div>
              )}
              
              <Icon 
                icon={iconName} 
                style={{ 
                  color: color,
                  fontSize: '20px',
                  filter: isNew ? 'saturate(1.5)' : 'saturate(1.2)'
                }} 
                className="modifier-icon-svg"
              />
              
              {/* Дополнительная подсказка о модификаторе при наведении */}
              <div className="absolute bottom-full mb-1 opacity-0 modifier-tooltip bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                {modifier === 'extraShot' ? 'Двойной эспрессо' : modifier}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Стили для анимаций */}
      <style jsx global>{`
        /* Контейнер для модификаторов */
        .modifiers-container {
          animation: floatMotionModifiers 6s infinite ease-in-out;
          width: fit-content;
          margin: 0 auto;
          position: relative;
        }
        
        /* Анимация "пульса" для контейнера */
        .modifiers-container-pulse {
          animation: modifiersContainerPulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Базовые стили для иконок модификаторов */
        .modifier-icon {
          position: relative;
          width: 32px;
          height: 32px;
          will-change: transform, opacity;
          transition: all 0.3s ease-out;
        }
        
        /* При наведении показываем подсказку */
        .modifier-icon:hover .modifier-tooltip {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.3s;
        }
        
        /* Стили подсказки */
        .modifier-tooltip {
          transform: translateY(5px);
          transition: all 0.3s ease-out;
          z-index: 50;
        }
        
        /* Эффект появления модификатора */
        .modifier-bounce-in {
          animation: modifierBounceIn 0.8s cubic-bezier(0.18, 1.5, 0.5, 1) forwards;
        }
        
        /* Эффект свечения вокруг новой иконки */
        .modifier-glow-ring {
          animation: modifierGlowEffect 1.5s ease-out forwards;
        }
        
        /* Пульсация иконок модификаторов (три варианта) */
        @keyframes modifierPulse1 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(2deg); }
        }
        
        @keyframes modifierPulse2 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.07) rotate(-2deg); }
        }
        
        @keyframes modifierPulse3 {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.03) rotate(1deg); }
        }
        
        /* Анимация контейнера */
        @keyframes modifiersContainerPulse {
          0% { transform: scale(0.97); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        /* Плавающее движение для контейнера с модификаторами */
        @keyframes floatMotionModifiers {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          75% { transform: translateY(2px); }
        }
        
        /* Эффект появления модификатора */
        @keyframes modifierBounceIn {
          0% { 
            opacity: 0; 
            transform: scale(0.3) translateY(10px); 
          }
          70% { 
            opacity: 1; 
            transform: scale(1.1) translateY(-3px); 
          }
          85% {
            transform: scale(0.95) translateY(1px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        
        /* Анимация свечения */
        @keyframes modifierGlowEffect {
          0%, 100% { opacity: 0; }
          30%, 70% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedModifierIcons; 