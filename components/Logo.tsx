
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const base = (window as any).APP_BASE || '/';
  
  // Daftar varian nama file
  const logoVariants = [
    'logo.png',
    'logo.PNG',
    'logo.jpg',
    'logo.jpeg'
  ];

  const [variantIndex, setVariantIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Timestamp untuk memaksa browser mengabaikan cache lama (Cache Busting)
  const [timestamp] = useState(Date.now());

  const getCurrentUrl = () => {
    const fileName = logoVariants[variantIndex];
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    // Tambahkan ?v= agar file selalu dianggap baru oleh browser
    const rawUrl = (cleanBase + fileName).replace(/\/+/g, '/');
    return `${rawUrl}?v=${timestamp}`;
  };

  const handleError = () => {
    if (variantIndex < logoVariants.length - 1) {
      setVariantIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  // URL Cadangan KLHK (Selalu berfungsi sebagai backup)
  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        <img 
          src={hasError ? fallbackLogo : getCurrentUrl()} 
          alt="Logo PUSDAL" 
          className={`w-full h-full object-contain transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
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
