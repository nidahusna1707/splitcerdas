import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, konteksGrup } = await req.json();

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Kamu adalah SplitBot, asisten AI untuk aplikasi SplitCerdas — aplikasi patungan berbasis syariah Islam.
      
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
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : 'Maaf, tidak bisa memproses.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('SplitBot error:', error);
    return NextResponse.json({ reply: 'Maaf, SplitBot sedang bermasalah. Coba lagi nanti.' }, { status: 500 });
  }
}
