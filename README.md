# E-Kartu Kendali PUSDAL LH SUMA

Aplikasi dashboard kontrol anggaran untuk PUSDAL LH SUMA.

## Fitur Utama

- **Dashboard Kontrol Anggaran**: Visualisasi realisasi penyerapan dana dan tren keuangan bulanan.
- **Analisis AI**: Integrasi dengan Gemini API untuk memberikan insight strategis dan analisis pengajuan anggaran.
- **Manajemen Pengajuan**: Alur kerja pengajuan anggaran dari pengaju hingga validator.
- **Manajemen Pagu**: Pengaturan pagu anggaran kantor dan bidang.

## Teknologi

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **Charts**: Recharts.
- **Icons**: Lucide React.
- **AI**: Google Gemini API (@google/genai).
- **Build Tool**: Vite.

## Pengembangan

1. Salin `.env.example` menjadi `.env` dan isi kunci API yang diperlukan.
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Bangun untuk produksi:
   ```bash
   npm run build
   ```

## Lisensi

MIT
