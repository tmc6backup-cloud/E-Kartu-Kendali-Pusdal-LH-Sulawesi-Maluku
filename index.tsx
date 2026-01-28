
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  // Render aplikasi
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Sembunyikan loader setelah komponen siap
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }, 500);
}
