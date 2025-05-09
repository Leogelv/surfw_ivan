# Структура компонентов квиза и плеера

## Общая структура файлов компонентов

```
src/
├── components/
│   ├── Quiz/
│   │   ├── QuizScreen.tsx           # Основной контейнер для квиза
│   │   ├── ChoosePracticeScreen.tsx # Экран выбора типа практики
│   │   ├── PracticeTimeScreen.tsx   # Экран выбора длительности
│   │   ├── PracticeGoalScreen.tsx   # Экран выбора цели
│   │   ├── PracticeApproachScreen.tsx # Экран выбора подхода
│   │   ├── ResultScreen.tsx         # Экран с результатом подбора
│   │   ├── ui/                      # UI компоненты для квиза
│   │   │   ├── OptionCard.tsx       # Карточка с опцией выбора
│   │   │   ├── ProgressIndicator.tsx # Индикатор прогресса квиза
│   │   │   ├── NavigationButtons.tsx # Кнопки навигации (Назад/Далее)
│   │   │   └── TimeSelector.tsx     # Селектор времени практики
│   │   └── hooks/                   # Хуки для квиза
│   │       ├── useQuizNavigation.ts # Хук для навигации по квизу
│   │       └── useQuizOptions.ts    # Хук для загрузки опций квиза
│   ├── Player/
│   │   ├── Player.tsx               # Универсальный плеер
│   │   ├── MeditationMode.tsx       # Режим медитации
│   │   ├── VideoMode.tsx            # Режим видео
│   │   ├── ui/                      # UI компоненты для плеера
│   │   │   ├── PlayButton.tsx       # Кнопка воспроизведения
│   │   │   ├── Timer.tsx            # Таймер для медитации
│   │   │   ├── VolumeControl.tsx    # Контроль громкости
│   │   │   ├── ProgressBar.tsx      # Прогресс-бар для видео/аудио
│   │   │   └── FullscreenButton.tsx # Кнопка полноэкранного режима
│   │   └── hooks/                   # Хуки для плеера
│   │       ├── usePlayerControls.ts # Хук для управления плеером
│   │       ├── useTimer.ts          # Хук для работы с таймером
│   │       └── useAudioPlayer.ts    # Хук для управления аудио
├── context/
│   ├── QuizContext.tsx              # Контекст для состояния квиза
│   └── PlayerContext.tsx            # Контекст для управления плеером
└── lib/
    ├── supabase.ts                  # Клиент Supabase
    ├── types.ts                     # Типы данных
    └── utils.ts                     # Вспомогательные функции
```

## Детали компонентов квиза

### QuizScreen
Основной контейнер для квиза, управляет навигацией между экранами.

```tsx
// QuizScreen.tsx
import { useState } from 'react';
import { useQuizContext } from '@/context/QuizContext';
import ChoosePracticeScreen from './ChoosePracticeScreen';
import PracticeTimeScreen from './PracticeTimeScreen';
import PracticeGoalScreen from './PracticeGoalScreen';
import PracticeApproachScreen from './PracticeApproachScreen';
import ResultScreen from './ResultScreen';
import ProgressIndicator from './ui/ProgressIndicator';

const QuizScreen = () => {
  const { currentStep, setCurrentStep } = useQuizContext();
  
  // Отображение экрана в зависимости от текущего шага
  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 1:
        return <ChoosePracticeScreen />;
      case 2:
        return <PracticeTimeScreen />;
      case 3:
        return <PracticeGoalScreen />;
      case 4:
        return <PracticeApproachScreen />;
      case 5:
        return <ResultScreen />;
      default:
        return <ChoosePracticeScreen />;
    }
  };
  
  return (
    <div className="quiz-container">
      <ProgressIndicator currentStep={currentStep} totalSteps={5} />
      {renderCurrentScreen()}
    </div>
  );
};

export default QuizScreen;
```

### Экраны выбора опций
Каждый экран квиза отвечает за выбор одного параметра и обновление контекста.

