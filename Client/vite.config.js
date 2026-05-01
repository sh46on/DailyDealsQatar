import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      visualizer({ open: true, gzipSize: true, filename: 'dist/stats.html' }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      open: true,
    },

    build: {
      target: 'es2015',
      sourcemap: !isProd,
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,

      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor: React core
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) return 'vendor-react'

            // Vendor: PDF.js isolated
            if (id.includes('node_modules/pdfjs-dist/')) return 'vendor-pdf'

            // Vendor: D3 (pulled in by recharts)
            if (
              id.includes('node_modules/d3') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/internmap') ||
              id.includes('node_modules/delaunator') ||
              id.includes('node_modules/robust-predicates')
            ) return 'vendor-d3'

            // Vendor: Recharts
            if (id.includes('node_modules/recharts')) return 'vendor-recharts'

            // Vendor: Redux
            if (
              id.includes('node_modules/@reduxjs/') ||
              id.includes('node_modules/redux') ||
              id.includes('node_modules/reselect') ||
              id.includes('node_modules/immer')
            ) return 'vendor-redux'

            // Vendor: everything else
            if (id.includes('node_modules/')) return 'vendor-libs'

            // App: Shared — must come before auth/marketplace
            if (
              id.includes('/utils/') ||
              id.includes('/hooks/') ||
              id.includes('/context/') ||
              id.includes('/constants/') ||
              id.includes('/services/')
            ) return 'chunk-shared'

            // App chunks
            if (id.includes('/AuthComponents/'))     return 'chunk-auth'
            if (id.includes('/Apps/Marketplace/'))   return 'chunk-marketplace'
            if (id.includes('/AdminComponents/'))    return 'chunk-admin'
            if (id.includes('/CompaniesComponent/')) return 'chunk-company'
            if (id.includes('/UserComponents/'))     return 'chunk-user'
            if (id.includes('/pages/extras/'))       return 'chunk-static'
          },

          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    css: {
      devSourcemap: true,
    },

    preview: {
      port: 4173,
    },
  }
})