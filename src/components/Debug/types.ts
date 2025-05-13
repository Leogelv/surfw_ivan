export interface SystemStatus {
  ok: boolean;
  message: string;
  details?: any;
}

export interface TelegramHealth {
  sdkInitialized: SystemStatus;
  userRetrieved: SystemStatus;
  initDataRetrieved: SystemStatus;
  webAppAvailable: SystemStatus;
  fullscreen: SystemStatus;
  safeArea: SystemStatus;
  themeParams: SystemStatus;
}

export interface SupabaseHealth {
  clientInitialized: SystemStatus;
  connection: SystemStatus;
  envVars: SystemStatus;
}

export interface AuthHealth {
  authContextLoaded: SystemStatus;
  supabaseSession: SystemStatus;
  supabaseUser: SystemStatus;
  publicUserLoaded: SystemStatus;
}

export interface AppHealth {
  userStats: SystemStatus;
}

export type LogEntry = {
  id: string;
  level: string;
  message: string;
  created_at: string;
  context?: Record<string, any>;
};

// Типы для пропсов основной панели, если нужны во вкладках
export interface DebugPanelProps {
  logs?: any[]; // Логи, переданные извне (например, с главной страницы)
  telegramUser?: any; // Пользователь Telegram, переданный извне
  supabaseUser?: any; // Пользователь Supabase (public.users), переданный извне
} 