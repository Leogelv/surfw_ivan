'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { TelegramProvider, useTelegram } from '@/context/TelegramContext';
import { postEvent, retrieveLaunchParams } from '@telegram-apps/sdk';
import { usePathname } from 'next/navigation';
import ProfileScreen from '@/components/screens/ProfileScreen';
import DebugPanel from '@/components/Debug/DebugPanel';
import { createLogger } from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';

function YogaApp() {
  const { userData, isLoading: authLoading, user: supabaseUser } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const [activeTab, setActiveTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appLogs, setAppLogs] = useState<any[]>([]);
  const [contentSafeArea, setContentSafeArea] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  
  const { isFullScreenEnabled, webApp, telegramHeaderPadding, initializeTelegramApp, 
          enableFullScreen, user: telegramUser, setTelegramUser, setIsFullScreenEnabled } = useTelegram();
  const appLogger = createLogger('HomePage');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Получение и мемоизация данных инициализации из SDK
  const sdkInitData = useMemo(() => {
    try {
      // Получаем данные через SDK
      const sdkData = retrieveLaunchParams();
      appLogger.info('Получены данные из Telegram SDK', sdkData);
      return sdkData;
    } catch (e) {
      appLogger.error('Ошибка при получении данных через SDK', e);
      return {
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }, [appLogger]);

  // Применяем цвета темы из данных SDK, если они доступны
  useEffect(() => {
    if (typeof document !== 'undefined' && sdkInitData && 'tgWebAppThemeParams' in sdkInitData) {
      const themeParams = sdkInitData.tgWebAppThemeParams;
      appLogger.info('Применяем параметры темы из Telegram SDK', themeParams);
      
      // Применяем доступные цвета темы к CSS переменным
      if (themeParams) {
        Object.entries(themeParams).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--tg-theme-${key}`, value as string);
        });
        
        // Устанавливаем также более удобные алиасы для некоторых параметров
        if (themeParams.bg_color) {
          document.documentElement.style.setProperty('--tg-theme-bg', themeParams.bg_color);
        }
        if (themeParams.text_color) {
          document.documentElement.style.setProperty('--tg-theme-text', themeParams.text_color);
        }
        if (themeParams.hint_color) {
          document.documentElement.style.setProperty('--tg-theme-hint', themeParams.hint_color);
        }
        if (themeParams.link_color) {
          document.documentElement.style.setProperty('--tg-theme-link', themeParams.link_color);
        }
        if (themeParams.button_color) {
          document.documentElement.style.setProperty('--tg-theme-button', themeParams.button_color);
        }
        if (themeParams.button_text_color) {
          document.documentElement.style.setProperty('--tg-theme-button-text', themeParams.button_text_color);
        }
      }
    }
  }, [sdkInitData, appLogger]);

  // Функция для добавления лога в состояние
  const addLog = (level: string, message: string, data?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setAppLogs(prev => [log, ...prev.slice(0, 49)]); // Храним только последние 50 логов
  };

  // Расширенное логирование для главной страницы
  useEffect(() => {
    const originalInfo = appLogger.info;
    const originalError = appLogger.error;
    const originalWarn = appLogger.warn;
    const originalDebug = appLogger.debug;

    // Переопределяем методы логгера для добавления логов в состояние компонента
    appLogger.info = (message, data, userId) => {
      addLog('info', message, data);
      return originalInfo.call(appLogger, message, data, userId);
    };

    appLogger.error = (message, data, userId) => {
      addLog('error', message, data);
      return originalError.call(appLogger, message, data, userId);
    };

    appLogger.warn = (message, data, userId) => {
      addLog('warn', message, data);
      return originalWarn.call(appLogger, message, data, userId);
    };

    appLogger.debug = (message, data, userId) => {
      addLog('debug', message, data);
      return originalDebug.call(appLogger, message, data, userId);
    };

    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      appLogger.info = originalInfo;
      appLogger.error = originalError;
      appLogger.warn = originalWarn;
      appLogger.debug = originalDebug;
    };
  }, []);

  // Установка обработчика для события content_safe_area_changed
  useEffect(() => {
    const handleContentSafeAreaChanged = (event: any) => {
      try {
        // Для событий из web версии Telegram, которые приходят через window.postMessage
        if (event.data && typeof event.data === 'string') {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.eventType === 'content_safe_area_changed') {
              appLogger.info('Получены данные о безопасной зоне контента из web', eventData.eventData);
              setContentSafeArea(eventData.eventData);
            }
          } catch (e) {
            // Игнорируем ошибки парсинга для сообщений, которые не являются JSON
          }
        } else if (event.eventType === 'content_safe_area_changed') {
          // Для событий из мобильных приложений
          appLogger.info('Получены данные о безопасной зоне контента из мобильного приложения', event.eventData);
          setContentSafeArea(event.eventData);
        }
      } catch (error) {
        appLogger.error('Ошибка при обработке события content_safe_area_changed', error);
      }
    };

    // Добавляем обработчик события для веб-версии
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleContentSafeAreaChanged);
    }

    // Возвращаем функцию очистки
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleContentSafeAreaChanged);
      }
    };
  }, [appLogger]);

  // Установка обработчика для события theme_changed
  useEffect(() => {
    const handleThemeChanged = (event: any) => {
      try {
        // Для событий из web версии Telegram, которые приходят через window.postMessage
        if (event.data && typeof event.data === 'string') {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.eventType === 'theme_changed') {
              const themeParams = eventData.eventData;
              appLogger.info('Получены данные о теме из web', themeParams);
              
              // Применяем параметры темы к CSS переменным
              if (themeParams) {
                Object.entries(themeParams).forEach(([key, value]) => {
                  document.documentElement.style.setProperty(`--tg-theme-${key}`, value as string);
                });
                
                // Обновляем алиасы
                if (themeParams.bg_color) {
                  document.documentElement.style.setProperty('--tg-theme-bg', themeParams.bg_color);
                }
                if (themeParams.text_color) {
                  document.documentElement.style.setProperty('--tg-theme-text', themeParams.text_color);
                }
                if (themeParams.hint_color) {
                  document.documentElement.style.setProperty('--tg-theme-hint', themeParams.hint_color);
                }
                if (themeParams.link_color) {
                  document.documentElement.style.setProperty('--tg-theme-link', themeParams.link_color);
                }
                if (themeParams.button_color) {
                  document.documentElement.style.setProperty('--tg-theme-button', themeParams.button_color);
                }
                if (themeParams.button_text_color) {
                  document.documentElement.style.setProperty('--tg-theme-button-text', themeParams.button_text_color);
                }
              }
            }
          } catch (e) {
            // Игнорируем ошибки парсинга для сообщений, которые не являются JSON
          }
        } else if (event.eventType === 'theme_changed') {
          // Для событий из мобильных приложений
          const themeParams = event.eventData;
          appLogger.info('Получены данные о теме из мобильного приложения', themeParams);
          
          // Применяем параметры темы к CSS переменным
          if (themeParams) {
            Object.entries(themeParams).forEach(([key, value]) => {
              document.documentElement.style.setProperty(`--tg-theme-${key}`, value as string);
            });
            
            // Обновляем алиасы
            if (themeParams.bg_color) {
              document.documentElement.style.setProperty('--tg-theme-bg', themeParams.bg_color);
            }
            if (themeParams.text_color) {
              document.documentElement.style.setProperty('--tg-theme-text', themeParams.text_color);
            }
            if (themeParams.hint_color) {
              document.documentElement.style.setProperty('--tg-theme-hint', themeParams.hint_color);
            }
            if (themeParams.link_color) {
              document.documentElement.style.setProperty('--tg-theme-link', themeParams.link_color);
            }
            if (themeParams.button_color) {
              document.documentElement.style.setProperty('--tg-theme-button', themeParams.button_color);
            }
            if (themeParams.button_text_color) {
              document.documentElement.style.setProperty('--tg-theme-button-text', themeParams.button_text_color);
            }
          }
        }
      } catch (error) {
        appLogger.error('Ошибка при обработке события theme_changed', error);
      }
    };

    // Добавляем обработчик события для веб-версии
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleThemeChanged);
    }

    // Возвращаем функцию очистки
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleThemeChanged);
      }
    };
  }, [appLogger]);

  // Функция для сохранения пользователя Telegram в Supabase
  const saveTelegramUserToSupabase = async (user: any) => {
    if (!user || !user.id) {
      appLogger.warn('saveTelegramUserToSupabase: Невозможно сохранить пользователя - отсутствуют данные Telegram user или user.id', { user });
      return;
    }

    appLogger.info('saveTelegramUserToSupabase: Начало сохранения/обновления пользователя', { telegramId: user.id });
    const supabase = getSupabaseClient();

    if (!supabase) {
      appLogger.error('saveTelegramUserToSupabase: Клиент Supabase не инициализирован.');
      return;
    }

    try {
      // 1. Проверяем, есть ли пользователь в public.users по telegram_id
      appLogger.debug('saveTelegramUserToSupabase: Поиск существующего пользователя в public.users', { telegramId: user.id.toString() });
      const { data: existingPublicUser, error: findError } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, photo_url, last_login')
        .eq('telegram_id', user.id.toString())
        .maybeSingle();

      if (findError) {
        appLogger.error('saveTelegramUserToSupabase: Ошибка при поиске пользователя в public.users', { error: findError });
        // Не прерываем, попытаемся создать через signUp, возможно, это проблема RLS для select, но signUp пройдет
      }

      if (existingPublicUser) {
        appLogger.info('saveTelegramUserToSupabase: Пользователь найден в public.users, обновляем данные', { userId: existingPublicUser.id });
        const updateData = {
          first_name: user.first_name || existingPublicUser.first_name || '',
          last_name: user.last_name || existingPublicUser.last_name || '',
          username: user.username || undefined, // Обновляем username только если он есть в TG-данных
          photo_url: user.photo_url || existingPublicUser.photo_url || '',
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // telegram_auth_date можно обновлять, если он есть в user объекте и изменился
        };

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existingPublicUser.id) // Обновляем по основному ID (UUID)
          .select('id')
          .single();

        if (updateError) {
          appLogger.error('saveTelegramUserToSupabase: Ошибка при обновлении пользователя в public.users', { error: updateError });
        } else {
          appLogger.info('saveTelegramUserToSupabase: Пользователь в public.users успешно обновлен', { updatedUser });
          // Возможно, нужно обновить сессию или данные в AuthContext, если они не совпадают
          // Например, auth.refreshUserData(); (если такая функция будет)
        }
        // Если пользователь есть в public.users, предполагаем, что он есть и в auth.users
        // и его сессия должна быть активна или будет восстановлена.
        // Можно дополнительно проверить auth.currentUser и, если нужно, вызвать signIn, но это усложнит.
        return; // Завершаем, т.к. пользователь уже есть
      }

      // 2. Если пользователь НЕ найден в public.users, значит, его нет и в auth.users (из-за ON DELETE CASCADE и триггера)
      // Пробуем зарегистрировать нового пользователя через supabase.auth.signUp()
      appLogger.info('saveTelegramUserToSupabase: Пользователь не найден в public.users, попытка signUp', { telegramId: user.id });
      
      const email = `telegram_${user.id}@telegram.user`; // Уникальный email на основе telegram_id
      const randomPassword = Math.random().toString(36).slice(-12) + 'P!1'; // Генерируем случайный пароль

      const userMetadata = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || null, // Или telegram_username, как в триггере
        photo_url: user.photo_url || null,
        telegram_id: user.id.toString(),
        auth_date: user.auth_date || Math.floor(Date.now() / 1000).toString() // auth_date из Telegram или текущее время
      };
      appLogger.debug('saveTelegramUserToSupabase: Данные для signUp (options.data)', userMetadata);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: randomPassword,
        options: {
          data: userMetadata, // Эти данные будут доступны триггеру handle_new_user
        },
      });

      if (signUpError) {
        // Если ошибка "User already registered", пробуем войти
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('already registered')) {
          appLogger.warn('saveTelegramUserToSupabase: Пользователь уже зарегистрирован в auth, попытка signIn', { email });
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: randomPassword, // Пытаемся с тем же паролем, если он был создан ранее этой же логикой
          });

          if (signInError) {
            appLogger.error('saveTelegramUserToSupabase: Ошибка при signIn после signUp (User already registered)', { error: signInError });
            // Тут может быть ситуация, что пароль другой. Сложно восстановить.
            // Можно попробовать обновить метаданные существующего auth пользователя, если это необходимо
          } else {
            appLogger.info('saveTelegramUserToSupabase: Успешный signIn после signUp (User already registered)', { userId: signInData?.user?.id });
            // Триггер handle_new_user должен был отработать при первоначальном signUp.
            // Если нет, то это проблема триггера или RLS.
            // Можно добавить проверку и создание/обновление в public.users здесь, если триггер не надежен,
            // но это дублирование логики. Лучше полагаться на триггер.
          }
        } else {
          appLogger.error('saveTelegramUserToSupabase: Ошибка при signUp', { error: signUpError });
        }
        return; // Прерываем в случае ошибки signUp (кроме already registered, где пробуем signIn)
      }

      if (signUpData.user) {
        appLogger.info('saveTelegramUserToSupabase: Успешный signUp! Пользователь создан в auth.users.', { userId: signUpData.user.id, email: signUpData.user.email });
        appLogger.info('saveTelegramUserToSupabase: Ожидаем, что триггер handle_new_user создаст запись в public.users.');
        // Сессия пользователя должна автоматически установиться после успешного signUp
        // AuthContext через onAuthStateChange должен подхватить нового пользователя
      } else if (signUpData.session) {
        // Это бывает, если email_confirm=true, но у нас он false по умолчанию для signUp.
        // Если бы был true, то signUpData.user был бы null, а session - нет.
        appLogger.warn('saveTelegramUserToSupabase: signUp вернул сессию, но не пользователя. Проверьте настройки подтверждения email.', { session: signUpData.session });
      } else {
         appLogger.warn('saveTelegramUserToSupabase: signUp не вернул ни пользователя, ни сессию. Странная ситуация.');
      }

    } catch (error) {
      appLogger.error('saveTelegramUserToSupabase: Необработанная ошибка в процессе сохранения пользователя', { error });
    }
  };

  // Инициализация приложения Telegram
  useEffect(() => {
    const hasTgWebAppData = sdkInitData && 'tgWebAppData' in sdkInitData && !!sdkInitData.tgWebAppData;
    
    if (hasTgWebAppData) {
      appLogger.info('Инициализация приложения Telegram с данными из SDK', { 
        hasTgWebAppData,
        userInData: !!sdkInitData.tgWebAppData?.user
      });
      
      // Сохраняем пользователя в Supabase, если он есть в данных
      if (sdkInitData.tgWebAppData?.user && !telegramUser) {
        appLogger.info('Установка данных пользователя из tgWebAppData', sdkInitData.tgWebAppData.user);
        setTelegramUser(sdkInitData.tgWebAppData.user);
        saveTelegramUserToSupabase(sdkInitData.tgWebAppData.user);
      }
      
      // Запрашиваем полноэкранный режим
      try {
        appLogger.info('Запрос на полноэкранный режим через SDK');
        postEvent('web_app_request_fullscreen');
        setIsFullScreenEnabled(true);
      } catch (error) {
        appLogger.error('Ошибка при запросе полноэкранного режима', error);
      }
      
      // Настройка вертикальных свайпов
      try {
        appLogger.info('Установка параметров свайпа', { allow_vertical_swipe: true });
        postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: true });
      } catch (error) {
        appLogger.error('Ошибка при настройке поведения свайпа', error);
      }
      
      // Запрос безопасной зоны контента
      try {
        appLogger.info('Запрос информации о безопасной зоне контента');
        postEvent('web_app_request_content_safe_area');
      } catch (error) {
        appLogger.error('Ошибка при запросе безопасной зоны контента', error);
      }
      
      // Запрос темы оформления (если нет в данных SDK)
      try {
        if (!(sdkInitData && 'tgWebAppThemeParams' in sdkInitData)) {
          appLogger.info('Запрос информации о теме оформления');
          postEvent('web_app_request_theme');
        }
      } catch (error) {
        appLogger.error('Ошибка при запросе темы оформления', error);
      }
    } else {
      appLogger.info('Запуск в режиме браузера без данных Telegram');
    }
  }, [sdkInitData, appLogger, telegramUser, setTelegramUser, setIsFullScreenEnabled]);

  // Инициализация при загрузке страницы
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Импортируем и вызываем диагностическую функцию
    import('@/lib/supabase').then(({ diagnoseClientIssues }) => {
      const diagnostics = diagnoseClientIssues();
      appLogger.info('Диагностика клиента Supabase', diagnostics);
    });
    
    if (telegramUser) {
      if (!authLoading) {
        // Сохраняем пользователя Telegram в Supabase
        saveTelegramUserToSupabase(telegramUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, telegramUser]);

  // Устанавливаем CSS-переменную для отступа в зависимости от режима фулскрин
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Проверка, находимся ли мы в контексте Telegram
      const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
      const hasTgWebAppData = sdkInitData && 'tgWebAppData' in sdkInitData && !!sdkInitData.tgWebAppData;
      
      // Используем значение из безопасной зоны контента, если оно доступно
      const topPadding = contentSafeArea.top > 0 ? contentSafeArea.top : telegramHeaderPadding;
      
      // Устанавливаем отступы только если мы в Telegram и включен полноэкранный режим
      if ((isTelegramWebApp || telegramUser || hasTgWebAppData) && isFullScreenEnabled) {
        // Используем значение из контекста или contentSafeArea
        document.documentElement.style.setProperty(
          '--telegram-header-padding', 
          `${topPadding}px`
        );
        document.documentElement.style.setProperty(
          '--telegram-header-gradient',
          'linear-gradient(to bottom, #FFFFFF 90%, #FFFFFF 95%)'
        );
        
        // Добавляем CSS-переменные для contentSafeArea по документации
        document.documentElement.style.setProperty('--safe-area-top', `${contentSafeArea.top}px`);
        document.documentElement.style.setProperty('--safe-area-right', `${contentSafeArea.right}px`);
        document.documentElement.style.setProperty('--safe-area-bottom', `${contentSafeArea.bottom}px`);
        document.documentElement.style.setProperty('--safe-area-left', `${contentSafeArea.left}px`);
        
        // Добавляем также совместимые имена по примеру из документации
        document.documentElement.style.setProperty('--tg-content-safe-area-top', `${contentSafeArea.top}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-right', `${contentSafeArea.right}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${contentSafeArea.bottom}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-left', `${contentSafeArea.left}px`);
        
        appLogger.debug('Установлены CSS-переменные для отступов', { 
          topPadding,
          contentSafeArea,
          telegramHeaderPadding,
          safeAreaInset: webApp?.safeAreaInset
        });
        console.log('Telegram padding applied:', topPadding, 
                    'ContentSafeArea:', contentSafeArea,
                    'HeaderPadding:', telegramHeaderPadding,
                    'SafeAreaInset:', webApp?.safeAreaInset);
      } else {
        // В обычном браузере или если не в полноэкранном режиме
        document.documentElement.style.setProperty('--telegram-header-padding', '0px');
        document.documentElement.style.setProperty('--telegram-header-gradient', 'none');
        
        // Сбрасываем CSS-переменные для contentSafeArea
        document.documentElement.style.setProperty('--safe-area-top', '0px');
        document.documentElement.style.setProperty('--safe-area-right', '0px');
        document.documentElement.style.setProperty('--safe-area-bottom', '0px');
        document.documentElement.style.setProperty('--safe-area-left', '0px');
        
        document.documentElement.style.setProperty('--tg-content-safe-area-top', '0px');
        document.documentElement.style.setProperty('--tg-content-safe-area-right', '0px');
        document.documentElement.style.setProperty('--tg-content-safe-area-bottom', '0px');
        document.documentElement.style.setProperty('--tg-content-safe-area-left', '0px');
        
        appLogger.debug('Сброшены CSS-переменные для отступов');
        console.log('No Telegram padding applied, browser mode or not fullscreen');
      }
    }
  }, [isFullScreenEnabled, telegramHeaderPadding, webApp?.safeAreaInset, contentSafeArea, sdkInitData, telegramUser, appLogger]);

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
    appLogger.info('Переключение профиля', { newState: !showProfile }, telegramUser?.id?.toString());
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    setShowProfile(false);
    appLogger.info('Переход на главную', null, telegramUser?.id?.toString());
  };

  const handleCartClick = () => {
    setActiveTab('cart');
    setShowProfile(false);
    appLogger.info('Переход в корзину', null, telegramUser?.id?.toString());
  };

  const handleOrdersClick = () => {
    setActiveTab('orders');
    setShowProfile(false);
    appLogger.info('Переход в заказы', null, telegramUser?.id?.toString());
  };

  // Логирование пользовательских данных
  useEffect(() => {
    if (telegramUser) {
      appLogger.info('Данные пользователя Telegram получены', { telegramUser });
    } else {
      appLogger.warn('Данные пользователя Telegram недоступны');
    }
    
    if (userData) {
      appLogger.info('Данные пользователя из Auth получены', { userData });
    }
  }, [telegramUser, userData, appLogger]);

  // Функция для тестирования соединения
  const testConnection = async () => {
    try {
      appLogger.info('Запуск тестирования соединения с Supabase');
      const { testSupabaseConnection, diagnoseClientIssues } = await import('@/lib/supabase');
      
      // Запускаем диагностику
      const diagnostics = diagnoseClientIssues();
      appLogger.info('Диагностика клиента Supabase', diagnostics);
      
      // Тестируем соединение
      const testResult = await testSupabaseConnection();
      appLogger.info('Результат теста соединения Supabase', { success: testResult });
    } catch (error) {
      appLogger.error('Ошибка при тестировании соединения', error);
    }
  };
  
  // Функция для создания пользователя с сервисным ключом
  const createUserWithServiceKey = async () => {
    if (!telegramUser) {
      appLogger.warn('Нет данных пользователя Telegram для создания');
      return;
    }
    
    try {
      appLogger.info('Запуск создания пользователя с сервисным ключом');
      const { testCreateUserWithServiceKey } = await import('@/lib/supabase');
      
      const result = await testCreateUserWithServiceKey(telegramUser);
      appLogger.info('Результат создания пользователя с сервисным ключом', result);
    } catch (error) {
      appLogger.error('Ошибка при создании пользователя с сервисным ключом', error);
    }
  };

  // Состояния для отладочной информации
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [authState, setAuthState] = useState<any>(null);
  
  // Обновление диагностической информации
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateDiagnosticInfo = async () => {
      try {
        const { diagnoseClientIssues } = await import('@/lib/supabase');
        const diagnostics = diagnoseClientIssues();
        
        setSupabaseInfo((prev: any) => ({
          ...prev,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 5) + '....' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-5) : 'Not set',
          isClientInitialized: diagnostics.isClientInitialized,
          connectionStatus: 'Не подключено',
          connectionError: null
        }));
        
        setAuthState(userData || null);
      } catch (error) {
        console.error('Ошибка при обновлении диагностической информации:', error);
      }
    };
    
    updateDiagnosticInfo();
    updateConnectionStatus(); // Первоначальное обновление статуса соединения
    
    // Обновляем каждые 5 секунд
    const interval = setInterval(() => {
        updateDiagnosticInfo();
        updateConnectionStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [userData]);

  // Функция для обновления соединения с Supabase
  const updateConnectionStatus = async () => {
    try {
      const { testSupabaseConnection } = await import('@/lib/supabase');
      const success = await testSupabaseConnection();
      
      setSupabaseInfo((prev: any) => ({
        ...prev,
        connectionStatus: success ? 'Подключено' : 'Не подключено',
        connectionError: success ? null : 'Не удалось подключиться',
        lastChecked: new Date().toLocaleTimeString()
      }));
    } catch (error) {
      setSupabaseInfo((prev: any) => ({
        ...prev,
        connectionStatus: 'Ошибка',
        connectionError: error instanceof Error ? error.message : String(error),
        lastChecked: new Date().toLocaleTimeString()
      }));
    }
  };
  
  // Функция для копирования ключей в буфер обмена
  const copyConfigToClipboard = () => {
    const config = `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\n`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(config)
        .then(() => appLogger.info('Конфигурация скопирована в буфер обмена'))
        .catch(err => appLogger.error('Ошибка при копировании конфигурации', err));
    } else {
      appLogger.warn('API буфера обмена недоступно');
    }
  };

  // Функция для переключения видимости DebugPanel
  const toggleDebugPanel = () => {
    setShowDebugPanel(prev => !prev);
    // Можно также использовать глобальное событие, если DebugPanel его слушает
    // window.dispatchEvent(new CustomEvent('toggle-debug-panel'));
  };

  // Если отображается профиль, показываем компонент ProfileScreen
  if (showProfile) {
    return (
      <>
        <ProfileScreen 
          onClose={() => {
            setShowProfile(false);
            // При закрытии профиля, если активной была вкладка 'profile',
            // нужно решить, какую вкладку сделать активной. 
            // Например, возвращаемся на 'home' или на предыдущую активную.
            // Пока просто закрываем, активная вкладка навигации останется 'profile' до явного переключения.
            // setActiveTab('home'); // Опционально
          }}
          // Убраны onHomeClick, onCartClick, onOrdersClick, т.к. они не используются в новом ProfileScreen
        />
        {showDebugPanel && <DebugPanel telegramUser={telegramUser} supabaseUser={userData} logs={appLogs} />}
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col main-container ${showProfile ? 'overflow-hidden' : ''}`}>
      <div className="flex-grow">
        <div className="h-screen bg-zinc-100 flex flex-col">
          {/* Градиентный оверлей для верхней части Telegram WebApp */}
          {isFullScreenEnabled && (
            <div 
              className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
              style={{
                height: `${telegramHeaderPadding > 0 ? telegramHeaderPadding : contentSafeArea.top}px`,
                background: 'var(--telegram-header-gradient)'
              }}
            ></div>
          )}
          
          {/* Основной контент с учетом отступа */}
          <div 
            className="flex-1 flex flex-col"
            style={{ 
              paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding > 0 ? telegramHeaderPadding : contentSafeArea.top}px` : '0',
              paddingRight: isFullScreenEnabled ? `var(--safe-area-right, 0px)` : '0',
              paddingBottom: isFullScreenEnabled ? `var(--safe-area-bottom, 0px)` : '0',
              paddingLeft: isFullScreenEnabled ? `var(--safe-area-left, 0px)` : '0',
              transition: 'padding 0.3s ease'
            }}
          >
            {/* Добавляем силуэт человека над UI карточками */}
            <div className="relative w-full flex justify-center">
              <div className="absolute top-12 z-0 opacity-5">
                <svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100,0 C120,0 135,15 135,40 C135,65 120,80 100,80 C80,80 65,65 65,40 C65,15 80,0 100,0 Z M65,85 L135,85 L135,170 L160,230 L130,230 L115,190 L115,300 L85,300 L85,190 L70,230 L40,230 L65,170 L65,85 Z" fill="black"/>
                </svg>
              </div>
            </div>

            {/* Остальной контент */}
            <div className={`flex-1 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {/* Верхняя часть */}
              <div className="relative">
                {/* Заголовок с именем пользователя и кнопками */}
                <div className="flex justify-between items-center p-4 w-full absolute top-0 z-10">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {userData?.photo_url ? (
                        <Image 
                          src={userData.photo_url} 
                          alt="Profile" 
                          width={40} 
                          height={40} 
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">
                          {userData?.first_name?.charAt(0) || telegramUser?.first_name?.charAt(0) || 'У'}
                        </span>
                      )}
                    </div>
                    <span className="text-black font-medium ml-2">
                      {telegramUser ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}` : userData?.first_name || 'Гость'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 text-xl">{stats.power}</div>
                    <div className="bg-white rounded-full p-2">
                      <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                        <path d="M10 18L8.55 16.55C6.8 14.8 5.35833 13.275 4.225 11.975C3.09167 10.675 2.18333 9.51667 1.5 8.5C0.816667 7.48333 0.354167 6.54167 0.1125 5.675C0.0375 4.80833 0 3.93333 0 3.05C0 1.35 0.554167 0 1.6625 0C2.77083 0 3.75 0.516667 4.6 1.55L10 7.05L15.4 1.55C16.25 0.516667 17.2292 0 18.3375 0C19.4458 0 20 1.35 20 3.05C20 3.93333 19.9625 4.80833 19.8875 5.675C19.8125 6.54167 19.35 7.48333 18.5 8.5C17.65 9.51667 16.7417 10.675 15.775 11.975C14.8083 13.275 13.4833 14.8 11.45 16.55L10 18Z" fill="black"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Центральная иллюстрация */}
                <div className="w-full flex justify-center items-center pt-16 pb-8">
                  <div className="relative w-64 h-64">
                    <Image
                      src="/yoga-app/meditation.svg"
                      alt="Йога"
                      layout="fill"
                      objectFit="contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Статистика */}
              <div className="bg-white rounded-t-3xl flex flex-col flex-1">
                {/* Показатели */}
                <div className="px-6 pt-8 pb-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold">{stats.power}</div>
                    <div className="text-gray-500 text-sm uppercase tracking-wider">ТВОЯ СИЛА</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="text-center flex-1">
                      <div className="text-4xl font-bold">{stats.practiceMinutes}</div>
                      <div className="text-gray-500 text-sm uppercase tracking-wider">МИНУТ ПРАКТИКИ</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-4xl font-bold">{stats.streak}</div>
                      <div className="text-gray-500 text-sm uppercase tracking-wider">ДНЕЙ В ПОТОКЕ</div>
                    </div>
                  </div>
                </div>

                {/* Кнопка "Выбрать практику" */}
                <Link href="/practice">
                  <div className="mx-6 mb-6 bg-gray-100 rounded-full px-6 py-4 flex justify-between items-center">
                    <span className="text-lg font-medium">Выбрать практику</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M8.33334 5.83334L12.5 10L8.33334 14.1667" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация - закрепляем внизу экрана */}
        <div className="border-t border-gray-200 grid grid-cols-4 px-4 bg-white sticky bottom-0 mt-auto">
          <Link href="/" passHref legacyBehavior>
            <a className={`flex flex-col items-center py-3 ${activeTab === 'home' ? 'text-black' : 'text-gray-400'}`}
              onClick={() => {
                setActiveTab('home');
                appLogger.info('Переход на вкладку Главная', null, telegramUser?.id?.toString());
              }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 10.25V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V10.25M3 10.25L12 3L21 10.25M3 10.25L4.5 11.5M21 10.25L19.5 11.5" 
                  stroke={activeTab === 'home' ? 'black' : 'currentColor'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-1">Главная</span>
            </a>
          </Link>
          
          <Link href="/library" passHref legacyBehavior>
            <a className={`flex flex-col items-center py-3 ${activeTab === 'library' ? 'text-black' : 'text-gray-400'}`}
              onClick={() => {
                setActiveTab('library'); // Это нужно будет синхронизировать с pathname
                appLogger.info('Переход на вкладку Библиотека');
              }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={activeTab === 'library' ? 'black' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={activeTab === 'library' ? 'black' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs mt-1">Библиотека</span>
            </a>
          </Link>
          
          <Link href="/schedule" passHref legacyBehavior>
            <a className={`flex flex-col items-center py-3 ${activeTab === 'schedule' ? 'text-black' : 'text-gray-400'}`}
              onClick={() => {
                setActiveTab('schedule'); // Это нужно будет синхронизировать с pathname
                appLogger.info('Переход на вкладку Расписание');
              }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
                  stroke={activeTab === 'schedule' ? 'black' : 'currentColor'} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-1">Расписание</span>
            </a>
          </Link>
          
          <button 
            className={`flex flex-col items-center py-3 ${activeTab === 'profile' || showProfile ? 'text-black' : 'text-gray-400'}`}
            onClick={() => {
              setActiveTab('profile'); // setActiveTab теперь управляется открытием/закрытием ProfileScreen
              toggleProfile();
              appLogger.info('Переход в профиль', null, telegramUser?.id?.toString());
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" 
                fill={activeTab === 'profile' || showProfile ? 'black' : 'currentColor'} />
            </svg>
            <span className="text-xs mt-1">Профиль</span>
          </button>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row space-x-4">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={testConnection}
            >
              Проверить соединение
            </button>
            
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={createUserWithServiceKey}
            >
              Создать пользователя (Service Key)
            </button>
            
            <button 
              className="px-4 py-2 bg-purple-500 text-white rounded"
              onClick={updateConnectionStatus}
            >
              Обновить статус
            </button>
            
            <button 
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={copyConfigToClipboard}
            >
              Копировать ключи
            </button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Supabase Info</h2>
              <span className={`px-2 py-1 rounded text-xs ${supabaseInfo?.connectionStatus === 'Подключено' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {supabaseInfo?.connectionStatus || 'Неизвестно'}
              </span>
            </div>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify({ supabaseInfo, authState }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      {/* Плавающая кнопка для отладки */}
      <button 
        onClick={toggleDebugPanel}
        title="Открыть/Закрыть панель отладки"
        style={{
          position: 'fixed',
          bottom: '70px', // Немного выше навигации
          right: '20px',
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25a3.375 3.375 0 00-4.773 0L2.25 6.75a3.375 3.375 0 000 4.773l2.472 2.472M6.75 2.25L11.42 7.83m0 0L6.75 2.25m4.67 5.58L2.25 6.75" />
        </svg>
      </button>

      {/* Условный рендеринг DebugPanel */}
      {showDebugPanel && <DebugPanel telegramUser={telegramUser} supabaseUser={userData} logs={appLogs} />}
    </div>
  );
}

export default function Home() {
  return (
    <TelegramProvider>
      <YogaApp />
    </TelegramProvider>
  );
}