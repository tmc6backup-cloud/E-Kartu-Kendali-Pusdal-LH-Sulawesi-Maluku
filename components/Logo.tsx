
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const [src, setSrc] = useState('./logo.png');
  const fallbackUrl = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";

  const handleError = () => {
    if (src !== fallbackUrl) {
      setSrc(fallbackUrl);
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={src} 
        alt="Logo" 
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  );
};

export default Logo;
