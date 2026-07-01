import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // On mapped network drives (e.g. U:), realpath resolution rewrites paths to
  // UNC form, which breaks Vite's package resolution. Keep original paths.
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
