import { useState, useEffect } from 'react';
import { getUserStats } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface UserStats {
  power: number;
  practiceMinutes: number;
  streak: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    power: 3, // Дефолтные значения
    practiceMinutes: 100,
    streak: 7
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // На клиентской стороне
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        if (!user) {
          // Если пользователь не авторизован, используем дефолтные значения
          return;
        }
        
        const { data, error: statsError } = await getUserStats();
        
        if (statsError) {
          throw new Error(statsError.toString());
        }
        
        if (data) {
          setStats(data);
        }
      } catch (err: any) {
        console.error('Error fetching user stats:', err);
        setError(err.message || 'Failed to load user statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, isLoading, error };
}; 