'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setError('Email atau password salah. Coba lagi.');
    } else {
      router.push('/dashboard');
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
          <p className="text-gray-400 text-sm mt-1">Masuk ke akun kamu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@kamu.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-transparent"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-[#185FA5] hover:underline">
                Lupa password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#185FA5] hover:bg-[#0C447C] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-[#185FA5] font-medium hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
