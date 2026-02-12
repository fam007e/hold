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
        manualChunks: {
          'vendor-firebase-auth': ['firebase/auth'],
          'vendor-firebase-db': ['firebase/firestore'],
          'vendor-firebase-storage': ['firebase/storage'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
  },
})
