
import React from 'react';

// Menggunakan path absolut "/" agar terbaca di semua route (termasuk /requests/:id)
export const LOGO_URL = "/logo.png";

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
