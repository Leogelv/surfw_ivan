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
        bottom: '70px',
        right: '20px',
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
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25a3.375 3.375 0 00-4.773 0L2.25 6.75a3.375 3.375 0 000 4.773l2.472 2.472M6.75 2.25L11.42 7.83m0 0L6.75 2.25m4.67 5.58L2.25 6.75" />
      </svg>
    </button>
  );
};

export default FloatingDebugButton; 