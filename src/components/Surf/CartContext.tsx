'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

// Тип элемента корзины
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  options?: string[];
}

// Тип адреса доставки
export interface DeliveryAddress {
  spot: string;
  name: string;
  phone: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  address: DeliveryAddress | null;
  setAddress: (address: DeliveryAddress) => void;
  orderId: string | null;
  setOrderId: (id: string) => void;
  estimatedTime: number | null;
  setEstimatedTime: (minutes: number) => void;
  orderPlaced: boolean;
  setOrderPlaced: (placed: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalItems: () => 0,
  getTotalPrice: () => 0,
  address: null,
  setAddress: () => {},
  orderId: null,
  setOrderId: () => {},
  estimatedTime: null,
  setEstimatedTime: () => {},
  orderPlaced: false,
  setOrderPlaced: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);

  // Загружаем данные из localStorage при инициализации
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('surfCart');
      const savedAddress = localStorage.getItem('surfAddress');
      const savedOrderId = localStorage.getItem('surfOrderId');
      const savedEstimatedTime = localStorage.getItem('surfEstimatedTime');
      const savedOrderPlaced = localStorage.getItem('surfOrderPlaced');
      
      if (savedCart) setItems(JSON.parse(savedCart));
      if (savedAddress) setAddress(JSON.parse(savedAddress));
      if (savedOrderId) setOrderId(savedOrderId);
      if (savedEstimatedTime) setEstimatedTime(Number(savedEstimatedTime));
      if (savedOrderPlaced) setOrderPlaced(savedOrderPlaced === 'true');
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('surfCart', JSON.stringify(items));
    }
  }, [items]);

  // Сохраняем адрес в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      localStorage.setItem('surfAddress', JSON.stringify(address));
    }
  }, [address]);

  // Сохраняем orderId в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && orderId) {
      localStorage.setItem('surfOrderId', orderId);
    }
  }, [orderId]);

  // Сохраняем estimatedTime в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && estimatedTime !== null) {
      localStorage.setItem('surfEstimatedTime', String(estimatedTime));
    }
  }, [estimatedTime]);

  // Сохраняем orderPlaced в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('surfOrderPlaced', String(orderPlaced));
    }
  }, [orderPlaced]);

  // Добавление товара в корзину
  const addToCart = (item: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => 
        i.id === item.id && 
        i.size === item.size && 
        JSON.stringify(i.options || []) === JSON.stringify(item.options || []));
      
      if (existingItemIndex >= 0) {
        // Если товар уже в корзине, увеличиваем количество
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Иначе добавляем новый товар
        return [...prevItems, item];
      }
    });
  };

  // Удаление товара из корзины
  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Обновление количества товара
  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // Очистка корзины
  const clearCart = () => {
    setItems([]);
  };

  // Получение общего количества товаров
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Получение общей стоимости
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        getTotalItems, 
        getTotalPrice, 
        address, 
        setAddress,
        orderId,
        setOrderId,
        estimatedTime,
        setEstimatedTime,
        orderPlaced,
        setOrderPlaced
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Хук для использования корзины
export const useCart = () => useContext(CartContext); 