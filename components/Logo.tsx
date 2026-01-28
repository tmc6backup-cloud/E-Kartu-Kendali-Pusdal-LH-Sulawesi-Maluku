
import React, { useState, useEffect, useMemo } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const base = (window as any).APP_BASE || '/';
  const sessionToken = useMemo(() => Date.now(), []);

  // Daftar kandidat nama file logo yang paling mungkin diunggah
  const candidates = [
    'logo.png',
    'Logo.png',
    'logo-baru.png',
    'logo_baru.png',
    'logo.jpg',
    'logo.svg',
    'logo.webp',
    'logo-1.png'
  ];
  
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const getUrl = (filename: string) => {
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    const combinedPath = (cleanBase + cleanFilename).replace(/\/+/g, '/');
    return `${combinedPath}?v=${sessionToken}`;
  };

  const [src, setSrc] = useState(getUrl(candidates[0]));

  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      const nextIndex = candidateIndex + 1;
      setCandidateIndex(nextIndex);
      setSrc(getUrl(candidates[nextIndex]));
    } else {
      setHasError(true);
    }
  };

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    setSrc(getUrl(candidates[0]));
  }, [base, sessionToken]);

  return (
    <img 
      src={hasError ? fallbackLogo : src} 
      alt="Logo" 
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
      onError={handleError}
    />
  );
};

export default Logo;
