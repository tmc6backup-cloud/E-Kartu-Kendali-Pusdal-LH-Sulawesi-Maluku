
import React, { useState, useEffect, useMemo } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Ambil base path dari global window yang dideteksi di index.html
  const base = (window as any).APP_BASE || '/';
  
  // Gunakan timestamp tunggal untuk sesi ini agar tidak re-load terus menerus 
  // tapi cukup untuk melewati cache browser yang menyimpan error 404
  const sessionToken = useMemo(() => Date.now(), []);

  // Daftar kemungkinan nama file yang mungkin diunggah pengguna
  const candidates = [
    'logo-1.png',
    'logo-baru.png',
    'logo_baru.png',
    'logo baru.png',
    'logo.jpg',
    'logo.jpeg',
    'logo.svg',
    'Logo.png',
    'Logo-Baru.png',
    'logo.webp'
  ];
  
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Fungsi untuk membersihkan path dan menambahkan cache buster
  const getUrl = (filename: string) => {
    // Bersihkan path: gabungkan base + filename dan hapus double slash //
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    const combinedPath = (cleanBase + cleanFilename).replace(/\/+/g, '/');
    
    return `${combinedPath}?v=${sessionToken}`;
  };

  const [src, setSrc] = useState(getUrl(candidates[0]));

  // Logo fallback resmi jika semua file lokal di root gagal dimuat
  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      const nextIndex = candidateIndex + 1;
      setCandidateIndex(nextIndex);
      setSrc(getUrl(candidates[nextIndex]));
      console.log(`Logo: Mencoba kandidat berikutnya: ${candidates[nextIndex]}`);
    } else {
      setHasError(true);
      console.warn("Logo: Semua file lokal tidak ditemukan. Menggunakan logo cadangan KLHK.");
    }
  };

  // Reset jika base path berubah secara dinamis
  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    setSrc(getUrl(candidates[0]));
  }, [base, sessionToken]);

  return (
    <img 
      src={hasError ? fallbackLogo : src} 
      alt="Logo Pusdal LH SUMA" 
      className={className}
      loading="eager"
      style={{ 
        objectFit: 'contain', 
        display: 'block',
        minWidth: '24px',
        minHeight: '24px'
      }}
      onError={handleError}
    />
  );
};

export default Logo;
