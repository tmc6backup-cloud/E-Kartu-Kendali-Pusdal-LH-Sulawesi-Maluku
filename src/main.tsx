
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

  // Hide splash screen
  const splash = document.getElementById('splash-screen');
  const rootDiv = document.getElementById('root');
  if (splash && rootDiv) {
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      rootDiv.classList.add('loaded');
    }, 500);
  }
}
