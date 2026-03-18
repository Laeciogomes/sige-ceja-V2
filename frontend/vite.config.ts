import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf'
          }

          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui'
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }

          if (id.includes('papaparse') || id.includes('csv-parse')) {
            return 'vendor-csv'
          }

          if (
            id.includes('react-router')
            || id.includes('react-dom')
            || /node_modules\/react(\/|\\)|node_modules\\react(\/|\\)/.test(id)
          ) {
            return 'vendor-react'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
