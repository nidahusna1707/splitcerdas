import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
          <span className="text-[#185FA5]">Split</span>Cerdas
        </h1>
        <p className="text-xl text-gray-600 mb-2 font-medium">
          Patungan Cerdas, Transparan, dan Berkah
        </p>
        <p className="text-gray-400 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
          Kelola patungan & hutang piutang bersama teman — halal, adil, dan mudah untuk semua orang.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/register"
            className="bg-[#185FA5] hover:bg-[#0C447C] text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg"
          >
            Mulai Gratis →
          </Link>
          <Link
            href="/auth/login"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3 rounded-xl border border-gray-200 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mt-16">
        {[
          {
            icon: '⚖️',
            title: 'Split Otomatis',
            desc: 'Bagi tagihan rata atau tidak rata. Rekap hutang tiap anggota langsung terhitung.',
          },
          {
            icon: '☽',
            title: 'Syariah Valid',
            desc: 'Deteksi riba otomatis dan akad Qardh digital terintegrasi.',
          },
          {
            icon: '🤖',
            title: 'SplitBot AI',
            desc: 'Tanya pakai bahasa sehari-hari. AI bantu analisis & saran syariah.',
          },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-5 text-left shadow-sm">
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="font-bold text-gray-800 mb-1">{f.title}</div>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-gray-300 text-xs text-center mt-12">
        Universitas Tazkia · SIA · 2026
      </p>
    </main>
  );
}
