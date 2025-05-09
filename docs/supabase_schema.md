# Структура базы данных Supabase

## Таблица users (для авторизации)

```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    username text,
    telegram_id text UNIQUE,
    telegram_username text,
    avatar_url text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    first_name text,
    last_name text,
    last_login timestamp with time zone,
    photo_url text
);

-- Включение Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политика доступа к своим данным
CREATE POLICY "Users can view and update their own data"
    ON public.users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

## Таблица user_settings

```sql
CREATE TABLE public.user_settings (
    user_id uuid PRIMARY KEY REFERENCES public.users(id),
    notifications_enabled boolean DEFAULT true,
    language text DEFAULT 'ru'::text,
    theme text DEFAULT 'dark'::text,
    auto_play boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- Включение Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
```

## Таблица quizlogic

```sql
CREATE TABLE public.quizlogic (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    duration VARCHAR(50),  -- Может быть NULL для некоторых типов практик
    goal VARCHAR(50) NOT NULL,
    approach VARCHAR(50),  -- Может быть NULL для не-медитативных практик
    content_type VARCHAR(50) NOT NULL,
    content_url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Включение Row Level Security
ALTER TABLE public.quizlogic ENABLE ROW LEVEL SECURITY;

-- Создание индексов для повышения производительности запросов
CREATE INDEX idx_quizlogic_type ON public.quizlogic(type);
CREATE INDEX idx_quizlogic_goal ON public.quizlogic(goal);
CREATE INDEX idx_quizlogic_approach ON public.quizlogic(approach);
CREATE INDEX idx_quizlogic_duration ON public.quizlogic(duration);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quizlogic_updated_at
BEFORE UPDATE ON public.quizlogic
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Таблица content_types

```sql
CREATE TABLE public.content_types (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT now()
);
```

## Таблица categories

```sql
CREATE TABLE public.categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    color text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Таблица tags

```sql
CREATE TABLE public.tags (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    category_id uuid REFERENCES public.categories(id),
    parent_tag_id uuid REFERENCES public.tags(id),
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
```

## Таблица contents

```sql
CREATE TABLE public.contents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    subtitle text,
    description text,
    duration integer NOT NULL,
    thumbnail_url text,
    background_image_url text,
    content_type_id uuid NOT NULL REFERENCES public.content_types(id),
    category_id uuid NOT NULL REFERENCES public.categories(id),
    difficulty_level text CHECK (difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
    kinescope_id text,
    audio_file_path text,
    is_premium boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Таблица content_tags

```sql
CREATE TABLE public.content_tags (
    content_id uuid REFERENCES public.contents(id),
    tag_id uuid REFERENCES public.tags(id),
    PRIMARY KEY (content_id, tag_id)
);
```

## Таблица related_contents

```sql
CREATE TABLE public.related_contents (
    content_id uuid REFERENCES public.contents(id),
    related_content_id uuid REFERENCES public.contents(id),
    relation_type text DEFAULT 'related'::text,
    display_order integer DEFAULT 0,
    PRIMARY KEY (content_id, related_content_id)
);
```

## Таблица favorites

```sql
CREATE TABLE public.favorites (
    user_id uuid REFERENCES public.users(id),
    content_id uuid REFERENCES public.contents(id),
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, content_id)
);

-- Включение Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
```

## Таблица progress

```sql
CREATE TABLE public.progress (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    content_id uuid REFERENCES public.contents(id),
    position integer DEFAULT 0,
    completed boolean DEFAULT false,
    completion_count integer DEFAULT 0,
    last_accessed timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Включение Row Level Security
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
```

## Таблица view_history

```sql
CREATE TABLE public.view_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    content_id uuid REFERENCES public.contents(id),
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    duration integer,
    completion_percentage double precision
);

-- Включение Row Level Security
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
```

## Таблица ratings

```sql
CREATE TABLE public.ratings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    content_id uuid REFERENCES public.contents(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Включение Row Level Security
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
```

## Таблица schedules

```sql
CREATE TABLE public.schedules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    content_id uuid REFERENCES public.contents(id),
    scheduled_date timestamp with time zone NOT NULL,
    completed boolean DEFAULT false,
    reminder boolean DEFAULT true,
    reminder_time integer DEFAULT 15,
    recurring text,
    recurring_days integer[],
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Включение Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
```

## Таблица notifications

```sql
CREATE TABLE public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    related_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);

-- Включение Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

## Таблица collections

```sql
CREATE TABLE public.collections (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    is_featured boolean DEFAULT false,
    is_premium boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Таблица collection_contents

```sql
CREATE TABLE public.collection_contents (
    collection_id uuid REFERENCES public.collections(id),
    content_id uuid REFERENCES public.contents(id),
    display_order integer DEFAULT 0,
    PRIMARY KEY (collection_id, content_id)
);
```

## Таблица agent_notes

```sql
CREATE TABLE public.agent_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    category text,
    priority text DEFAULT 'normal'::text,
    status text DEFAULT 'active'::text,
    related_files text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    is_important boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    context text
);

COMMENT ON TABLE public.agent_notes IS 'Таблица для хранения заметок AI ассистента по проекту';

-- Включение Row Level Security
ALTER TABLE public.agent_notes ENABLE ROW LEVEL SECURITY;
```

## Примеры запросов для работы с авторизацией

```sql
-- Регистрация нового пользователя через Supabase Auth
-- Выполняется через Supabase Auth API на клиенте

-- Создание триггера для автоматического создания записи в users при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, created_at, updated_at)
    VALUES (new.id, new.email, new.created_at, new.updated_at);
    
    INSERT INTO public.user_settings (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Получение информации о текущем пользователе
SELECT * FROM public.users WHERE id = auth.uid();

-- Обновление настроек пользователя
UPDATE public.user_settings 
SET theme = 'light', language = 'en', updated_at = now()
WHERE user_id = auth.uid();
```

## Примеры запросов для работы с контентом и квизом

```sql
-- Получение всех типов контента
SELECT * FROM public.content_types;

-- Получение всех категорий
SELECT * FROM public.categories ORDER BY display_order;

-- Получение всех практик определенного типа
SELECT * FROM public.quizlogic WHERE type = 'meditation';

-- Получение пользовательского прогресса по конкретной практике
SELECT * FROM public.progress 
WHERE user_id = auth.uid() AND content_id = '00000000-0000-0000-0000-000000000000';

-- Добавление практики в избранное
INSERT INTO public.favorites (user_id, content_id)
VALUES (auth.uid(), '00000000-0000-0000-0000-000000000000');

-- Получение истории просмотров пользователя
SELECT vh.*, c.title, c.thumbnail_url
FROM public.view_history vh
JOIN public.contents c ON vh.content_id = c.id
WHERE vh.user_id = auth.uid()
ORDER BY vh.started_at DESC;
``` 