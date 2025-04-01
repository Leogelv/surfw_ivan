'use client';

// Используем динамический импорт с noSSR
import dynamic from 'next/dynamic';

// Импортируем сцену с отключенным SSR
const DynamicScene = dynamic(() => import('@/components/3D/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-950 to-black">
      <div className="text-purple-400 text-xl">Загрузка 3D сцены...</div>
    </div>
  )
});

export default function ScenePage() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-black via-purple-950 to-black">
      <DynamicScene />
    </div>
  );
} 