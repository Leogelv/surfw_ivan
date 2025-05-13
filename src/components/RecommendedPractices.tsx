'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Компонент для отображения рекомендуемых практик и кнопки выбора практик
 */
const RecommendedPractices: React.FC = () => {
  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Рекомендованные практики</h3>
        <div className="space-y-3">
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center">
            <div className="mr-4 bg-indigo-100 rounded-full p-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-indigo-900">Утренняя практика</h4>
              <p className="text-sm text-indigo-700">15 минут · Начальный уровень</p>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 flex items-center">
            <div className="mr-4 bg-purple-100 rounded-full p-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 8H5C3.93913 8 2.92172 8.42143 2.17157 9.17157C1.42143 9.92172 1 10.9391 1 12C1 13.0609 1.42143 14.0783 2.17157 14.8284C2.92172 15.5786 3.93913 16 5 16H6" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 8L14 8C15.0609 8 16.0783 8.42143 16.8284 9.17157C17.5786 9.92172 18 10.9391 18 12C18 13.0609 17.5786 14.0783 16.8284 14.8284C16.0783 15.5786 15.0609 16 14 16L6 16C4.93913 16 3.92172 15.5786 3.17157 14.8284C2.42143 14.0783 2 13.0609 2 12C2 10.9391 2.42143 9.92172 3.17157 9.17157C3.92172 8.42143 4.93913 8 6 8V8Z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-purple-900">Для гибкости</h4>
              <p className="text-sm text-purple-700">20 минут · Средний уровень</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Кнопка "Выбрать практику" */}
      <Link href="/practice">
        <div className="mx-2 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-4 flex justify-between items-center text-white shadow-md">
          <span className="text-lg font-medium">Выбрать практику</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.33334 5.83334L12.5 10L8.33334 14.1667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>
    </>
  );
};

export default RecommendedPractices; 