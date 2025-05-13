import { useState, useEffect } from 'react';
import { getUserStats } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface UserStats {
  power: number;
  practiceMinutes: number;
  streak: number;
  totalMinutes: number;
  sessionsCompleted: number;
  level: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    power: 3, // Дефолтные значения
    practiceMinutes: 100,
    streak: 7,
    totalMinutes: 120,
    sessionsCompleted: 5,
    level: 1
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
          // API returns only power, practiceMinutes, and streak
          // We need to calculate or provide default values for the other fields
          setStats({
            power: data.power || 3,
            practiceMinutes: data.practiceMinutes || 100,
            streak: data.streak || 7,
            // Calculate totalMinutes from practiceMinutes or use default
            totalMinutes: data.practiceMinutes || 120,
            // These fields don't come from the API, use default values
            sessionsCompleted: 5,
            level: Math.floor((data.power || 3) / 10) + 1 // Calculate level based on power
          });
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