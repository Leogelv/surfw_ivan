import { createContext } from 'react';

// Создаем контекст для передачи данных анимации между компонентами
export const AnimationContext = createContext<{
  transitionState: {
    productId: string | null;
    imagePosition: { top: number; left: number; width: number; height: number } | null;
    scrollPosition: number;
    isAnimating: boolean;
  };
  captureImagePosition: (
    productId: string, 
    position: { top: number; left: number; width: number; height: number }, 
    scrollPosition: number
  ) => void;
}>({
  transitionState: { productId: null, imagePosition: null, scrollPosition: 0, isAnimating: false },
  captureImagePosition: () => {}
});

export default AnimationContext; 