import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/auth')) return 'vendor-firebase-auth';
          if (id.includes('firebase/firestore')) return 'vendor-firebase-db';
          if (id.includes('firebase/storage')) return 'vendor-firebase-storage';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('lucide-react')) return 'vendor-lucide';
        },
      },
    },
  },
})
