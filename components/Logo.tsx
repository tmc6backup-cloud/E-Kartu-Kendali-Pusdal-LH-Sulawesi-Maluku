
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Ambil base path dari window (didefinisikan di index.html)
  const base = (window as any).APP_BASE || '/';
  
  // Daftar kemungkinan nama file logo yang sering digunakan
  const logoVariants = [
    'logo.png',
    'logo.PNG',
    'logo.jpg',
    'logo.jpeg',
    'Logo.png',
    'Logo.PNG'
  ];

  const [variantIndex, setVariantIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // URL Cadangan jika semua file lokal tidak ditemukan
  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  // Konstruksi URL berdasarkan varian saat ini
  const getCurrentUrl = () => {
    const fileName = logoVariants[variantIndex];
    // Pastikan base berakhir dengan slash atau file tidak diawali slash
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return (cleanBase + fileName).replace(/\/+/g, '/');
  };

  const handleError = () => {
    if (variantIndex < logoVariants.length - 1) {
      // Coba varian nama file berikutnya
      setVariantIndex(prev => prev + 1);
    } else {
      // Jika semua varian sudah dicoba dan gagal, gunakan fallback
      setHasError(true);
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        <img 
          src={hasError ? fallbackLogo : getCurrentUrl()} 
          alt="Logo Pusdal LH SUMA" 
          className={`w-full h-full object-contain transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse rounded-lg"></div>
        )}
    </div>
  );
};

export default Logo;
