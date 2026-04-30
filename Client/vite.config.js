import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      splitVendorChunkPlugin(), // auto-splits node_modules into a vendor chunk
    ],

    /* ── Path aliases ── */
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    /* ── Dev server ── */
    server: {
      port: 3000,
      open: true,
    },

    /* ── Build ── */
    build: {
      target: 'es2015',          // broad browser support
      sourcemap: !isProd,        // source maps in dev/staging only
      minify: 'esbuild',         // fastest minifier (built into Vite)
      chunkSizeWarningLimit: 500, // warn if any chunk > 500 kB

      rollupOptions: {
        output: {
          /**
           * Manual chunk splitting strategy.
           *
           * Why: Without this every lazy() import becomes its own tiny file,
           * which means dozens of round-trips on first visit to a section.
           * Grouping related routes into shared chunks means:
           *  - Admin pages share one chunk  → one download for the whole portal
           *  - Marketplace pages share one  → same benefit
           *  - Vendor libs are stable       → cached across deploys
           */
          manualChunks(id) {
            /* ── Vendor: React core ── */
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react'
            }

            /* ── Vendor: everything else in node_modules ── */
            if (id.includes('node_modules/')) {
              return 'vendor-libs'
            }

            /* ── App: Admin portal ── */
            if (id.includes('/AdminComponents/')) {
              return 'chunk-admin'
            }

            /* ── App: Marketplace ── */
            if (id.includes('/Apps/Marketplace/')) {
              return 'chunk-marketplace'
            }

            /* ── App: Company portal ── */
            if (id.includes('/CompaniesComponent/')) {
              return 'chunk-company'
            }

            /* ── App: User portal ── */
            if (id.includes('/UserComponents/')) {
              return 'chunk-user'
            }

            /* ── App: Auth ── */
            if (id.includes('/AuthComponents/')) {
              return 'chunk-auth'
            }

            /* ── App: Static/extra pages ── */
            if (id.includes('/pages/extras/')) {
              return 'chunk-static'
            }

            // Everything else (layouts, routes, utils) stays in the main bundle
          },

          /* Deterministic filenames → better long-term CDN caching */
          entryFileNames:  'assets/[name]-[hash].js',
          chunkFileNames:  'assets/[name]-[hash].js',
          assetFileNames:  'assets/[name]-[hash][extname]',
        },
      },
    },

    /* ── CSS ── */
    css: {
      devSourcemap: true,
    },

    /* ── Preview server (vite preview) ── */
    preview: {
      port: 4173,
    },
  }
})