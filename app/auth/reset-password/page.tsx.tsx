'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== konfirmasi) {
      setMessage({ type: 'error', text: 'Password tidak sama. Coba lagi.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: 'Gagal update password. Coba lagi.' });
    } else {
      setMessage({ type: 'success', text: '✅ Password berhasil diubah! Mengalihkan...' });
      setTimeout(() => router.push('/auth/login'), 2000);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-[#185FA5]">Split</span>Cerdas
          </h1>
          <p className="text-gray-400 text-sm mt-1">Buat password baru</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Password Baru</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Konfirmasi Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-transparent"
            />
          </div>

          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#185FA5] hover:bg-[#0C447C] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </main>
  );
}
