import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://ophim1.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1/api'),
        secure: false,
      },
    },
  },
});