-- Проверяем наличие колонки is_test в таблице users
DO $$ 
BEGIN
    -- Проверяем существование колонки
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_test'
    ) THEN
        -- Если колонка не существует, добавляем её
        ALTER TABLE public.users ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
        
        -- Создаем индекс для быстрого поиска тестовых пользователей
        CREATE INDEX idx_users_is_test ON public.users(is_test);
        
        RAISE NOTICE 'Колонка is_test успешно добавлена в таблицу users';
    ELSE
        RAISE NOTICE 'Колонка is_test уже существует в таблице users';
    END IF;
END $$; 