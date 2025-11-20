import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'rollup-plugin-obfuscator';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // Only run obfuscation when building for production
      isProduction && obfuscatorPlugin({
        global: true,
        // Exclude node_modules to prevent breaking vendor libraries
        include: ['src/**/*.js', 'src/**/*.ts', 'src/**/*.tsx'],
        exclude: [/node_modules/], 
        options: {
          // --- Safe 3D Game Settings ---
          compact: true,
          controlFlowFlattening: false, 
          deadCodeInjection: false,
          
          // --- Protection Settings (Safe Profile) ---
          debugProtection: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'mangled', // Changed from 'hexadecimal' for better stability
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: false, // Disabled: often causes crashes in modern browsers
          stringArray: true,
          stringArrayThreshold: 0.75,
          splitStrings: false, // Disabled: prevents string breaking errors
          transformObjectKeys: false, // CRITICAL: Disabled to keep Three.js props working
        }
      })
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