```tsx
// ChoosePracticeScreen.tsx (пример)
import { useEffect, useState } from 'react';
import { useQuizContext } from '@/context/QuizContext';
import { supabase } from '@/lib/supabase';
import OptionCard from './ui/OptionCard';
import NavigationButtons from './ui/NavigationButtons';

const ChoosePracticeScreen = () => {
  const { quizState, updateQuizState, goToNextStep } = useQuizContext();
  const [practiceTypes, setPracticeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Загрузка типов практик из Supabase
  useEffect(() => {
    const fetchPracticeTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizlogic')
          .select('type')
          .distinct();
          
        if (error) throw error;
        
        setPracticeTypes(data.map(item => item.type));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching practice types:', error);
        setLoading(false);
      }
    };
    
    fetchPracticeTypes();
  }, []);
  
  // Обработчик выбора типа практики
  const handleSelectType = (type) => {
    updateQuizState({ type });
  };
  
  return (
    <div className="practice-screen">
      <h2>Выберите тип практики</h2>
      
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="options-grid">
          {practiceTypes.map((type) => (
            <OptionCard
              key={type}
              title={type === 'meditation' ? 'Медитативная' : type === 'breathing' ? 'Дыхательная' : 'Телесная'}
              description={getDescriptionForType(type)}
              isSelected={quizState.type === type}
              onSelect={() => handleSelectType(type)}
            />
          ))}
        </div>
      )}
      
      <NavigationButtons
        onNext={goToNextStep}
        disableNext={!quizState.type}
        showBack={false}
      />
    </div>
  );
};

// Вспомогательная функция для получения описания типа практики
const getDescriptionForType = (type) => {
  switch (type) {
    case 'meditation':
      return 'Медитативные практики для успокоения ума';
    case 'breathing':
      return 'Дыхательные техники для контроля эмоций';
    case 'physical':
      return 'Телесные практики для укрепления тела';
    default:
      return '';
  }
};

export default ChoosePracticeScreen;
```

## Детали компонентов плеера

### Универсальный плеер
Основной компонент плеера, который отображает нужный режим в зависимости от типа контента.

```tsx
// Player.tsx
import { useEffect } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import { useQuizContext } from '@/context/QuizContext';
import MeditationMode from './MeditationMode';
import VideoMode from './VideoMode';
import PlayButton from './ui/PlayButton';
import VolumeControl from './ui/VolumeControl';

const Player = () => {
  const { selectedPractice } = useQuizContext();
  const { 
    isPlaying, 
    setIsPlaying, 
    volume, 
    setVolume,
    contentLoaded,
    setContentLoaded
  } = usePlayerContext();
  
  useEffect(() => {
    if (selectedPractice) {
      // Инициализация плеера с выбранной практикой
      setContentLoaded(true);
    }
  }, [selectedPractice, setContentLoaded]);
  
  if (!selectedPractice || !contentLoaded) {
    return <div>Загрузка практики...</div>;
  }
  
  // Определяем режим отображения в зависимости от типа контента
  const renderPlayerMode = () => {
    switch (selectedPractice.content_type) {
      case 'video':
        return <VideoMode url={selectedPractice.content_url} />;
      case 'audio':
        return <MeditationMode duration={selectedPractice.duration} audioUrl={selectedPractice.content_url} />;
      default:
        return <MeditationMode duration={selectedPractice.duration} />;
    }
  };
  
  return (
    <div className="player-container">
      <h2>{selectedPractice.title}</h2>
      <p>{selectedPractice.description}</p>
      
      <div className="player-content">
        {renderPlayerMode()}
      </div>
      
      <div className="controls">
        <PlayButton isPlaying={isPlaying} onClick={() => setIsPlaying(!isPlaying)} />
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
    </div>
  );
};

export default Player;
```

### Режим медитации
Компонент для отображения таймера и управления медитативной практикой.

