'use client';

import ChatComponent from '@/components/Chat/ChatComponent';

export default function ChatPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        Общайся с <span className="text-purple-400">AI Ассистентом</span> Vibe Coding
      </h1>
      <div className="w-full max-w-4xl">
        <ChatComponent />
      </div>
    </div>
  );
} 