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
        // Exclude node_modules (vendor scripts) to keep build fast and performance high
        include: ['src/**/*.js', 'src/**/*.ts', 'src/**/*.tsx'],
        exclude: [/node_modules/], 
        options: {
          // --- 3D Game Performance Settings ---
          // We disable heavy logic mangling (ControlFlowFlattening) 
          // because it destroys FPS in the render loop.
          compact: true,
          controlFlowFlattening: false, 
          deadCodeInjection: false,
          
          // --- Protection Settings ---
          debugProtection: false,
          disableConsoleOutput: true, // Hides logs in production
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          splitStrings: true,
          transformObjectKeys: true,
        }
      })
    ],
    base: './', 
    build: {
      outDir: 'dist',
      // Ensure separate chunks so we don't accidentally try to obfuscate 3MB of Three.js code
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