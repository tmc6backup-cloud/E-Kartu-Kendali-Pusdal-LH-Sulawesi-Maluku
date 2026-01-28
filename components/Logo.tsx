
import React from 'react';

// Get base path detected in index.html
const getLogoUrl = () => {
  const base = (window as any).APP_BASE || '/';
  // Standard logo path
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
        // Fallback to official logo if local logo.png is missing or unreadable
        const target = e.currentTarget;
        if (target.src !== "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png") {
            target.src = "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan.png";
        }
      }}
    />
  );
};

export default Logo;
