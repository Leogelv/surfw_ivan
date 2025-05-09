# SQL для таблицы quizlogic в Supabase

## Создание таблицы

```sql
-- Создание таблицы quizlogic
CREATE TABLE public.quizlogic (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL,
    goal VARCHAR(50) NOT NULL,
    approach VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Включение Row Level Security
ALTER TABLE public.quizlogic ENABLE ROW LEVEL SECURITY;

-- Создание политики доступа для чтения данных (анонимные пользователи могут читать)
CREATE POLICY "Allow anonymous read access" 
    ON public.quizlogic 
    FOR SELECT 
    USING (true);

-- Создание политики доступа для изменения данных (только авторизованные администраторы)
CREATE POLICY "Allow admin full access" 
    ON public.quizlogic 
    USING (auth.role() = 'authenticated' AND auth.email() IN ('admin@example.com'));

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

## Примеры запросов для работы с таблицей

```sql
-- Запрос для получения всех доступных типов практик
SELECT DISTINCT type FROM public.quizlogic;

-- Запрос для получения доступных длительностей для конкретного типа практики
SELECT DISTINCT duration 
FROM public.quizlogic 
WHERE type = 'meditation'
ORDER BY duration ASC;

-- Запрос для получения целей, доступных для выбранного типа практики
SELECT DISTINCT goal 
FROM public.quizlogic 
WHERE type = 'meditation';

-- Запрос для получения практики на основе всех выбранных параметров
SELECT * 
FROM public.quizlogic 
WHERE type = 'meditation' 
AND duration = 10 
AND goal = 'relaxation' 
AND approach = 'guided';

-- Запрос для получения ближайшей по параметрам практики, если точного совпадения нет
SELECT * 
FROM public.quizlogic 
WHERE type = 'meditation' 
ORDER BY 
  CASE WHEN duration = 10 THEN 0 ELSE ABS(duration - 10) END,
  CASE WHEN goal = 'relaxation' THEN 0 ELSE 1 END,
  CASE WHEN approach = 'guided' THEN 0 ELSE 1 END
LIMIT 1;
```

## Примеры данных для заполнения таблицы

```sql
-- Медитативные практики
INSERT INTO public.quizlogic (type, duration, goal, approach, content_type, content_url, title, description)
VALUES
  ('meditation', 5, 'relaxation', 'guided', 'video', 'https://example.com/videos/quick_relaxation.mp4', 'Быстрая релаксация', 'Короткая медитация для быстрого расслабления'),
  ('meditation', 10, 'relaxation', 'guided', 'video', 'https://example.com/videos/guided_relaxation.mp4', 'Медитация для расслабления', 'Медитация с гидом для глубокого расслабления'),
  ('meditation', 15, 'relaxation', 'self-practice', 'audio', 'https://example.com/audio/relaxation_background.mp3', 'Самостоятельная релаксация', 'Фоновая музыка для самостоятельной медитации'),
  ('meditation', 10, 'focus', 'guided', 'video', 'https://example.com/videos/focus_meditation.mp4', 'Медитация для концентрации', 'Улучшение внимания и концентрации'),
  ('meditation', 15, 'focus', 'self-practice', 'audio', 'https://example.com/audio/focus_sound.mp3', 'Практика концентрации', 'Звуковое сопровождение для самостоятельной практики концентрации'),
  ('meditation', 20, 'stress-relief', 'guided', 'video', 'https://example.com/videos/stress_relief.mp4', 'Снятие стресса', 'Медитация для снятия накопленного стресса'),
  ('meditation', 30, 'stress-relief', 'self-practice', 'audio', 'https://example.com/audio/calm_mind.mp3', 'Спокойствие ума', 'Длительная практика для глубокого спокойствия');

-- Дыхательные практики
INSERT INTO public.quizlogic (type, duration, goal, approach, content_type, content_url, title, description)
VALUES
  ('breathing', 5, 'calm', 'guided', 'video', 'https://example.com/videos/quick_breathing.mp4', 'Быстрое дыхание', 'Короткая дыхательная техника для быстрого успокоения'),
  ('breathing', 10, 'calm', 'guided', 'video', 'https://example.com/videos/calm_breathing.mp4', 'Дыхание для спокойствия', 'Дыхательная практика с инструктором'),
  ('breathing', 10, 'energy', 'guided', 'video', 'https://example.com/videos/energy_breathing.mp4', 'Энергетическое дыхание', 'Дыхательная техника для повышения энергии'),
  ('breathing', 15, 'energy', 'self-practice', 'audio', 'https://example.com/audio/energizing_breath.mp3', 'Самостоятельная энергетическая практика', 'Фоновое сопровождение для энергетического дыхания'),
  ('breathing', 10, 'endurance', 'guided', 'video', 'https://example.com/videos/endurance_breathing.mp4', 'Дыхание для выносливости', 'Дыхательные упражнения для повышения выносливости'),
  ('breathing', 15, 'endurance', 'self-practice', 'audio', 'https://example.com/audio/stamina_breath.mp3', 'Практика выносливости', 'Самостоятельная дыхательная практика для выносливости');

-- Телесные практики
INSERT INTO public.quizlogic (type, duration, goal, approach, content_type, content_url, title, description)
VALUES
  ('physical', 10, 'stretching', 'guided', 'video', 'https://example.com/videos/stretching.mp4', 'Растяжка всего тела', 'Гид по растяжке всех групп мышц'),
  ('physical', 15, 'stretching', 'self-practice', 'audio', 'https://example.com/audio/stretch_routine.mp3', 'Самостоятельная растяжка', 'Звуковое сопровождение для самостоятельной растяжки'),
  ('physical', 20, 'strength', 'guided', 'video', 'https://example.com/videos/strength_training.mp4', 'Укрепление мышц', 'Практика для укрепления основных групп мышц'),
  ('physical', 30, 'strength', 'self-practice', 'audio', 'https://example.com/audio/strength_routine.mp3', 'Самостоятельное укрепление', 'Звуковое сопровождение для самостоятельных упражнений'),
  ('physical', 15, 'energy', 'guided', 'video', 'https://example.com/videos/energy_movement.mp4', 'Энергетические движения', 'Практика для повышения энергии через движение'),
  ('physical', 20, 'energy', 'self-practice', 'audio', 'https://example.com/audio/energetic_flow.mp3', 'Энергетический поток', 'Самостоятельная практика для повышения энергии');
``` 