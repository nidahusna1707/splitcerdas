# 💸 SplitCerdas v2.0 — Edisi Syariah

> Patungan Cerdas, Transparan, dan Berkah

## 🚀 Deploy dalam 30 Menit

### LANGKAH 1 — Setup Supabase (5 menit)

1. Buka [supabase.com](https://supabase.com) → login → **New Project**
2. Isi nama project: `splitcerdas`, pilih region `Southeast Asia (Singapore)`
3. Tunggu project siap (~2 menit)
4. Buka **SQL Editor** → klik **New Query**
5. Copy-paste isi file `supabase/migrations/001_initial_schema.sql`
6. Klik **Run** — semua tabel akan terbuat otomatis
7. Catat credentials dari **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### LANGKAH 2 — Push ke GitHub (3 menit)

```bash
# Di terminal, masuk ke folder project ini
cd splitcerdas

# Init git
git init
git add .
git commit -m "feat: initial SplitCerdas v2.0 Syariah"

# Buat repo baru di github.com/new, lalu:
git remote add origin https://github.com/USERNAME/splitcerdas.git
git branch -M main
git push -u origin main
```

### LANGKAH 3 — Deploy ke Vercel (5 menit)

1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo `splitcerdas` dari GitHub
3. Di bagian **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | `https://splitcerdas.vercel.app` |

4. Klik **Deploy** — Vercel akan build otomatis (~2-3 menit)
5. ✅ Aplikasi live di `https://splitcerdas.vercel.app`

### LANGKAH 4 — Aktifkan Auth di Supabase (2 menit)

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: masukkan URL Vercel kamu, contoh `https://splitcerdas.vercel.app`
3. **Redirect URLs**: tambahkan `https://splitcerdas.vercel.app/**`
4. Klik Save

---

## 🗂️ Struktur Project

```
splitcerdas/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/login/           # Halaman login
│   ├── auth/register/        # Halaman daftar
│   ├── dashboard/            # Dashboard utama (perlu login)
│   ├── grup/[id]/            # Detail grup & transaksi
│   └── api/health/           # Health check endpoint
├── lib/
│   ├── supabase/             # Supabase client
│   └── utils/                # Format rupiah, tanggal, dll
└── supabase/
    └── migrations/           # SQL schema database
```

## 🛠️ Jalankan Lokal

```bash
# 1. Copy env
cp .env.example .env.local
# 2. Isi nilai di .env.local

# 3. Install & run
npm install
npm run dev
# Buka http://localhost:3000
```

---

*SplitCerdas — Universitas Tazkia · SIA · 2026*
