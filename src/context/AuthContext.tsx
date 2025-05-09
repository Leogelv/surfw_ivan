import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getUserProfile } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

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
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        if (data.session?.user) {
          setUser(data.session.user);
          
          // Получение данных пользователя из таблицы users
          const { data: profileData, error: profileError } = await getUserProfile();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profileData) {
            setUserData(profileData);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    // Подписка на изменения сессии
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          // Обновление данных пользователя при изменении сессии
          const { data: profileData, error: profileError } = await getUserProfile();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profileData) {
            setUserData(profileData);
          }
        } else {
          setUserData(null);
        }
      }
    );

    initializeSession();

    // Отписка при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Выход из аккаунта
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserData(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    }
  };

  // Обработка входа через Telegram
  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'telegram',
        options: {
          queryParams: {
            auth_data: JSON.stringify(telegramUser)
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Редирект будет обработан Supabase и вернет на страницу
    } catch (err: any) {
      console.error('Telegram login error:', err);
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