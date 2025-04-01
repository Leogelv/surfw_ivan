import { useState, useEffect, useRef } from 'react';
import 'regenerator-runtime/runtime';
// @ts-ignore - пока нет типов для этой библиотеки
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я твой AI-помощник по вайб кодингу. Как я могу помочь тебе с твоим творческим кодинг-путешествием?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Голосовой ввод
  const { 
    transcript, 
    listening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition();
  
  // Обновляем ввод, когда распознается речь
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Функция для включения/выключения микрофона
  const toggleMicrophone = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'ru-RU' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Останавливаем распознавание, если оно активно
    if (listening) {
      SpeechRecognition.stopListening();
    }

    // Добавляем сообщение пользователя
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      // Формируем историю сообщений для API
      const chatMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Отправляем запрос к нашему API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обращении к API');
      }

      const data = await response.json();

      // Добавляем ответ ассистента
      if (data.choices && data.choices[0]?.message?.content) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.choices[0].message.content || '' }
        ]);
      }
    } catch (error) {
      console.error('Ошибка при обращении к API:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[700px] bg-black/20 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-purple-500/20">
      <div className="p-4 bg-purple-900/40 border-b border-purple-500/30">
        <h2 className="text-2xl font-bold text-white">AI Vibe Code Чат</h2>
        <p className="text-gray-300 text-sm">Задай вопрос голосом или текстом</p>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-black/30">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-6 ${
              message.role === 'user' 
                ? 'ml-auto bg-purple-600 text-white' 
                : 'mr-auto bg-gray-800 text-gray-100'
            } rounded-xl p-4 max-w-[85%] shadow-md`}
          >
            <div className="text-sm opacity-75 mb-1">
              {message.role === 'user' ? 'Ты' : 'AI ассистент'}
            </div>
            <div className="text-base">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto bg-gray-800 text-gray-100 rounded-xl p-4 max-w-[85%] shadow-md">
            <div className="text-sm opacity-75 mb-1">AI ассистент</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 bg-black/50 border-t border-purple-500/30">
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спроси что-нибудь о вайб кодинге..."
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleMicrophone}
              disabled={!browserSupportsSpeechRecognition || isLoading}
              className={`p-3 rounded-lg ${listening ? 'bg-red-600' : 'bg-purple-600'} text-white hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50`}
            >
              {listening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              )}
            </button>
          </div>
          
          {listening && (
            <div className="bg-gray-800 p-3 rounded-lg border border-purple-500/50 text-sm text-gray-300">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Слушаю...</span>
              </div>
              <div className="italic">{transcript}</div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full p-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent; 