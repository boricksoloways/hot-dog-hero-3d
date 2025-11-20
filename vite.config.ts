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
        // Exclude node_modules to prevent breaking vendor libraries
        exclude: [/node_modules/], 
        options: {
          // --- Safe 3D Game Settings ---
          compact: false, // FALSE to prevent syntax/reference errors in bundles
          controlFlowFlattening: false, 
          deadCodeInjection: false,
          
          // --- Protection Settings (Safe Profile) ---
          debugProtection: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal', // 'hexadecimal' is safer than 'mangled'
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: false, 
          stringArray: true,
          stringArrayThreshold: 0.75,
          splitStrings: false, 
          transformObjectKeys: false, 
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