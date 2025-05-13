'use client';

import React from 'react';

interface StatisticsCardProps {
  statsLoading: boolean;
  stats: {
    totalMinutes?: number;
    sessionsCompleted?: number;
    streak?: number;
    level?: number;
  } | null;
}

/**
 * Карточка статистики пользователя
 */
const StatisticsCard: React.FC<StatisticsCardProps> = ({ statsLoading, stats }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl px-6 py-5 text-white mb-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ваша практика</h2>
        <div className="bg-white bg-opacity-20 rounded-full py-1 px-3">
          <span className="text-sm font-medium">{statsLoading ? '...' : (stats?.totalMinutes || 0)} мин</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold">{statsLoading ? '...' : (stats?.sessionsCompleted || 0)}</div>
          <div className="text-xs opacity-80">Занятий</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{statsLoading ? '...' : (stats?.streak || 0)}</div>
          <div className="text-xs opacity-80">Дней подряд</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{statsLoading ? '...' : (stats?.level || 1)}</div>
          <div className="text-xs opacity-80">Уровень</div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard; 