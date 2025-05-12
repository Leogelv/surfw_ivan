import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

/**
 * Хук для удобного доступа к клиенту Supabase в компонентах
 * Возвращает объект с клиентом Supabase и состоянием загрузки
 */
export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hookLogger = logger.createLogger('useSupabase');

  useEffect(() => {
    try {
      const client = getSupabaseClient();
      setSupabase(client);
      hookLogger.debug('Supabase клиент успешно инициализирован');
    } catch (err) {
      hookLogger.error('Ошибка при инициализации Supabase клиента', err);
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при инициализации Supabase'));
    } finally {
      setLoading(false);
    }
  }, [hookLogger]);

  return { supabase, loading, error };
} 