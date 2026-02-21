import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Specify the root directory of your project
  build: {
    rollupOptions: {
      input: 'index.html', // Specify index.html as the entry point
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
