'use client';

import React from 'react';

interface FloatingDebugButtonProps {
  onClick: () => void;
}

/**
 * Плавающая кнопка для отладки приложения
 */
const FloatingDebugButton: React.FC<FloatingDebugButtonProps> = ({ onClick }) => {
  // Обработчик клика с дебаг логами
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('FloatingDebugButton: Клик по кнопке отладки');
    
    // Проверяем, что обработчик передан
    if (typeof onClick !== 'function') {
      console.error('FloatingDebugButton: обработчик onClick не определен или не является функцией');
      return;
    }
    
    // Вызываем переданный обработчик
    console.log('FloatingDebugButton: Вызываем обработчик onClick');
    onClick();
    
    // Для надежности добавляем прямое создание события
    try {
      console.log('FloatingDebugButton: Пытаемся создать и отправить событие toggle-debug-panel напрямую');
      const event = new CustomEvent('toggle-debug-panel', { 
        detail: { forceState: true } 
      });
      window.dispatchEvent(event);
      console.log('FloatingDebugButton: Событие отправлено успешно');
    } catch (e) {
      console.error('FloatingDebugButton: Ошибка при отправке события', e);
    }
  };

  return (
    <button 
      onClick={handleClick}
      title="Открыть/Закрыть панель отладки"
      style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(79, 70, 229, 0.9)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(79, 70, 229, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
};

export default FloatingDebugButton; 