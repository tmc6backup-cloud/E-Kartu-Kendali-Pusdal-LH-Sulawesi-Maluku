
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // Ambil base path dari global window
  const base = (window as any).APP_BASE || '/';
  
  // Konstruksi URL absolut yang benar
  const getLogoUrl = (filename: string) => {
    try {
      // Menggabungkan origin + base path + filename
      const url = new URL(base + filename, window.location.origin);
      // Tambahkan cache buster agar perubahan file langsung terlihat
      return url.toString() + '?v=' + Date.now();
    } catch (e) {
      return base + filename;
    }
  };

  const [imgSrc, setImgSrc] = useState(getLogoUrl('logo.png'));
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const fallbackLogo = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (retryCount === 0) {
      // Jika logo.png gagal, coba Logo.png (kapital)
      setRetryCount(1);
      setImgSrc(getLogoUrl('logo.png'));
    } else if (retryCount === 1) {
      // Jika masih gagal, coba logo.PNG
      setRetryCount(2);
      setImgSrc(getLogoUrl('logo.png'));
    } else {
      // Jika semua gagal, gunakan fallback online
      setHasError(true);
    }
  };

  // Reset state jika base path berubah
  useEffect(() => {
    setImgSrc(getLogoUrl('logo.png'));
    setRetryCount(0);
    setHasError(false);
  }, [base]);

  return (
    <img 
      src={hasError ? fallbackLogo : imgSrc} 
      alt="Logo Pusdal LH SUMA" 
      className={className}
      style={{ objectFit: 'contain' }}
      onError={handleError}
    />
  );
};

export default Logo;
