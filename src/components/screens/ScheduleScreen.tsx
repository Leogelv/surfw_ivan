'use client';

import React, { useState, useEffect } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import logger from '@/lib/logger';
import Link from 'next/link';

// Простой компонент календаря (можно заменить на библиотечный)
const Calendar = ({ onDateSelect }: { onDateSelect: (date: Date) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const numDays = daysInMonth(currentYear, currentMonth);
  let firstDay = firstDayOfMonth(currentYear, currentMonth);
  firstDay = firstDay === 0 ? 6 : firstDay -1; // Сдвиг, чтобы неделя начиналась с Пн


  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-start-${i}`} className="w-10 h-10"></div>);
  }
  for (let day = 1; day <= numDays; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isToday = new Date().toDateString() === date.toDateString();
    // TODO: Добавить точки для дней с событиями
    const hasEvent = [7, 12, 22, 23, 27].includes(day); // Моковые дни с событиями

    calendarDays.push(
      <button 
        key={day} 
        className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-colors 
                    ${isSelected ? 'bg-blue-500 text-white' : (isToday ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100')}`}
        onClick={() => {
          setSelectedDate(date);
          onDateSelect(date);
        }}
      >
        {day}
        {hasEvent && !isSelected && <span className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"></span>}
        {hasEvent && isSelected && <span className="w-1 h-1 bg-white rounded-full mt-0.5"></span>}
      </button>
    );
  }
  // Дополняем пустыми ячейками до конца сетки (6 недель * 7 дней)
  const totalCells = 42; // 6 недель для отображения
  let remainingCells = totalCells - calendarDays.length;
  // Иногда может понадобиться меньше ячеек, если месяц короткий и начинается в конце недели
  // Убедимся, что remainingCells не отрицательное и соответствует оставшимся ячейкам в текущей строке
  const cellsInLastRow = (firstDay + numDays) % 7;
  if (cellsInLastRow !== 0) {
      remainingCells = 7 - cellsInLastRow;
  } else {
      remainingCells = 0; // Если последняя строка полная
  }
  if (calendarDays.length + remainingCells < totalCells && calendarDays.length > 35) remainingCells +=7; // если 5 строк, добить до 6

  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push(<div key={`empty-end-${i}`} className="w-10 h-10"></div>);
  }


  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-md hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <h3 className="font-semibold text-lg">{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} className="p-2 rounded-md hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {dayNames.map((day, index) => <div key={index} className={`font-medium text-gray-500 ${index >=5 ? 'text-pink-500' : ''}`}>{day.slice(0,2)}</div>).slice(1).concat(dayNames.map((day, index) => <div key={index} className={`font-medium text-gray-500 ${index >=5 ? 'text-pink-500' : ''}`}>{day.slice(0,2)}</div>)[0])}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>
    </div>
  );
};

// Моковые данные для событий
const mockEvents = [
  { date: '2024-11-07', title: 'Телесная практика с Юлией', time: '08:00', type: 'Эфир' },
  { date: '2024-11-12', title: 'Онлайн-разбор фильма с психологом', time: '18:00', type: 'Эфир' },
  { date: '2024-11-22', title: 'Медитация на закате', time: '17:30', type: 'Эфир' },
];

const ScheduleScreen = () => {
  const { webApp, telegramHeaderPadding, isFullScreenEnabled } = useTelegram();
  const screenLogger = logger.createLogger('ScheduleScreen');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<typeof mockEvents>([]);

  useEffect(() => {
    screenLogger.info('Расписание открыто');
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        screenLogger.info('Нажата кнопка Назад в Расписании');
        // Нужна навигация назад
      });
    }
    return () => {
      if (webApp) {
        webApp.BackButton.offClick();
        webApp.BackButton.hide();
      }
    };
  }, [webApp, screenLogger]);

  useEffect(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const filteredEvents = mockEvents.filter(event => event.date === dateString);
    setEventsForSelectedDate(filteredEvents);
    screenLogger.info(`Выбрана дата: ${dateString}, найдено событий: ${filteredEvents.length}`);
  }, [selectedDate, screenLogger]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div 
      className="flex flex-col min-h-screen bg-white font-['Inter',_sans-serif] text-gray-800"
      style={{ paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
    >
      <header 
        className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between"
        style={{ marginTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
      >
        <Link href="/" className="p-2 rounded-lg hover:bg-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </Link>
        <h1 className="text-lg font-semibold">Расписание</h1>
        <button className="p-2 rounded-lg hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 12a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
        </button>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Calendar onDateSelect={handleDateSelect} />

        {eventsForSelectedDate.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {formatDateForDisplay(selectedDate)}
            </h3>
            <div className="space-y-3">
              {eventsForSelectedDate.map((event, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl shadow flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div> {/* Placeholder for image */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">МСК</div>
                    <div className="text-lg font-semibold text-gray-900">{event.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">На {formatDateForDisplay(selectedDate)} событий нет.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScheduleScreen; 