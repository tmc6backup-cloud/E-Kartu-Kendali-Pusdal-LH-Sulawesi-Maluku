
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Ambil base path dari global window yang dideteksi di index.html
  const base = (window as any).APP_BASE || '/';
  
  // Daftar kemungkinan nama file yang sering digunakan
  const candidates = [
    'logo.png', 
    'Logo.png', 
    'logo.PNG', 
    'Logo.PNG',
    'logo.jpg', 
    'logo.jpeg', 
    'logo.svg',
    'logo.webp'
  ];
  
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Fungsi untuk membersihkan path dan menambahkan cache buster
  const getUrl = (filename: string) => {
    // Pastikan tidak ada double slash kecuali di awal (protocol)
    const combinedPath = (base + '/' + filename).replace(/\/+/g, '/');
    // Tambahkan timestamp untuk menghindari cache jika user baru saja ganti file
    return `${combinedPath}?v=${Date.now()}`;
  };

  const [src, setSrc] = useState(getUrl(candidates[0]));

  // Logo fallback jika semua file lokal gagal dimuat
  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      const nextIndex = candidateIndex + 1;
      setCandidateIndex(nextIndex);
      setSrc(getUrl(candidates[nextIndex]));
      console.log(`Logo: Gagal memuat ${candidates[candidateIndex]}, mencoba ${candidates[nextIndex]}`);
    } else {
      setHasError(true);
      console.warn("Logo: Semua kandidat file lokal gagal dimuat, menggunakan fallback KLHK.");
    }
  };

  // Sinkronisasi ulang jika base path berubah
  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    setSrc(getUrl(candidates[0]));
  }, [base]);

  return (
    <img 
      src={hasError ? fallbackLogo : src} 
      alt="Logo Pusdal LH SUMA" 
      className={className}
      loading="eager"
      style={{ 
        objectFit: 'contain', 
        display: 'block',
        minWidth: '20px',
        minHeight: '20px'
      }}
      onError={handleError}
    />
  );
};

export default Logo;
