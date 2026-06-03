import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function hitungSplitRata(total: number, jumlahOrang: number): number[] {
  const perOrang = Math.floor(total / jumlahOrang);
  const sisa = total - perOrang * jumlahOrang;
  return Array.from({ length: jumlahOrang }, (_, i) =>
    i === 0 ? perOrang + sisa : perOrang
  );
}
