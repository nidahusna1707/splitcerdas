import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, konteksGrup } = body;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah SplitBot, asisten AI untuk aplikasi SplitCerdas. Jawab dalam Bahasa Indonesia yang ramah. Gunakan emoji secukupnya.\n\nKonteks grup:\n${konteksGrup || 'Tidak ada konteks'}`,
          },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq error:', errText);
      return NextResponse.json({ reply: 'Maaf, SplitBot sedang bermasalah.' }, { status: 500 });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Maaf, tidak ada respons.';
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('SplitBot error:', error);
    return NextResponse.json({ reply: 'Maaf, terjadi kesalahan.' }, { status: 500 });
  }
}