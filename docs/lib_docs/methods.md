# Методы Telegram SDK

## Полноэкранный режим (Fullscreen)

### web_app_request_fullscreen

Метод `web_app_request_fullscreen` используется для запроса полноэкранного режима в Telegram Mini Apps. Это современный метод, который пришел на замену устаревшему `webApp.expand()`.

#### Реализация в нашем проекте

```typescript
// В компоненте TelegramViewportStyle.tsx
try {
  viewportLogger.info('Запрос на полноэкранный режим через web_app_request_fullscreen');
  postEvent('web_app_request_fullscreen');
  viewportLogger.info('Метод web_app_request_fullscreen вызван успешно');
} catch (fullscreenError) {
  viewportLogger.warn('Ошибка при вызове web_app_request_fullscreen, переключаемся на webApp.expand()', fullscreenError);
  webApp.expand();
  viewportLogger.info('Использован запасной метод webApp.expand() для перехода в полноэкранный режим');
}
```

#### Как работает

1. Используем функцию `postEvent` из `@telegram-apps/sdk` для отправки события `web_app_request_fullscreen`
2. Если метод не поддерживается или возникает ошибка, используем запасной вариант `webApp.expand()`
3. Логируем все действия для отладки

#### Преимущества перед webApp.expand()

- Современный официальный метод Telegram
- Лучшая совместимость с новыми версиями Telegram
- Корректная обработка безопасных областей (safe areas)
- Более надежное поведение на различных устройствах

#### Обработка в Telegram

```javascript
// Примерный код обработки в Telegram WebApp (для понимания)
if (event.data === 'web_app_request_fullscreen') {
  WebApp.expandViewport();
  WebApp.setViewportSettings({
    is_expanded: true
  });
}
```

## Создание пользователя в Supabase

### createUserInSupabase

Метод `createUserInSupabase` обеспечивает сохранение данных пользователя Telegram в нашей базе данных Supabase.

#### Реализация в нашем проекте

```typescript
// В контексте TelegramContext.tsx
const createUserInSupabase = async (telegramUser: TelegramUser) => {
  if (!telegramUser || !telegramUser.id) {
    telegramLogger.error('Невозможно создать пользователя: отсутствуют данные пользователя Telegram');
    return;
  }

  try {
    // Проверка наличия пользователя с таким telegram_id
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, telegram_id, photo_url')
      .eq('telegram_id', telegramUser.id.toString())
      .maybeSingle();
    
    // Общие данные пользователя для создания или обновления
    const userData = {
      telegram_id: telegramUser.id.toString(),
      username: telegramUser.username || '',
      first_name: telegramUser.first_name || '',
      last_name: telegramUser.last_name || '',
      photo_url: telegramUser.photo_url || '',
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      telegram_auth_date: convertAuthDateToISO(parseInt(telegramUser.auth_date))
    };
    
    // Если пользователь существует, обновляем его
    if (existingUser) {
      await supabase
        .from('users')
        .update(userData)
        .eq('telegram_id', telegramUser.id.toString());
    } else {
      // Создаем нового пользователя с генерированным UUID
      const newUserData = {
        ...userData,
        id: uuidv4(),
        created_at: new Date().toISOString()
      };
      
      const { data: newUser } = await supabase
        .from('users')
        .insert(newUserData)
        .select();
      
      // Дополнительно создаем запись в user_settings
      if (newUser && newUser.length > 0) {
        await supabase
          .from('user_settings')
          .insert({
            user_id: newUser[0].id,
            notifications_enabled: true,
            theme: 'light',
            language: 'ru',
            updated_at: new Date().toISOString()
          });
      }
    }
  } catch (e) {
    telegramLogger.error('Ошибка при создании/обновлении пользователя', e);
  }
};
```

#### Как работает

1. Проверяем наличие пользователя в базе данных по `telegram_id`
2. Если пользователь существует - обновляем его данные
3. Если пользователь не существует - создаем нового с уникальным UUID
4. При создании нового пользователя также создаем запись в `user_settings`
5. Все действия логируются для отладки

#### Обработка ошибок

- Отсутствие данных пользователя
- Ошибка соединения с Supabase
- Ошибка выполнения запроса к базе данных
- Ошибка создания записи в таблице user_settings 