
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  // Render aplikasi
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Fungsi untuk menyembunyikan loader setelah komponen utama terpasang
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.classList.add('hidden');
      }
    }, 800);
  });

  // Cadangan jika event load sudah terlewat
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
    }
  }, 3000);
}
