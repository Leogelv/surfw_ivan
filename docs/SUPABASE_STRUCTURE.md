# Структура базы данных Supabase

## Общая архитектура

База данных проекта использует Supabase, который построен на PostgreSQL. Архитектура включает два основных компонента:

1. **Система аутентификации (auth schema)** - управляется Supabase Auth
2. **Пользовательские данные (public schema)** - хранит данные приложения

## Основные таблицы и связи

### Таблицы аутентификации (схема `auth`)

- **`auth.users`** - основная таблица пользователей Supabase Auth
  - Содержит учетные данные (email, пароль, метаданные)
  - Управляется сервисом аутентификации Supabase
  - Доступ через Auth API или Admin API

### Пользовательские таблицы (схема `public`)

- **`public.users`** - таблица пользователей приложения
  - Связана с `auth.users` через внешний ключ `users_id_fkey` (поле `id`)
  - Содержит данные пользователя из Telegram (telegram_id, username, first_name, last_name и др.)

- **`public.user_settings`** - настройки пользователей
  - Связана с `public.users` через внешний ключ `user_settings_user_id_fkey` (поле `user_id`)
  - Содержит персональные настройки (тема, язык, уведомления)

## Важные ограничения

1. **Foreign Key `users_id_fkey`**:
   - Поле `id` в таблице `public.users` должно соответствовать существующему `id` в таблице `auth.users`
   - При создании записи в `public.users` сначала необходимо создать пользователя в `auth.users`

2. **Row Level Security (RLS)**:
   - Таблица `public.users` защищена политиками RLS
   - Для обхода RLS при создании пользователя требуется сервисный ключ (service key)

## Процесс создания пользователя

1. Создание записи в `auth.users` через Auth API или Admin API:
   ```javascript
   // Через Admin API (рекомендуется)
   const { data, error } = await supabaseAdmin.auth.admin.createUser({
     email,
     password,
     user_metadata: { /* метаданные пользователя */ },
     email_confirm: true
   });
   
   // Через обычный Auth API
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: { /* метаданные пользователя */ }
     }
   });
   ```

2. Получение `id` созданного пользователя и вставка в `public.users`:
   ```javascript
   const userId = data.user.id;
   
   const { data: userData, error: userError } = await supabase
     .from('users')
     .insert({
       id: userId, // <-- Важно: ID из auth.users
       telegram_id: telegramId,
       // другие поля пользователя
     })
     .select();
   ```

3. Создание записи в `public.user_settings`:
   ```javascript
   const { error: settingsError } = await supabase
     .from('user_settings')
     .insert({
       user_id: userId,
       // настройки пользователя
     });
   ```

## Обновление существующего пользователя

Для обновления данных в `public.users` достаточно выполнить запрос UPDATE:

```javascript
const { data, error } = await supabase
  .from('users')
  .update({
    // обновляемые поля
    updated_at: new Date().toISOString()
  })
  .eq('telegram_id', telegramId)
  .select();
``` 