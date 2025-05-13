-- 1. Создание таблицы users (если еще не существует с нужными полями)
-- Важно: эта миграция предполагает, что таблица auth.users уже существует.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT, -- Используем photo_url как в Telegram User объекте
  telegram_id TEXT UNIQUE, -- Для связи с Telegram ID
  telegram_auth_date TIMESTAMPTZ, -- Дата аутентификации из Telegram
  last_login TIMESTAMPTZ, -- Время последнего логина в наше приложение
  is_test BOOLEAN DEFAULT FALSE, -- Добавляем поле is_test
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT telegram_id_not_empty CHECK (telegram_id IS NOT NULL AND telegram_id <> '')
);

COMMENT ON TABLE public.users IS 'Профили пользователей, синхронизированные с auth.users и дополненные данными из Telegram.';
COMMENT ON COLUMN public.users.photo_url IS 'Ссылка на фото профиля пользователя, предпочтительно из Telegram.';
COMMENT ON COLUMN public.users.telegram_id IS 'Уникальный идентификатор пользователя в Telegram.';

-- 2. Установка RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политики RLS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can do anything." ON public.users;
-- Пример админской политики (если есть роль admin_user). Осторожно!
-- CREATE POLICY "Admin can do anything." ON public.users
--   FOR ALL USING (current_user_is_admin()) WITH CHECK (current_user_is_admin());
-- Для service_role ключа RLS обычно обходится, но для других ролей это важно.

-- 3. Триггер для автоматического создания записи в public.users при регистрации нового пользователя в auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, username, photo_url, telegram_id, telegram_auth_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'telegram_username', 'user_' || substring(NEW.id::text from 1 for 8)), -- Фоллбэк для username
    NEW.raw_user_meta_data->>'photo_url',
    NEW.raw_user_meta_data->>'telegram_id',
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_date' ~ '^[0-9]+$'
      THEN to_timestamp((NEW.raw_user_meta_data->>'auth_date')::bigint)
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING; -- Если вдруг запись уже есть (маловероятно с триггером after insert)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер, если он был с другим именем или логикой
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Создаем триггер
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Автоматически создает запись в public.users при регистрации нового пользователя в auth.users, извлекая метаданные.';

-- 4. Добавление колонки is_test (если еще не добавлена из предыдущей миграции)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_test'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_users_is_test ON public.users(is_test);
        RAISE NOTICE 'Колонка is_test успешно добавлена в таблицу users.';
    ELSE
        RAISE NOTICE 'Колонка is_test уже существует в таблице users.';
    END IF;
END $$;

-- 5. Индексы для часто запрашиваемых полей
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Примечание: После применения этой миграции, убедитесь, что метаданные пользователя
-- (first_name, last_name, username, photo_url, telegram_id, auth_date)
-- корректно передаются в `options.data` при вызове `supabase.auth.signUp()`. 