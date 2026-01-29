
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Ambil base path dari window (didefinisikan di index.html)
  const base = (window as any).APP_BASE || '/';
  
  // Konstruksi URL logo yang lebih aman
  // Menggunakan relative path dari root aplikasi
  const logoUrl = (base + 'logo.png').replace(/\/+/g, '/');
  
  // State untuk fallback jika logo.png tidak ditemukan
  const [imgSrc, setImgSrc] = useState(logoUrl);
  const [hasError, setHasError] = useState(false);

  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  return (
    <img 
      src={hasError ? fallbackLogo : imgSrc} 
      alt="Logo Pusdal LH SUMA" 
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          console.warn("Logo lokal tidak ditemukan, beralih ke fallback.");
        }
      }}
    />
  );
};

export default Logo;
