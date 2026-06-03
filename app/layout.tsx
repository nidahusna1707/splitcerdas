import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SplitCerdas — Patungan Cerdas, Transparan, dan Berkah',
  description: 'Sistem Informasi Akuntansi Patungan & Hutang Piutang Berbasis Syariah & AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
