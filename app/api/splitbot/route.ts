import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, konteksGrup } = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `Kamu adalah SplitBot, asisten AI untuk aplikasi SplitCerdas — aplikasi patungan berbasis syariah Islam.

Tugasmu:
- Bantu pengguna menganalisis pengeluaran dan hutang piutang grup
- Berikan saran pembagian yang adil dan sesuai prinsip syariah
- Jelaskan prinsip Qardh (pinjaman tanpa bunga) secara sederhana
- Deteksi dan ingatkan jika ada potensi riba
- Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami
- Gunakan emoji secukupnya agar lebih menarik

Konteks grup saat ini:
${konteksGrup}

Jawab dengan singkat dan to the point (maks 3-4 kalimat kecuali diminta detail).`,
          },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'Maaf, tidak bisa memproses.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('SplitBot error:', error);
    return NextResponse.json({ reply: 'Maaf, SplitBot sedang bermasalah. Coba lagi nanti.' }, { status: 500 });
  }
}
