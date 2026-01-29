
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  // Render aplikasi dengan Provider
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );

  // Fungsi untuk menyembunyikan loader secara instan
  const forceHideLoader = () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }
  };

  // Jalankan segera setelah render dimulai
  if (document.readyState === 'complete') {
    forceHideLoader();
  } else {
    window.addEventListener('load', forceHideLoader);
    // Cadangan: Paksa tutup setelah 1.5 detik jika event load terhambat
    setTimeout(forceHideLoader, 1500);
  }
}
