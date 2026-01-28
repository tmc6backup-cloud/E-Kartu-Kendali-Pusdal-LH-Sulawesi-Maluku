
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Karena logo.png ada di root bersama index.html, jalur "logo.png" secara teknis adalah yang paling benar.
  // Tambahkan timestamp untuk menghindari cache 404 yang membandel.
  const [src, setSrc] = useState(`logo.png?v=${Date.now()}`);
  const [retryCount, setRetryCount] = useState(0);

  // Logo cadangan jika file lokal benar-benar tidak bisa diakses sama sekali.
  const fallbackUrl = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (retryCount === 0) {
      // Jika "logo.png" gagal, coba jalur absolut menggunakan APP_BASE yang dideteksi index.html
      const base = (window as any).APP_BASE || '/';
      const cleanBase = base.endsWith('/') ? base : base + '/';
      console.warn(`[Logo] Gagal memuat logo.png. Mencoba jalur absolut: ${cleanBase}logo.png`);
      setSrc(`${cleanBase}logo.png?v=${Date.now()}`);
      setRetryCount(1);
    } else if (retryCount === 1) {
      // Jika jalur absolut juga gagal, gunakan fallback remote
      console.warn("[Logo] Semua jalur lokal gagal. Menggunakan logo cadangan KLHK.");
      setSrc(fallbackUrl);
      setRetryCount(2);
    }
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img 
        src={src} 
        alt="Logo Instansi" 
        className="w-full h-full object-contain"
        onError={handleError}
        style={{ display: 'block', minWidth: '20px', minHeight: '20px' }}
      />
    </div>
  );
};

export default Logo;
