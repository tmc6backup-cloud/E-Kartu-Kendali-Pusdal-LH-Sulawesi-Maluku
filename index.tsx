
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Sembunyikan loader secara manual jika diperlukan
  const loader = document.getElementById('app-loader');
  if (loader) {
      // Tunggu sebentar agar render pertama selesai
      setTimeout(() => {
          loader.style.display = 'none';
      }, 500);
  }
}
