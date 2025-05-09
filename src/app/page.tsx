export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold mb-4">Приложение для практик</h1>
        <p className="mb-6">
          Документация для квиза практик с интеграцией Supabase подготовлена и доступна в репозитории.
        </p>
        <a 
          href="https://github.com/Leogelv/surfw_ivan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Посмотреть репозиторий
        </a>
      </div>
    </main>
  );
}
