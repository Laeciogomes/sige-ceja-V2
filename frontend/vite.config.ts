import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          // Keep only truly isolated heavy dependencies in dedicated chunks.
          // React/MUI/emotion/router are intentionally left to Vite/Rollup default
          // chunking to avoid runtime circular dependencies between vendor chunks.
          if (
            id.includes('jspdf')
            || id.includes('html2canvas')
            || id.includes('canvg')
            || id.includes('dompurify')
          ) {
            return 'vendor-pdf'
          }

          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }

          if (id.includes('papaparse') || id.includes('csv-parse')) {
            return 'vendor-csv'
          }

          return undefined
        },
      },
    },
  },
})
