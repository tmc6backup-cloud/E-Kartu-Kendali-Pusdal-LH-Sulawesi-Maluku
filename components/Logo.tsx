
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Mendapatkan base path yang dihitung di index.html (contoh: '/nama-repo/' atau '/')
  const base = (window as any).APP_BASE || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  
  // Cache buster menggunakan timestamp untuk memaksa browser memuat file terbaru
  // dan mengabaikan cache 404 (file tidak ditemukan) yang mungkin tersimpan sebelumnya.
  const cacheBuster = `?t=${Date.now()}`;
  
  // URL absolut ke logo.png di root
  const localLogoUrl = `${window.location.origin}${cleanBase}logo.png${cacheBuster}`;
  
  const [src, setSrc] = useState(localLogoUrl);
  const [isFallback, setIsFallback] = useState(false);

  // Logo resmi jika file lokal gagal total
  const remoteFallback = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  useEffect(() => {
    console.log(`[Logo Debug] Mencoba memuat logo dari: ${localLogoUrl}`);
  }, [localLogoUrl]);

  const handleError = () => {
    if (!isFallback) {
      console.warn("[Logo] File logo.png lokal gagal dimuat. Menggunakan fallback remote.");
      setSrc(remoteFallback);
      setIsFallback(true);
    }
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img 
        src={src} 
        alt="Logo Instansi" 
        className="w-full h-full object-contain"
        onError={handleError}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default Logo;
