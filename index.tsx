
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL: Could not find root element to mount to");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("RUNTIME ERROR during app initialization:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; text-align: center;">
        <h1 style="color: #ef4444;">Aplikasi Gagal Dimuat</h1>
        <p>Terjadi kesalahan teknis saat inisialisasi. Silakan periksa konsol browser (F12).</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer;">Muat Ulang</button>
      </div>
    `;
  }
}
