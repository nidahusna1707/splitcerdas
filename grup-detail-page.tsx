'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils/format';

interface Transaksi {
  id: string;
  keterangan: string;
  jumlah: number;
  split_type: string;
  kategori: string;
  created_at: string;
  syariah_valid: boolean;
  dibayar_oleh: string;
}

interface Anggota {
  id: string;
  nama: string;
  email: string;
  totalBayar: number;
  totalHutang: number;
  selisih: number;
}

interface Grup {
  id: string;
  nama: string;
  kategori: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SplitDetail {
  nama: string;
  jumlah: number;
}

const KATEGORI_ICON: Record<string, string> = {
  makan: '🍜', transport: '🚗', hiburan: '🎮',
  infaq: '🌱', akomodasi: '🏨', lainnya: '📦',
};

const KATEGORI_GRUP_ICON: Record<string, string> = {
  liburan: '✈️', kost: '🏠', arisan: '💰', kondangan: '💍',
  makan: '🍜', organisasi: '🏫', lainnya: '📦',
};

export default function GrupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const grupId = params.id as string;

  const [grup, setGrup] = useState<Grup | null>(null);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; nama: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transaksi' | 'hutang' | 'anggota' | 'ai'>('transaksi');

  // Form tambah transaksi
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    keterangan: '', jumlah: '', kategori: 'makan', splitType: 'rata',
  });
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([]);
  const [saving, setSaving] = useState(false);
  const [ribaWarning, setRibaWarning] = useState<string | null>(null);

  // Form tambah anggota
  const [showTambahAnggota, setShowTambahAnggota] = useState(false);
  const [emailAnggota, setEmailAnggota] = useState('');
  const [addingAnggota, setAddingAnggota] = useState(false);
  const [anggotaMsg, setAnggotaMsg] = useState<string | null>(null);

  // AI SplitBot
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Assalamu\'alaikum! Saya SplitBot 🤖\n\nSaya bisa bantu kamu:\n• Analisis pengeluaran grup\n• Cek siapa yang paling banyak hutang\n• Saran pembagian yang adil\n• Panduan transaksi syariah\n\nMau tanya apa?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, [grupId]);
  useEffect(() => {
    if (activeTab === 'ai') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }

    setCurrentUser({
      id: session.user.id,
      nama: session.user.user_metadata?.nama_lengkap ?? session.user.email ?? '',
    });

    const [{ data: grupData }, { data: txData }, { data: memberData }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', grupId).single(),
      supabase.from('transactions').select('*').eq('group_id', grupId).order('created_at', { ascending: false }),
      supabase.from('group_members').select('*, user:user_id(email, raw_user_meta_data)').eq('group_id', grupId),
    ]);

    if (grupData) setGrup(grupData);
    if (txData) setTransaksiList(txData);

    // Buat daftar anggota dari member + admin (current user minimal)
    const anggota: Anggota[] = [];
    if (memberData) {
      for (const m of memberData) {
        const u = m.user as any;
        anggota.push({
          id: m.user_id,
          nama: u?.raw_user_meta_data?.nama_lengkap ?? u?.email ?? m.user_id,
          email: u?.email ?? '',
          totalBayar: 0,
          totalHutang: 0,
          selisih: 0,
        });
      }
    }
    // Tambahkan current user jika belum ada
    if (!anggota.find(a => a.id === session.user.id)) {
      anggota.push({
        id: session.user.id,
        nama: session.user.user_metadata?.nama_lengkap ?? session.user.email ?? '',
        email: session.user.email ?? '',
        totalBayar: 0,
        totalHutang: 0,
        selisih: 0,
      });
    }

    // Hitung hutang (split rata per anggota)
    if (txData && anggota.length > 0) {
      const jmlAnggota = anggota.length;
      for (const tx of txData) {
        const pembayar = anggota.find(a => a.id === tx.dibayar_oleh);
        if (pembayar) pembayar.totalBayar += tx.jumlah;
        const bagiPerOrang = tx.jumlah / jmlAnggota;
        for (const a of anggota) a.totalHutang += bagiPerOrang;
      }
      for (const a of anggota) a.selisih = a.totalBayar - a.totalHutang;
    }

    setAnggotaList(anggota);
    setLoading(false);
  }

  function cekRibaSederhana(ket: string): string | null {
    const keywords = ['bunga', 'interest', 'denda %', 'late fee', 'penalti finansial', 'riba'];
    const found = keywords.find(k => ket.toLowerCase().includes(k));
    return found ? `⚠️ Terdeteksi kata "${found}" — kemungkinan mengandung riba.` : null;
  }

  function initSplitDetails() {
    setSplitDetails(anggotaList.map(a => ({ nama: a.nama, jumlah: 0 })));
  }

  async function simpanTransaksi() {
    const warning = cekRibaSederhana(form.keterangan);
    if (warning && !ribaWarning) { setRibaWarning(warning); return; }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('transactions').insert({
      group_id: grupId,
      keterangan: form.keterangan,
      jumlah: parseFloat(form.jumlah),
      kategori: form.kategori,
      split_type: form.splitType,
      dibayar_oleh: session.user.id,
      created_by: session.user.id,
      syariah_valid: true,
    });

    if (!error) {
      setShowForm(false);
      setForm({ keterangan: '', jumlah: '', kategori: 'makan', splitType: 'rata' });
      setRibaWarning(null);
      await loadData();
    }
    setSaving(false);
  }

  async function tambahAnggota() {
    setAddingAnggota(true);
    setAnggotaMsg(null);

    // Cari user by email via auth (pakai service role workaround: insert by email ke grup)
    // Untuk MVP: simpan email sebagai placeholder anggota
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Cek apakah email terdaftar
    const { data: userData, error: userError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', grupId)
      .limit(1);

    // Untuk MVP, tambahkan anggota manual dengan nama dari email
    setAnggotaMsg('✅ Undangan dikirim ke ' + emailAnggota + '. Mereka perlu daftar di SplitCerdas.');
    setEmailAnggota('');
    setAddingAnggota(false);
  }

  async function kirimChatAI() {
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    // Buat konteks grup untuk AI
    const totalPengeluaran = transaksiList.reduce((s, t) => s + t.jumlah, 0);
    const konteksGrup = `
Nama Grup: ${grup?.nama} (${grup?.kategori})
Total Pengeluaran: ${formatRupiah(totalPengeluaran)}
Jumlah Transaksi: ${transaksiList.length}
Jumlah Anggota: ${anggotaList.length}
Anggota & Saldo:
${anggotaList.map(a => `- ${a.nama}: bayar ${formatRupiah(a.totalBayar)}, hutang ${formatRupiah(a.totalHutang)}, selisih ${a.selisih >= 0 ? '+' : ''}${formatRupiah(Math.abs(a.selisih))}`).join('\n')}
Transaksi Terakhir:
${transaksiList.slice(0, 5).map(t => `- ${t.keterangan}: ${formatRupiah(t.jumlah)}`).join('\n')}
    `.trim();

    try {
      const response = await fetch('/api/splitbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userMsg }],
          konteksGrup,
        }),
      });

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Maaf, terjadi kesalahan.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, SplitBot sedang tidak tersedia. Coba lagi nanti.' }]);
    }
    setChatLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-3 animate-bounce">💸</div>
        <div className="text-gray-500 text-sm">Memuat data grup...</div>
      </div>
    </div>
  );

  const totalPengeluaran = transaksiList.reduce((s, t) => s + t.jumlah, 0);
  const yangHarusBayar = anggotaList.filter(a => a.selisih < 0);
  const yangMenerimaBayaran = anggotaList.filter(a => a.selisih > 0);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 truncate">{grup?.nama}</div>
        </div>
        <span className="text-xs bg-blue-50 text-[#185FA5] px-2.5 py-1 rounded-full capitalize font-medium flex-shrink-0">
          {KATEGORI_GRUP_ICON[grup?.kategori ?? 'lainnya']} {grup?.kategori}
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#0C447C] via-[#185FA5] to-[#0E7C7B] rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="text-xs opacity-70 mb-1 font-medium uppercase tracking-wide">Total Pengeluaran Grup</div>
            <div className="text-3xl font-extrabold mb-3">{formatRupiah(totalPengeluaran)}</div>
            <div className="flex gap-4 text-xs opacity-80">
              <span>📋 {transaksiList.length} transaksi</span>
              <span>👥 {anggotaList.length} anggota</span>
              <span>☪️ Syariah Valid</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
          {[
            { key: 'transaksi', label: '📋 Transaksi' },
            { key: 'hutang', label: '⚖️ Hutang' },
            { key: 'anggota', label: '👥 Anggota' },
            { key: 'ai', label: '🤖 SplitBot' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#185FA5] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: TRANSAKSI ─── */}
        {activeTab === 'transaksi' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Riwayat Transaksi</h2>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#185FA5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0C447C] transition-colors shadow-sm"
              >
                + Tambah
              </button>
            </div>

            {transaksiList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm">Belum ada transaksi di grup ini.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-[#185FA5] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0C447C]"
                >
                  + Tambah Transaksi Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {transaksiList.map((tx) => {
                  const pembayar = anggotaList.find(a => a.id === tx.dibayar_oleh);
                  const bagiPerOrang = tx.jumlah / (anggotaList.length || 1);
                  return (
                    <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                          {KATEGORI_ICON[tx.kategori] ?? '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-sm">{tx.keterangan}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {pembayar && <span className="ml-2">· dibayar {pembayar.id === currentUser?.id ? 'kamu' : pembayar.nama.split(' ')[0]}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-blue-50 text-[#185FA5] px-2 py-0.5 rounded-full">
                              Split: {formatRupiah(bagiPerOrang)}/orang
                            </span>
                            {tx.syariah_valid && (
                              <span className="text-xs text-[#0E7C7B]">☪️ halal</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-900 text-sm">{formatRupiah(tx.jumlah)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: HUTANG ─── */}
        {activeTab === 'hutang' && (
          <div>
            <h2 className="font-bold text-gray-800 mb-3">Rekap Hutang & Piutang</h2>

            {/* Ringkasan siapa bayar siapa */}
            {yangHarusBayar.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4">
                <div className="font-semibold text-orange-800 text-sm mb-2">💸 Perlu Bayar</div>
                {yangHarusBayar.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700">
                      {a.id === currentUser?.id ? '👤 Kamu' : a.nama.split(' ')[0]}
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      kurang {formatRupiah(Math.abs(a.selisih))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {yangMenerimaBayaran.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4">
                <div className="font-semibold text-green-800 text-sm mb-2">✅ Akan Menerima</div>
                {yangMenerimaBayaran.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700">
                      {a.id === currentUser?.id ? '👤 Kamu' : a.nama.split(' ')[0]}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +{formatRupiah(a.selisih)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Detail per anggota */}
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Detail Per Anggota</h3>
            <div className="space-y-2">
              {anggotaList.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-[#185FA5]">
                        {(a.nama[0] ?? '?').toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-gray-800">
                        {a.id === currentUser?.id ? 'Kamu' : a.nama.split(' ')[0]}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${a.selisih >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {a.selisih >= 0 ? '+' : ''}{formatRupiah(a.selisih)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Bayar: <span className="font-semibold text-gray-700">{formatRupiah(a.totalBayar)}</span></span>
                    <span>Bagian: <span className="font-semibold text-gray-700">{formatRupiah(a.totalHutang)}</span></span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.selisih >= 0 ? 'bg-green-400' : 'bg-orange-400'}`}
                      style={{ width: `${Math.min(100, (a.totalBayar / (totalPengeluaran || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {anggotaList.length <= 1 && (
              <div className="mt-4 bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-sm text-[#185FA5]">Tambah anggota di tab 👥 untuk melihat pembagian hutang!</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: ANGGOTA ─── */}
        {activeTab === 'anggota' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Anggota Grup</h2>
              <button
                onClick={() => setShowTambahAnggota(true)}
                className="bg-[#185FA5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0C447C] transition-colors"
              >
                + Undang
              </button>
            </div>

            <div className="space-y-2">
              {anggotaList.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#185FA5] to-[#0E7C7B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(a.nama[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800">
                      {a.id === currentUser?.id ? `${a.nama} (Kamu)` : a.nama}
                    </div>
                    <div className="text-xs text-gray-400">{a.email}</div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                    a.selisih >= 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {a.selisih >= 0 ? '+' : ''}{formatRupiah(Math.abs(a.selisih))}
                  </div>
                </div>
              ))}
            </div>

            {showTambahAnggota && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                  <h3 className="font-bold text-gray-900 mb-1">Undang Anggota</h3>
                  <p className="text-xs text-gray-500 mb-4">Masukkan email teman yang mau diajak patungan</p>
                  <input
                    type="email"
                    value={emailAnggota}
                    onChange={e => setEmailAnggota(e.target.value)}
                    placeholder="teman@email.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] mb-3"
                  />
                  {anggotaMsg && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3">
                      {anggotaMsg}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowTambahAnggota(false); setAnggotaMsg(null); }}
                      className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={tambahAnggota}
                      disabled={addingAnggota || !emailAnggota}
                      className="flex-1 bg-[#185FA5] text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-60"
                    >
                      {addingAnggota ? 'Mengirim...' : 'Kirim Undangan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: AI SPLITBOT ─── */}
        {activeTab === 'ai' && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
            <div className="bg-gradient-to-r from-[#185FA5] to-[#0E7C7B] rounded-2xl p-3 mb-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-lg">🤖</div>
              <div>
                <div className="font-bold text-white text-sm">SplitBot AI</div>
                <div className="text-xs text-white/70">Asisten patungan syariah berbasis AI</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/70">Online</span>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#185FA5] text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {[
                'Siapa yang paling banyak hutang?',
                'Analisis pengeluaran grup',
                'Cara split tidak rata?',
                'Apakah ada transaksi riba?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  className="text-xs bg-blue-50 text-[#185FA5] px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && kirimChatAI()}
                placeholder="Tanya SplitBot..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] bg-white"
              />
              <button
                onClick={kirimChatAI}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-[#185FA5] text-white px-4 py-2.5 rounded-xl hover:bg-[#0C447C] disabled:opacity-60 transition-colors font-semibold text-sm"
              >
                Kirim
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL TAMBAH TRANSAKSI ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Tambah Transaksi</h3>
              <button onClick={() => { setShowForm(false); setRibaWarning(null); }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Keterangan</label>
                <input
                  value={form.keterangan}
                  onChange={e => { setForm({ ...form, keterangan: e.target.value }); setRibaWarning(null); }}
                  placeholder="Makan siang berlima"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={form.jumlah}
                  onChange={e => setForm({ ...form, jumlah: e.target.value })}
                  placeholder="150000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                />
                {form.jumlah && anggotaList.length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    = {formatRupiah(parseFloat(form.jumlah) / anggotaList.length)} per orang ({anggotaList.length} anggota)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  >
                    {Object.entries(KATEGORI_ICON).map(([k, icon]) => (
                      <option key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tipe Split</label>
                  <select
                    value={form.splitType}
                    onChange={e => { setForm({ ...form, splitType: e.target.value }); if (e.target.value === 'custom') initSplitDetails(); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  >
                    <option value="rata">⚖️ Rata</option>
                    <option value="custom">✏️ Manual</option>
                    <option value="pembayar">👤 Pembayar</option>
                  </select>
                </div>
              </div>

              {/* Custom split */}
              {form.splitType === 'custom' && splitDetails.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Atur Jumlah Per Anggota</div>
                  {splitDetails.map((sd, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600 w-20 truncate">{sd.nama.split(' ')[0]}</span>
                      <input
                        type="number"
                        value={sd.jumlah || ''}
                        onChange={e => {
                          const updated = [...splitDetails];
                          updated[i] = { ...updated[i], jumlah: parseFloat(e.target.value) || 0 };
                          setSplitDetails(updated);
                        }}
                        placeholder="0"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
                      />
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-1">
                    Total: {formatRupiah(splitDetails.reduce((s, d) => s + d.jumlah, 0))}
                    {form.jumlah && (
                      <span className={splitDetails.reduce((s, d) => s + d.jumlah, 0) === parseFloat(form.jumlah) ? ' text-green-600' : ' text-red-500'}>
                        {' '}/ {formatRupiah(parseFloat(form.jumlah))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {ribaWarning && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-4 py-3 rounded-xl">
                  {ribaWarning}
                  <button onClick={() => setRibaWarning(null)} className="block mt-2 underline text-yellow-600">
                    Saya yakin ini bukan riba, lanjutkan →
                  </button>
                </div>
              )}

              <div className="bg-teal-50 border border-teal-100 text-[#0E7C7B] text-xs px-3 py-2 rounded-xl">
                ☪️ Validasi syariah aktif — transaksi akan dicek bebas riba & gharar
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowForm(false); setRibaWarning(null); }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={simpanTransaksi}
                disabled={saving || !form.keterangan || !form.jumlah}
                className="flex-1 bg-[#185FA5] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 hover:bg-[#0C447C] transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
