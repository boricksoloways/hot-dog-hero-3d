import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react()
    ],
    base: './', 
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['three', 'react', 'react-dom', '@react-three/fiber', '@react-three/cannon']
          }
        }
      }
    }
  };
});