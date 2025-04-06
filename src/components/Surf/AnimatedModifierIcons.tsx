import { useEffect, useRef, useState } from 'react';

// Иконки для разных модификаторов в формате SVG path
const modifierIconPaths: Record<string, string> = {
  // Сиропы
  'Карамель': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m7 14a5 5 0 0 0 5-5c0-1.12-.37-2.16-1-3h-8c-.63.84-1 1.88-1 3a5 5 0 0 0 5 5m0-10c1.45 0 2.79.46 3.9 1.24h-7.8A7.03 7.03 0 0 1 12 7m-1.53-4l-.33 1h3.53l-.33-1h-2.87z',
  'Ваниль': 'M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6-1.12.4-2.24-.16-2.9-.82 1.19-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27z',
  'Лесной орех': 'M12,3C8,3 4,6 4,9c0,10 7.3,12 8,12s8,-2 8,-12c0,-3 -4,-6 -8,-6z',
  'Кокос': 'M20 10c0 7.7-6.6 14-14.5 14a15 15 0 0 1-3.5-.3c1.4-2 2.2-4.8 2.2-8.1 0-4.8-2.5-8.9-5.5-10C3.4 4.3 8.2 3 13.5 3c3.6 0 6.5 2.8 6.5 7z',
  'Шоколад': 'M15.54 3.5L16.5 4.46l-1.05 1.05-3.46 3.47-2.53 2.51 1.57 1.57-2.03 2.03-3.46-3.46-1.04-1.04 4.98-4.98 1.05-1.05 1.05-1.05m-2.56.88l-.88.88 1.75 1.75 2.54-2.54-1.76-1.76-.88.88.88.88-.88.88-.87-.88m2.12 2.13l-.88.88 1.76 1.75.87-.87-1.75-1.76M9.2 7.79l-.88.87 1.75 1.76.88-.88-1.75-1.75m5.08-4.03l2.83 2.83-10.6 10.61L3.69 14.3l10.6-10.58',
  
  // Молоко
  'Обычное': 'M18 10h-4V7h4m0 12H6V5h8v6h4m0-8H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z',
  'Растительное': 'M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zm2.44-9.37l.14-.35-3.45-1.38a5.46 5.46 0 0 0-4.19 1.58L5 14.35l.76.76 1.86-1.86a5.52 5.52 0 0 1 2.31-1.37l3.02 1.2c.74-1.2 1.91-2.19 3.33-2.68l.17-.06-3.19-1.16.18-.43-1.5-.6z',
  'Овсяное': 'M17 9v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9h10m0-5c1.1 0 2 .9 2 2v1H5V6c0-1.1.9-2 2-2h4V2h2v2h4z',
  'Миндальное': 'M17 22v-2h1V13C18 11.9 18.9 11 20 11v2h1v3h-1v2h1v2h-1v2h-3M4 2h16v2H4m0 4h16v1H4m0 3h9v1H4m0 3h9v1H4m0 3h9v1H4z',
  'Кокосовое': 'M2.39 21H21.6l-7.2-8.41 4.28-2.17-1.11-.41 3.69-1-1.14-.43-.82-2.94-1.69 1.41-.08-1.8-1.69 1.27-1.38-1.46-1.33 1.45L12 4l-1.23 1.5-1.33-1.45-1.38 1.47-1.69-1.28-.08 1.8-1.69-1.41-.82 2.94-1.14.43 3.69 1-1.11.41 4.28 2.17L2.39 21zm4.12-2l2.7-6.86L5 10.05l6.95 3.41L8.5 19h-1.99zm12.12 0h-5.99l-1.47-1.71 2.2-5.61L17 13.35 15.05 19h3.58z',
  'Без молока': 'M2 4.27l2 2L4 6.27l8.27 8.27c-.13.31-.27.58-.27 1V19h6v-2h1v-1.26c0-.35-.11-.69-.27-1L21 11.43V8.5h-1.44l.73-.73-1.42-1.42-.73.73L2 4.27M9.88 4h2.7l.44 2h-2.44l-.7-2m-2.35 0l.44 2H5.8l.43-2h1.3M9.47 9.65l.7-2.11 1.17 1.17L9.47 9.65M10.9 2.5 9.4 7.13l1.34 1.34.97-2.76.44 2.1 1.43 1.43L15 2.5h-4.1Z',
  
  // Опции еды
  'Подогреть': 'M16.2 8.65c2.25 2.25 2.25 5.9 0 8.25S10.3 19.2 8.05 17l.25-.25C10.8 19.2 14.3 19.05 16.6 16.75s2.45-6.05 0-8.5l-.4.4Z',
  'Без глютена': 'M11 7h2v2h-2V7m9 10v-2H4v2h16m0-10a2 2 0 0 1-2 2h-4v2h2v2h-2v2h-2v-2H8v-2h2v-2H6a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v2m-2 0V5H6v2h12Z',
  'Дополнительная порция': 'M6 10h2v2h2v-2h2v2h2v-2h2v2h2v-2h1v10H5V10h1m7-4a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4M2 18v4h16v-4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2',
  'Джем': 'M3 2h18v2H3V2m0 4h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6m5 10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1h-8v1z',
  'Сливочное масло': 'M18 5h-2V4c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v1c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2M6 4h8v1H6V4z',
  'Мед': 'M18 10a4 4 0 0 1 4 4v2h-2v-2c0-1.1-.9-2-2-2s-2 .9-2 2v2h-2v-2a4 4 0 0 1 4-4M2 7h20v2H2V7m9 8h2v-6h-2v6M2 19h20v2H2v-2m2-8h3v2H4v-2m5 0h3v2H9v-2m9 0h3v2h-3v-2z',
  
  // Дополнительно
  'extraShot': 'M20 4v16H4V4h16m0-2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-4 9h3v-3h-3V8h-2v3h-3v3h3v3h2v-3z',
  'default': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m7 14a5 5 0 0 0 5-5c0-1.12-.37-2.16-1-3h-8c-.63.84-1 1.88-1 3a5 5 0 0 0 5 5z'
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
          
          // Получаем путь для SVG иконки модификатора
          const iconPath = modifierIconPaths[modifier] || modifierIconPaths.default;
          
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
              
              {/* Используем SVG вместо Iconify */}
              <svg 
                viewBox="0 0 24 24" 
                width="20" 
                height="20" 
                style={{ 
                  color: color,
                  filter: isNew ? 'saturate(1.5)' : 'saturate(1.2)'
                }}
                className="modifier-icon-svg"
              >
                <path fill="currentColor" d={iconPath} />
              </svg>
              
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