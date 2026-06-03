'use client';

import { useEffect, useState } from 'react';
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
}

interface Grup {
  id: string;
  nama: string;
  kategori: string;
}

const KATEGORI_ICON: Record<string, string> = {
  makan: '🍜', transport: '🚗', hiburan: '🎮',
  infaq: '🌱', akomodasi: '🏨', lainnya: '📦',
};

export default function GrupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const grupId = params.id as string;

  const [grup, setGrup] = useState<Grup | null>(null);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ keterangan: '', jumlah: '', kategori: 'makan' });
  const [saving, setSaving] = useState(false);
  const [ribaWarning, setRibaWarning] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [grupId]);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }

    const [{ data: grupData }, { data: txData }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', grupId).single(),
      supabase.from('transactions').select('*').eq('group_id', grupId).order('created_at', { ascending: false }),
    ]);

    if (grupData) setGrup(grupData);
    if (txData) setTransaksiList(txData);
    setLoading(false);
  }

  function cekRibaSederhana(keterangan: string): string | null {
    const keyword = ['bunga', 'interest', 'denda %', 'late fee', 'penalti finansial', 'riba'];
    const found = keyword.find(k => keterangan.toLowerCase().includes(k));
    return found ? `⚠️ Terdeteksi kata "${found}" — kemungkinan mengandung riba. Harap periksa kembali.` : null;
  }

  async function simpanTransaksi() {
    const warning = cekRibaSederhana(form.keterangan);
    if (warning) { setRibaWarning(warning); return; }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('transactions').insert({
      group_id: grupId,
      keterangan: form.keterangan,
      jumlah: parseFloat(form.jumlah),
      kategori: form.kategori,
      dibayar_oleh: session.user.id,
      created_by: session.user.id,
      syariah_valid: true,
    });

    if (!error) {
      setShowForm(false);
      setForm({ keterangan: '', jumlah: '', kategori: 'makan' });
      setRibaWarning(null);
      await loadData();
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Memuat...</div>;

  const totalPengeluaran = transaksiList.reduce((s, t) => s + t.jumlah, 0);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 text-xl">←</Link>
        <span className="font-bold text-gray-800 flex-1 truncate">{grup?.nama}</span>
        <span className="text-xs bg-blue-light text-[#185FA5] px-2 py-1 rounded-full capitalize">{grup?.kategori}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Total */}
        <div className="bg-gradient-to-r from-[#185FA5] to-[#0E7C7B] rounded-2xl p-5 text-white mb-6">
          <div className="text-sm opacity-80 mb-1">Total Pengeluaran Grup</div>
          <div className="text-3xl font-bold">{formatRupiah(totalPengeluaran)}</div>
          <div className="text-sm opacity-70 mt-1">{transaksiList.length} transaksi</div>
        </div>

        {/* Header transaksi */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Transaksi</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#185FA5] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0C447C]"
          >
            + Tambah
          </button>
        </div>

        {/* Modal tambah transaksi */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-gray-900 mb-4">Tambah Transaksi</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <input
                    value={form.keterangan}
                    onChange={(e) => { setForm({ ...form, keterangan: e.target.value }); setRibaWarning(null); }}
                    placeholder="Makan siang berlima"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                    placeholder="120000"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  >
                    {Object.entries(KATEGORI_ICON).map(([k, icon]) => (
                      <option key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {ribaWarning && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-xl">
                    {ribaWarning}
                    <button
                      onClick={() => setRibaWarning(null)}
                      className="block mt-2 text-xs text-yellow-600 underline"
                    >
                      Saya yakin ini bukan riba, lanjutkan
                    </button>
                  </div>
                )}

                {/* Syariah badge */}
                <div className="bg-teal-light border border-teal-200 text-[#0E7C7B] text-xs px-3 py-2 rounded-xl">
                  ☪️ Validasi syariah aktif — transaksi akan dicek bebas riba
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => { setShowForm(false); setRibaWarning(null); }}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={simpanTransaksi}
                  disabled={saving || !form.keterangan || !form.jumlah}
                  className="flex-1 bg-[#185FA5] text-white font-medium py-2.5 rounded-xl disabled:opacity-60 text-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaksi list */}
        {transaksiList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">Belum ada transaksi di grup ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaksiList.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {KATEGORI_ICON[tx.kategori] ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{tx.keterangan}</div>
                  <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900">{formatRupiah(tx.jumlah)}</div>
                  {tx.syariah_valid && (
                    <div className="text-xs text-teal-DEFAULT">☪️ halal</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
