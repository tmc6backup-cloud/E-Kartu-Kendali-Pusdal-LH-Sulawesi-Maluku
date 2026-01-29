
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );

  // Sembunyikan loader lebih cepat
  const loader = document.getElementById('app-loader');
  if (loader) {
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 300);
  }
}
