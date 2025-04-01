import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Инициализируем OpenAI API клиент
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Необходимо предоставить массив сообщений' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.8,
      max_tokens: 1500,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса' },
      { status: 500 }
    );
  }
} 