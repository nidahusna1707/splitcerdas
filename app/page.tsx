import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-1.5 text-sm text-blue-DEFAULT font-medium mb-6 shadow-sm">
          <span>💸</span> Edisi Syariah v2.0
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          <span className="text-[#185FA5]">Split</span>Cerdas
        </h1>
        <p className="text-xl text-gray-600 mb-2 font-medium">
          Patungan Cerdas, Transparan, dan Berkah
        </p>
        <p className="text-gray-500 mb-8">
          Sistem Informasi Akuntansi patungan & hutang piutang berbasis AI dan prinsip syariah Islam.
          Lengkap dengan Akad Qardh digital, deteksi riba, dan laporan PSAK.
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

      {/* 3 Pilar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
        {[
          {
            icon: '📊',
            title: 'SIA (Akuntansi)',
            color: 'bg-blue-light border-blue-200',
            items: ['Jurnal otomatis', 'Laporan PSAK 59/101', 'Audit trail lengkap', 'Ekspor PDF & Excel'],
          },
          {
            icon: '☪️',
            title: 'Syariah',
            color: 'bg-teal-light border-teal-200',
            items: ['Akad Qardh digital', 'Deteksi riba & gharar', 'Tracker zakat/infaq', 'Laporan kebajikan'],
          },
          {
            icon: '🤖',
            title: 'AI (SplitBot)',
            color: 'bg-green-50 border-green-200',
            items: ['Parsing teks natural', 'Reminder personal', 'Analisis keuangan', 'Panduan syariah'],
          },
        ].map((pilar) => (
          <div key={pilar.title} className={`${pilar.color} border rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{pilar.icon}</div>
            <h3 className="font-bold text-gray-800 mb-3">{pilar.title}</h3>
            <ul className="space-y-1">
              {pilar.items.map((item) => (
                <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Keunggulan vs kompetitor */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl w-full shadow-sm mb-8">
        <h2 className="font-bold text-gray-800 mb-4 text-center">Mengapa SplitCerdas?</h2>
        <div className="grid grid-cols-4 gap-2 text-xs text-center">
          {['Fitur', 'SplitCerdas', 'Splitwise', 'Tricount'].map((h) => (
            <div key={h} className="font-semibold text-gray-500 pb-2 border-b">{h}</div>
          ))}
          {[
            ['AI Bahasa Indonesia', '✅', '❌', '❌'],
            ['Akad Qardh Digital', '✅', '❌', '❌'],
            ['Deteksi Riba', '✅', '❌', '❌'],
            ['Tracker Zakat', '✅', '❌', '❌'],
            ['Laporan PSAK', '✅', '❌', '❌'],
          ].map(([fitur, sc, sw, tc]) => (
            <>
              <div key={`f-${fitur}`} className="py-1.5 text-left text-gray-700">{fitur}</div>
              <div key={`sc-${fitur}`} className="py-1.5 text-green-600 font-bold">{sc}</div>
              <div key={`sw-${fitur}`} className="py-1.5 text-red-400">{sw}</div>
              <div key={`tc-${fitur}`} className="py-1.5 text-red-400">{tc}</div>
            </>
          ))}
        </div>
      </div>

      <p className="text-gray-400 text-xs text-center">
        Universitas Tazkia · Mata Kuliah SIA · 2026 · Versi 2.0 Edisi Syariah
      </p>
    </main>
  );
}
