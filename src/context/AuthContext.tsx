'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTelegram } from './TelegramContext';
import logger from '@/lib/logger';

// Типы данных
interface User {
  id: string;
  telegram_id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: number;
  updated_at?: string;
  created_at?: string;
}

interface AuthContextType {
  user: any;
  userData: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { telegramUser, initData } = useTelegram();
  const supabase = getSupabaseClient();
  const authLogger = logger.createLogger('AuthContext');

  // Функция для создания/обновления пользователя Telegram в Supabase
  const createOrUpdateTelegramUser = async (telegramData: any) => {
    if (!telegramData || !telegramData.id) {
      authLogger.warn('Попытка создания пользователя без данных Telegram');
      return null;
    }

    try {
      authLogger.info('Создание/обновление пользователя Telegram в Supabase', { telegramId: telegramData.id });
      
      // Проверяем существует ли пользователь
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramData.id.toString())
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        authLogger.error('Ошибка при проверке существования пользователя', fetchError);
        throw fetchError;
      }

      // Данные для создания/обновления
      const userData = {
        telegram_id: telegramData.id.toString(),
        username: telegramData.username || '',
        first_name: telegramData.first_name || '',
        last_name: telegramData.last_name || '',
        photo_url: telegramData.photo_url || '',
        auth_date: telegramData.auth_date || Math.floor(Date.now() / 1000),
        updated_at: new Date().toISOString()
      };

      let result;
      
      // Если пользователь существует - обновляем, иначе создаем
      if (existingUser) {
        authLogger.info('Обновление существующего пользователя', { userId: existingUser.id });
        const { data, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('telegram_id', telegramData.id.toString())
          .select()
          .single();
        
        if (updateError) {
          authLogger.error('Ошибка при обновлении пользователя', updateError);
          throw updateError;
        }
        
        result = data;
        authLogger.info('Пользователь успешно обновлен', { userId: result.id });
      } else {
        authLogger.info('Создание нового пользователя');
        const { data, error: insertError } = await supabase
          .from('users')
          .insert({ ...userData, created_at: new Date().toISOString() })
          .select()
          .single();
        
        if (insertError) {
          authLogger.error('Ошибка при создании пользователя', insertError);
          throw insertError;
        }
        
        result = data;
        authLogger.info('Пользователь успешно создан', { userId: result.id });
      }
      
      return result;
    } catch (error) {
      authLogger.error('Ошибка при создании/обновлении пользователя', error);
      setError('Ошибка при создании/обновлении пользователя');
      return null;
    }
  };

  // Эффект для авторизации через Telegram
  useEffect(() => {
    async function handleTelegramAuth() {
      if (!telegramUser) {
        authLogger.info('Пользователь Telegram не найден, ожидание авторизации');
        setIsLoading(false);
        return;
      }

      try {
        authLogger.info('Данные пользователя Telegram получены', { telegramId: telegramUser.id });
        
        // Получаем пользователя из Supabase или создаем нового
        const userRecord = await createOrUpdateTelegramUser(telegramUser);
        
        if (userRecord) {
          setUserData(userRecord);
          authLogger.info('Авторизация через Telegram успешна', { userId: userRecord.id });
        } else {
          authLogger.warn('Не удалось получить данные пользователя после создания/обновления');
        }
      } catch (error) {
        authLogger.error('Ошибка при авторизации через Telegram', error);
        setError('Ошибка при авторизации через Telegram');
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    handleTelegramAuth();
  }, [telegramUser, authLogger]);

  // Функция для входа по email/password
  const signIn = async (email: string, password: string) => {
    try {
      authLogger.info('Попытка входа по email/password', { email });
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        authLogger.error('Ошибка при входе', error);
        setError(error.message);
        return;
      }
      
      setUser(data.user);
      authLogger.info('Вход успешен', { userId: data.user?.id });
    } catch (error) {
      authLogger.error('Исключение при входе', error);
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода
  const signOut = async () => {
    try {
      authLogger.info('Попытка выхода');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        authLogger.error('Ошибка при выходе', error);
        setError(error.message);
        return;
      }
      
      setUser(null);
      setUserData(null);
      authLogger.info('Выход успешен');
    } catch (error) {
      authLogger.error('Исключение при выходе', error);
      setError('Произошла ошибка при выходе');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userData,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user || !!userData,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 