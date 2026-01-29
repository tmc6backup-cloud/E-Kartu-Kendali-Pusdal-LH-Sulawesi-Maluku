
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  // URL Logo KLH baru 2024
  const klhLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_Kementerian_Lingkungan_Hidup_-_Badan_Pengendalian_Lingkungan_Hidup_%282024%29_%28cropped%29.png";
  
  // State untuk fallback jika logo utama bermasalah
  const [imgSrc, setImgSrc] = useState(klhLogoUrl);
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
          console.warn("Logo utama tidak dapat dimuat, beralih ke fallback.");
        }
      }}
    />
  );
};

export default Logo;
