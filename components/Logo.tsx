
import React, { useState, useMemo, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const base = (window as any).APP_BASE || '/';
  const sessionToken = useMemo(() => Date.now(), []);

  // URL Logo Resmi KLHK sebagai jaminan tampilan (High Availability)
  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const candidates = [
    'logo.png',
    'Logo.png',
    'logo-baru.png',
    'logo.jpg'
  ];
  
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isFallback, setIsFallback] = useState(false);

  const getUrl = (filename: string) => {
    const cleanBase = base.endsWith('/') ? base : base + '/';
    return `${cleanBase}${filename}?v=${sessionToken}`;
  };

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setIsFallback(true);
    }
  };

  // Reset state jika base path berubah (jarang terjadi tapi bagus untuk robustness)
  useEffect(() => {
    setCandidateIndex(0);
    setIsFallback(false);
  }, [base]);

  return (
    <img 
      src={isFallback ? fallbackLogo : getUrl(candidates[candidateIndex])} 
      alt="Logo Pusdal LH Suma" 
      className={className}
      style={{ 
        objectFit: 'contain', 
        display: 'block',
        minWidth: '20px',
        minHeight: '20px'
      }}
      onError={handleError}
      loading="eager"
    />
  );
};

export default Logo;
