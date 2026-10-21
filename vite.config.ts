import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the production build opens from any static path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 4000 },
});
