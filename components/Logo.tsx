
import React from 'react';

// Ambil base path yang dideteksi di index.html
const getLogoUrl = () => {
  const base = (window as any).APP_BASE || '/';
  // Hapus double slash jika ada
  return (base + 'logo.png').replace(/\/+/g, '/');
};

export const LOGO_URL = getLogoUrl();

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img 
      src={LOGO_URL} 
      alt="Logo Pusdal LH SUMA" 
      className={className}
      onError={(e) => {
        // Fallback jika file logo.png di root tidak terbaca atau belum diupload
        e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";
      }}
    />
  );
};

export default Logo;
