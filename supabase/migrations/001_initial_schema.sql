-- ============================================================
-- SplitCerdas — Supabase Database Migration
-- Versi 2.0 · Edisi Syariah · 2026
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- TABEL INTI --------------------------------------------------

CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(255) NOT NULL,
  kategori    VARCHAR(50) NOT NULL DEFAULT 'lainnya',
  deskripsi   TEXT,
  admin_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_aktif    BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  peran     VARCHAR(20) DEFAULT 'anggota',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  keterangan    TEXT NOT NULL,
  jumlah        DECIMAL(15,2) NOT NULL,
  kategori      VARCHAR(50) DEFAULT 'lainnya',
  dibayar_oleh  UUID REFERENCES auth.users(id),
  metode_input  VARCHAR(20) DEFAULT 'manual',
  split_type    VARCHAR(20) DEFAULT 'rata',
  syariah_valid BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  jumlah_hutang   DECIMAL(15,2) NOT NULL,
  sudah_bayar     BOOLEAN DEFAULT false,
  bayar_at        TIMESTAMPTZ,
  konfirmasi_oleh UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- TABEL SYARIAH ★ --------------------------------------------

CREATE TABLE IF NOT EXISTS public.qardh_akad (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES public.transactions(id),
  muqridh_id      UUID REFERENCES auth.users(id),
  muqtaridh_id    UUID REFERENCES auth.users(id),
  jumlah          DECIMAL(15,2) NOT NULL,
  tujuan          TEXT NOT NULL,
  jatuh_tempo     DATE NOT NULL,
  teks_akad       TEXT NOT NULL,
  status          VARCHAR(30) DEFAULT 'menunggu_persetujuan',
  disetujui_at    TIMESTAMPTZ,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.riba_detection_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID REFERENCES public.transactions(id),
  user_id          UUID REFERENCES auth.users(id),
  tipe_pelanggaran VARCHAR(100) NOT NULL,
  level            VARCHAR(20) NOT NULL,
  deskripsi        TEXT NOT NULL,
  saran_alternatif TEXT,
  aksi_user        VARCHAR(50),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kebajikan_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id),
  jenis      VARCHAR(30) NOT NULL,
  jumlah     DECIMAL(15,2) NOT NULL,
  penerima   VARCHAR(255),
  catatan    TEXT,
  bukti_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zakat_tracker (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) UNIQUE,
  total_aset        DECIMAL(15,2) DEFAULT 0,
  tanggal_haul_mulai DATE,
  nisab_saat_ini    DECIMAL(15,2),
  status_wajib      BOOLEAN DEFAULT false,
  terakhir_bayar    DATE,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- AUDIT LOG (immutable) --------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabel       VARCHAR(100) NOT NULL,
  aksi        VARCHAR(20) NOT NULL,
  data_lama   JSONB,
  data_baru   JSONB,
  aktor_id    UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY -----------------------------------------

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qardh_akad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kebajikan_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riba_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- POLICIES ---------------------------------------------------

-- groups: user bisa lihat dan manage grup miliknya
CREATE POLICY "user_lihat_grup_sendiri" ON public.groups
  FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "user_buat_grup" ON public.groups
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "admin_update_grup" ON public.groups
  FOR UPDATE USING (admin_id = auth.uid());

-- transactions: user bisa lihat transaksi grupnya
CREATE POLICY "user_lihat_transaksi_grupnya" ON public.transactions
  FOR SELECT USING (
    group_id IN (
      SELECT id FROM public.groups WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "user_buat_transaksi" ON public.transactions
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups WHERE admin_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- kebajikan: user hanya lihat miliknya sendiri
CREATE POLICY "user_lihat_kebajikan_sendiri" ON public.kebajikan_log
  FOR ALL USING (user_id = auth.uid());

-- zakat: user hanya lihat miliknya
CREATE POLICY "user_lihat_zakat_sendiri" ON public.zakat_tracker
  FOR ALL USING (user_id = auth.uid());

-- qardh: user lihat akad yang melibatkan mereka
CREATE POLICY "pihak_akad_lihat" ON public.qardh_akad
  FOR SELECT USING (muqridh_id = auth.uid() OR muqtaridh_id = auth.uid());

-- audit: user lihat log miliknya
CREATE POLICY "user_lihat_log_sendiri" ON public.audit_log
  FOR SELECT USING (aktor_id = auth.uid());
