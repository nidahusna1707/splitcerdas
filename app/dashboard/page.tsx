'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils/format';

interface Grup {
  id: string;
  nama: string;
  kategori: string;
  created_at: string;
}

const KATEGORI_ICON: Record<string, string> = {
  liburan: '✈️', kost: '🏠', arisan: '💰', kondangan: '💍',
  makan: '🍜', organisasi: '🏫', lainnya: '📦',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; nama: string } | null>(null);
  const [grupList, setGrupList] = useState<Grup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuatGrup, setShowBuatGrup] = useState(false);
  const [formGrup, setFormGrup] = useState({ nama: '', kategori: 'makan' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }
    setUser({
      email: session.user.email ?? '',
      nama: session.user.user_metadata?.nama_lengkap ?? session.user.email ?? '',
    });
    await loadGrup(session.user.id);
    setLoading(false);
  }

  async function loadGrup(userId: string) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('admin_id', userId)
      .eq('is_aktif', true)
      .order('created_at', { ascending: false });
    if (data) setGrupList(data);
  }

  async function buatGrup() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('groups').insert({
      nama: formGrup.nama,
      kategori: formGrup.kategori,
      admin_id: session.user.id,
    });

    if (!error) {
      setShowBuatGrup(false);
      setFormGrup({ nama: '', kategori: 'makan' });
      await loadGrup(session.user.id);
    }
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Memuat dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <span className="font-extrabold text-lg">
          <span className="text-[#185FA5]">Split</span>Cerdas
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">{user?.nama}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Assalamu'alaikum, {user?.nama?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola patungan & hutang piutang dengan berkah</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Grup Aktif', value: grupList.length, icon: '👥', color: 'bg-blue-light' },
            { label: 'Akad Qardh', value: 0, icon: '📜', color: 'bg-teal-light' },
            { label: 'Kebajikan', value: formatRupiah(0), icon: '🌱', color: 'bg-green-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-4 border border-white`}>
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Grup section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Grup Saya</h2>
          <button
            onClick={() => setShowBuatGrup(true)}
            className="bg-[#185FA5] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0C447C] transition-colors"
          >
            + Buat Grup
          </button>
        </div>

        {/* Modal buat grup */}
        {showBuatGrup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-gray-900 mb-4">Buat Grup Baru</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Grup</label>
                  <input
                    value={formGrup.nama}
                    onChange={(e) => setFormGrup({ ...formGrup, nama: e.target.value })}
                    placeholder="Liburan Bali 2026"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formGrup.kategori}
                    onChange={(e) => setFormGrup({ ...formGrup, kategori: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                  >
                    {Object.entries(KATEGORI_ICON).map(([k, icon]) => (
                      <option key={k} value={k}>{icon} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowBuatGrup(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={buatGrup}
                  disabled={saving || !formGrup.nama}
                  className="flex-1 bg-[#185FA5] text-white font-medium py-2.5 rounded-xl disabled:opacity-60 text-sm hover:bg-[#0C447C]"
                >
                  {saving ? 'Menyimpan...' : 'Buat Grup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grup list */}
        {grupList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500 text-sm mb-4">Belum ada grup. Buat grup pertamamu!</p>
            <button
              onClick={() => setShowBuatGrup(true)}
              className="bg-[#185FA5] text-white text-sm font-medium px-6 py-2 rounded-xl hover:bg-[#0C447C]"
            >
              + Buat Grup Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {grupList.map((grup) => (
              <Link
                key={grup.id}
                href={`/grup/${grup.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:border-[#185FA5] hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-light flex items-center justify-center text-2xl flex-shrink-0">
                  {KATEGORI_ICON[grup.kategori] ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{grup.nama}</div>
                  <div className="text-xs text-gray-400 capitalize">{grup.kategori}</div>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </Link>
            ))}
          </div>
        )}

        {/* Fitur Syariah banner */}
        <div className="mt-8 bg-gradient-to-r from-[#0E7C7B] to-[#185FA5] rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <span className="text-2xl">☪️</span>
            <div>
              <div className="font-bold mb-1">Fitur Syariah Aktif</div>
              <p className="text-sm opacity-90">
                Semua transaksi divalidasi bebas riba. Akad Qardh digital & tracker zakat tersedia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
