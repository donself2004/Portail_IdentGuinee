import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // PDF / canvas (lourds, chargés seulement sur /document-genere)
          'vendor-pdf': ['jspdf', 'html2canvas'],
          // DOMPurify (sanitisation HTML)
          'vendor-purify': ['dompurify'],
        },
      },
    },
  },
})
