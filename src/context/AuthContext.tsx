'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getUserProfile, getSupabaseClient } from '@/lib/supabase';
import { Session, User, AuthChangeEvent, Provider } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import logger from '@/lib/logger';

type UserData = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  handleTelegramLogin: (telegramUser: any) => Promise<void>;
}

// Создаем логгер для контекста авторизации
const authLogger = logger.createLogger('AuthContext');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Инициализация сессии
    const initializeSession = async () => {
      try {
        authLogger.info('Инициализация сессии авторизации');
        // Получаем клиент Supabase
        const client = getSupabaseClient();
        const { data } = await client.auth.getSession();
        setSession(data.session);
        
        if (data.session?.user) {
          setUser(data.session.user);
          authLogger.info('Пользователь найден в сессии', { user_id: data.session.user.id });
          
          // Получение данных пользователя из таблицы users
          const { data: profileData, error: profileError } = await getUserProfile();
          
          if (profileError) {
            authLogger.error('Ошибка при получении профиля пользователя', profileError);
          } else if (profileData) {
            authLogger.info('Профиль пользователя загружен', { profile_id: profileData.id });
            setUserData(profileData);
          } else {
            authLogger.warn('Профиль пользователя не найден');
          }
        } else {
          authLogger.info('Пользователь не авторизован');
        }
      } catch (err) {
        authLogger.error('Ошибка инициализации авторизации', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    // Только на клиентской стороне
    if (typeof window !== 'undefined') {
      // Подписка на изменения сессии
      const client = getSupabaseClient();
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event: AuthChangeEvent, newSession: Session | null) => {
          authLogger.info('Изменение состояния авторизации', { event });
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            authLogger.debug('Новая сессия пользователя', { user_id: newSession.user.id });
            // Обновление данных пользователя при изменении сессии
            const { data: profileData, error: profileError } = await getUserProfile();
            
            if (profileError) {
              authLogger.error('Ошибка при получении профиля пользователя', profileError);
            } else if (profileData) {
              authLogger.debug('Обновлены данные профиля', { profile_id: profileData.id });
              setUserData(profileData);
            } else {
              authLogger.warn('Профиль пользователя не найден после обновления сессии');
            }
          } else {
            authLogger.info('Пользователь вышел из системы');
            setUserData(null);
          }
        }
      );

      initializeSession();

      // Отписка при размонтировании
      return () => {
        authLogger.debug('Отписка от событий авторизации при размонтировании');
        subscription.unsubscribe();
      };
    } else {
      // На сервере просто устанавливаем не загружено
      setIsLoading(false);
    }
  }, []);

  // Выход из аккаунта
  const signOut = async () => {
    try {
      authLogger.info('Попытка выхода из системы');
      const client = getSupabaseClient();
      await client.auth.signOut();
      setUserData(null);
      authLogger.info('Пользователь успешно вышел из системы');
    } catch (err) {
      authLogger.error('Ошибка при выходе из системы', err);
      setError('Failed to sign out');
    }
  };

  // Обработка входа через Telegram
  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      authLogger.info('Попытка входа через Telegram', { username: telegramUser.username });
      setIsLoading(true);
      
      const client = getSupabaseClient();
      
      // Проверяем наличие пользователя в таблице users по telegram_id
      const { data: existingUser, error: checkError } = await client
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        authLogger.warn('Ошибка при проверке существования пользователя', checkError);
      }
      
      // Если пользователя нет, создаем его
      if (!existingUser) {
        authLogger.info('Пользователь Telegram не найден в БД, создаем новую запись');
        const { data: newUser, error: insertError } = await client
          .from('users')
          .insert([
            { 
              telegram_id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || '',
              username: telegramUser.username || '',
              photo_url: telegramUser.photo_url || '',
              user_settings: {},
              last_login: new Date().toISOString()
            }
          ])
          .select()
          .single();
        
        if (insertError) {
          authLogger.error('Ошибка при создании пользователя', insertError);
        } else {
          authLogger.info('Пользователь успешно создан', { user_id: newUser.id });
        }
      } else {
        authLogger.info('Пользователь Telegram найден в БД', { user_id: existingUser.id });
        
        // Обновляем дату последнего входа
        const { error: updateError } = await client
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('telegram_id', telegramUser.id);
        
        if (updateError) {
          authLogger.warn('Ошибка при обновлении даты последнего входа', updateError);
        }
      }
      
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'telegram' as Provider,
        options: {
          queryParams: {
            auth_data: JSON.stringify(telegramUser)
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      authLogger.info('Успешный вход через Telegram OAuth');
      // Редирект будет обработан Supabase и вернет на страницу
    } catch (err: any) {
      authLogger.error('Ошибка при входе через Telegram', err);
      setError(err.message || 'Failed to login with Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    userData,
    isLoading,
    error,
    signOut,
    handleTelegramLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 