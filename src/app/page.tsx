import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Градиентный фон */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-purple-950 to-black" />
      <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center opacity-20" />
      
      {/* Шапка сайта */}
      <header className="relative z-10 w-full py-6 px-8">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            VIBE CODING
          </h1>
          <nav className="hidden md:flex space-x-8">
            <Link href="#about" className="text-gray-300 hover:text-white transition">
              О курсе
            </Link>
            <Link href="#features" className="text-gray-300 hover:text-white transition">
              Фишки
            </Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition">
              Тарифы
            </Link>
            <Link href="#chat" className="text-gray-300 hover:text-white transition">
              AI Чат
            </Link>
          </nav>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-700/20">
            Записаться
          </button>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex-1 container mx-auto px-4 pt-12">
        {/* Герой-секция */}
        <section className="flex flex-col lg:flex-row items-center justify-between py-16 gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Создавай <span className="text-purple-500">креативный</span> код в атмосфере вайба
            </h2>
            <p className="text-xl text-gray-300 max-w-lg">
              Уникальный курс по программированию, где творчество и технологии создают магию кода в дружеской и вдохновляющей атмосфере.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-700/30 text-lg">
                Начать обучение
              </button>
              <button className="px-8 py-3 bg-transparent border border-purple-500 text-white rounded-full font-medium hover:bg-purple-900/20 transition text-lg">
                Подробнее
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 h-[70vh] bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            {/* В Server Component нельзя использовать динамический импорт с ssr: false */}
            {/* Вместо него используем iframe, который загрузит клиентский компонент */}
            <div className="w-full h-full overflow-hidden rounded-xl">
              <iframe src="/scene" className="w-full h-full border-0" />
            </div>
          </div>
        </section>

        {/* Секция с AI чатом */}
        <section id="chat" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Задай вопрос нашему AI ассистенту</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Узнай больше о нашем курсе, задай вопросы о программировании или получи персональный план обучения.
            </p>
          </div>
          <div className="w-full h-[500px] overflow-hidden rounded-xl">
            <iframe src="/chat" className="w-full h-full border-0" />
          </div>
        </section>

        {/* Секция особенностей курса */}
        <section id="features" className="py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Особенности нашего курса</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Что делает наш подход к обучению программированию уникальным.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Карточка фичи 1 */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Креативная атмосфера</h3>
              <p className="text-gray-300">
                Учимся в дружественной среде, где каждая идея ценится, а ошибки становятся частью процесса обучения.
              </p>
            </div>
            
            {/* Карточка фичи 2 */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Проекты с душой</h3>
              <p className="text-gray-300">
                Создаём не просто функциональный код, а проекты с характером, отражающие вашу индивидуальность.
              </p>
            </div>
            
            {/* Карточка фичи 3 */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Сообщество вайбера</h3>
              <p className="text-gray-300">
                Становитесь частью сообщества единомышленников, которые помогают друг другу и вдохновляют на новые идеи.
              </p>
            </div>
          </div>
        </section>
      </div>
      
      {/* Футер */}
      <footer className="bg-black/30 backdrop-blur-sm py-12 border-t border-purple-500/20 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-2">VIBE CODING</h2>
              <p className="text-gray-400">Творческий подход к программированию</p>
            </div>
            <div className="flex space-x-8">
              <Link href="#" className="text-gray-400 hover:text-white transition">Instagram</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition">Twitter</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition">GitHub</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition">Discord</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500">© 2024 Vibe Coding. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
