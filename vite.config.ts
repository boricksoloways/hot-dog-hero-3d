import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CHANGED: using './' makes the assets load relatively, 
  // so it works on ANY repository name or even locally.
  base: './', 
  build: {
    outDir: 'dist',
  }
});