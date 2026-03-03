import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Safely polyfill process for libraries that expect it, 
    // but prefer import.meta.env in application code.
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'genai-sdk': ['@google/genai'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});