```tsx
// MeditationMode.tsx
import { useEffect, useState } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import Timer from './ui/Timer';

const MeditationMode = ({ duration, audioUrl }) => {
  const { isPlaying, volume } = usePlayerContext();
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // в секундах
  const [audio, setAudio] = useState(null);
  
  // Инициализация аудио
  useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioElement.loop = true;
      audioElement.volume = volume;
      setAudio(audioElement);
      
      return () => {
        audioElement.pause();
        audioElement.src = '';
      };
    }
  }, [audioUrl, volume]);
  
  // Управление воспроизведением аудио
  useEffect(() => {
    if (audio) {
      if (isPlaying) {
        audio.play().catch(e => console.error('Error playing audio:', e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, audio]);
  
  // Управление таймером
  useEffect(() => {
    let interval;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Практика завершена
      if (audio) {
        audio.pause();
      }
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, audio]);
  
  // Форматирование времени
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <div className="meditation-mode">
      <Timer 
        timeRemaining={timeRemaining} 
        totalTime={duration * 60} 
        formattedTime={formatTime(timeRemaining)} 
      />
      
      <div className="meditation-message">
        {timeRemaining > 0 ? (
          <p>Сосредоточьтесь на своем дыхании...</p>
        ) : (
          <p>Практика завершена</p>
        )}
      </div>
    </div>
  );
};

export default MeditationMode;
```

### Режим видео
Компонент для отображения видео-контента и управления видео-плеером.

```tsx
// VideoMode.tsx
import { useRef, useEffect } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import ProgressBar from './ui/ProgressBar';
import FullscreenButton from './ui/FullscreenButton';

const VideoMode = ({ url }) => {
  const { isPlaying, volume, setCurrentTime, duration, setDuration } = usePlayerContext();
  const videoRef = useRef(null);
  
  // Синхронизация состояния плеера с видео
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error('Error playing video:', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  // Обновление громкости
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);
  
  // Обработчики событий видео
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  // Переключение в полноэкранный режим
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };
  
  return (
    <div className="video-mode">
      <div className="video-container">
        <video
          ref={videoRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={() => toggleFullscreen()}
        />
        
        <ProgressBar />
        <FullscreenButton onClick={toggleFullscreen} />
      </div>
      
      <div className="video-info">
        <p>Следуйте инструкциям в видео для выполнения практики</p>
      </div>
    </div>
  );
};

export default VideoMode;
```

## Контексты приложения

### QuizContext
Контекст для хранения состояния квиза и управления процессом выбора практики.

```tsx
// QuizContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Начальное состояние квиза
const initialQuizState = {
  type: '',
  duration: 0,
  goal: '',
  approach: '',
  selectedPractice: null
};

const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  const [quizState, setQuizState] = useState(() => {
    // Попытка восстановить состояние из localStorage
    const savedState = localStorage.getItem('quizState');
    return savedState ? JSON.parse(savedState) : initialQuizState;
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Сохранение состояния в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('quizState', JSON.stringify(quizState));
  }, [quizState]);
  
  // Обновление состояния квиза
  const updateQuizState = (newState) => {
    setQuizState(prev => ({ ...prev, ...newState }));
  };
  
  // Навигация по шагам квиза
  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Сброс квиза
  const resetQuiz = () => {
    setQuizState(initialQuizState);
    setCurrentStep(1);
  };
  
  // Поиск подходящей практики
  const findPractice = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('quizlogic')
        .select('*')
        .eq('type', quizState.type)
        .eq('duration', quizState.duration)
        .eq('goal', quizState.goal)
        .eq('approach', quizState.approach);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Выбор случайной практики из подходящих
        const randomIndex = Math.floor(Math.random() * data.length);
        updateQuizState({ selectedPractice: data[randomIndex] });
      } else {
        // Если точного совпадения нет, ищем ближайшее
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('quizlogic')
          .select('*')
          .eq('type', quizState.type)
          .order('duration', { ascending: Math.abs(quizState.duration - 10) > Math.abs(quizState.duration - 20) });
          
        if (fallbackError) throw fallbackError;
        
        if (fallbackData && fallbackData.length > 0) {
          updateQuizState({ selectedPractice: fallbackData[0] });
        }
      }
    } catch (error) {
      console.error('Error finding practice:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    quizState,
    updateQuizState,
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    resetQuiz,
    findPractice,
    loading,
    selectedPractice: quizState.selectedPractice
  };
  
  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
};
```

### PlayerContext
Контекст для управления плеером в различных режимах.

```tsx
// PlayerContext.tsx
import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Переключение воспроизведения
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };
  
  // Перемотка к определенному времени
  const seekTo = (time) => {
    setCurrentTime(time);
  };
  
  // Форматирование времени для отображения
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const value = {
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    togglePlay,
    seekTo,
    formatTime,
    contentLoaded,
    setContentLoaded
  };
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
``` 