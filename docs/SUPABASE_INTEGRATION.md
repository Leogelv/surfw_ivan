# Интеграция с Supabase

## Основная структура данных пользователей

В нашем приложении используется Supabase для хранения данных пользователей. Основные таблицы:

1. `auth.users` - Стандартная таблица аутентификации Supabase
2. `public.users` - Наша пользовательская таблица с дополнительными данными пользователей
3. `public.user_settings` - Таблица настроек пользователей

## Зависимости и ограничения

Важно понимать взаимосвязь между этими таблицами:

- `public.users.id` ссылается на `auth.users.id` через внешний ключ
- `public.user_settings.user_id` ссылается на `public.users.id` через внешний ключ

## Триггеры

В базе данных настроены следующие триггеры:

### 1. `handle_telegram_auth()`

Этот триггер срабатывает при создании пользователя в `auth.users` и автоматически создаёт запись в `public.users`, если у пользователя есть данные Telegram в `raw_user_meta_data`:

```sql
CREATE OR REPLACE FUNCTION public.handle_telegram_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, существует ли уже пользователь с таким telegram_id
  IF EXISTS (SELECT 1 FROM public.users WHERE telegram_id = NEW.raw_user_meta_data->>'telegram_id') THEN
    -- Обновляем существующего пользователя
    UPDATE public.users
    SET 
      username = NEW.raw_user_meta_data->>'username',
      first_name = NEW.raw_user_meta_data->>'first_name',
      last_name = NEW.raw_user_meta_data->>'last_name',
      photo_url = NEW.raw_user_meta_data->>'photo_url',
      telegram_auth_date = to_timestamp((NEW.raw_user_meta_data->>'auth_date')::bigint),
      telegram_hash = NEW.raw_user_meta_data->>'hash',
      last_login = now(),
      updated_at = now()
    WHERE telegram_id = NEW.raw_user_meta_data->>'telegram_id';
  ELSE
    -- Создаем нового пользователя
    INSERT INTO public.users (
      id, 
      telegram_id, 
      username, 
      first_name, 
      last_name, 
      photo_url, 
      telegram_auth_date, 
      telegram_hash,
      created_at, 
      updated_at, 
      last_login
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'telegram_id',
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'photo_url',
      to_timestamp((NEW.raw_user_meta_data->>'auth_date')::bigint),
      NEW.raw_user_meta_data->>'hash',
      now(),
      now(),
      now()
    );
    
    -- Создаем запись в user_settings
    INSERT INTO public.user_settings (user_id, notifications_enabled, theme, language, updated_at)
    VALUES (NEW.id, true, 'light', 'ru', now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
```

### 2. `create_user_settings_on_signup()`

Триггер, который создает запись в `user_settings` при создании пользователя:

```sql
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, notifications_enabled, theme, language, updated_at)
  VALUES (NEW.id, true, 'light', 'ru', now())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

### 3. `handle_new_user()`

Триггер, который создает запись в `public.users` для не-Telegram пользователей:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Пропускаем, если это пользователь Telegram (обрабатывается отдельным триггером)
  IF NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Проверяем, существует ли уже пользователь
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, username, created_at, updated_at, last_login)
    VALUES (NEW.id, COALESCE(NEW.email, NEW.phone), NEW.created_at, NEW.created_at, now());
    
    INSERT INTO public.user_settings (user_id, notifications_enabled, theme, language, updated_at)
    VALUES (NEW.id, true, 'light', 'ru', now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
```

## Правильный порядок создания пользователя

**Важно!** При ручном создании пользователя всегда соблюдайте следующий порядок:

1. Сначала создавайте пользователя в `auth.users` через `supabase.auth.signUp()` или `supabaseAdmin.auth.admin.createUser()`
2. Триггеры должны автоматически создать записи в `public.users` и `public.user_settings`
3. Если по какой-то причине триггеры не сработали, создайте записи вручную, используя тот же `id`, что и в `auth.users`

Пример корректного кода для создания пользователя:

```javascript
async function createUserInSupabase() {
  // Создаем пользователя в auth.users через Auth API
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      telegram_id: telegram_id.toString(),
      username,
      first_name,
      last_name,
      provider: 'telegram'
    }
  });

  if (authError) {
    console.error("Ошибка при создании пользователя:", authError);
    return null;
  }

  const userId = authUser.user.id;
  
  // Проверяем, были ли автоматически созданы записи
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
    
  if (!existingUser) {
    // Если триггер не сработал, создаем запись вручную
    await supabase
      .from('users')
      .insert({
        id: userId,
        telegram_id,
        username,
        first_name,
        last_name,
        // ... другие поля
      });
  }
  
  // Проверяем настройки
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (!settings) {
    // Если настройки не созданы автоматически
    await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        notifications_enabled: true,
        theme: 'light',
        language: 'ru'
      });
  }
  
  return userId;
}
```

## Проблемы и их решение

### Ошибка duplicate key value violates unique constraint

Если при создании пользователя в `public.users` возникает ошибка дублирования ключа, это означает, что триггер уже создал запись. В этом случае можно:

1. Проверить существование записи перед созданием
2. Использовать `upsert` вместо `insert`
3. Добавить `ON CONFLICT (id) DO NOTHING` в SQL запрос

### Ошибка foreign key constraint violation

Если возникает ошибка нарушения ограничения внешнего ключа, это означает, что вы пытаетесь создать запись в `public.users` без соответствующей записи в `auth.users` или запись в `user_settings` без записи в `public.users`. 

**Решение:** всегда создавайте записи в правильном порядке или используйте транзакции.

## Скрипты и тестирование

В репозитории есть несколько скриптов для тестирования и управления пользователями:

- `test-direct.js` - создание тестового пользователя через Admin API
- `test-create-user-direct.js` - альтернативный скрипт для создания тестового пользователя
- `test-user-operations.js` - утилита для создания и удаления тестовых пользователей 