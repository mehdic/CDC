import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * MetaPharm Connect - Vite Configuration
 *
 * Performance optimizations:
 * - Code splitting with intelligent chunking
 * - Asset versioning with content hashes
 * - Image optimization pipeline
 * - CDN-ready asset paths
 * - Preload critical assets
 * - Cache-optimized build output
 *
 * Target: PageSpeed >90, FCP <1.5s
 */

// CDN configuration (set via environment variables)
const CDN_URL = process.env.VITE_CDN_URL || '';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  // Base URL for CDN deployment
  base: CDN_URL || '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@apps': path.resolve(__dirname, './src/apps'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
    dedupe: ['date-fns'],
  },

  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    headers: {
      // Cache-Control headers for preview (production-like)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    // Asset inlining threshold (4kb for images, icons)
    assetsInlineLimit: 4096,
    // Enable module preload polyfill for older browsers
    modulePreload: {
      polyfill: true,
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Additional optimizations
        passes: 2,
        unsafe_math: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          // React Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router';
          }
          // Material-UI core components
          if (id.includes('node_modules/@mui/material')) {
            return 'mui-core';
          }
          // Material-UI icons (separate chunk - loaded on demand)
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'mui-icons';
          }
          // Material-UI data grid (separate - only for tables)
          if (id.includes('node_modules/@mui/x-data-grid')) {
            return 'mui-datagrid';
          }
          // Emotion styling
          if (id.includes('node_modules/@emotion')) {
            return 'emotion';
          }
          // Redux and state management
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/react-redux') || id.includes('node_modules/redux-persist')) {
            return 'redux';
          }
          // Data fetching libraries
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/axios')) {
            return 'data-fetching';
          }
          // Charts and visualization (lazy loaded)
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // Video calling (lazy loaded)
          if (id.includes('node_modules/twilio-video')) {
            return 'twilio-video';
          }
          // Form libraries
          if (id.includes('node_modules/formik') || id.includes('node_modules/yup')) {
            return 'forms';
          }
          // Date handling
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // Utilities
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          // Socket.io for real-time features
          if (id.includes('node_modules/socket.io-client')) {
            return 'socketio';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Asset file naming with hash for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          // Images - organized by format for CDN optimization
          if (/png|jpe?g|webp|avif/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          // SVG icons and graphics
          if (/svg/i.test(ext || '')) {
            return `assets/icons/[name]-[hash][extname]`;
          }
          // Other image formats
          if (/gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          // Fonts - separate for aggressive caching
          if (/woff2?|ttf|eot|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          // CSS files
          if (/css/i.test(ext || '')) {
            return `assets/css/[name]-[hash][extname]`;
          }
          // Other assets
          return `assets/[name]-[hash][extname]`;
        },
        // JS chunks with semantic names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId || '';
          // Route-based chunks get descriptive names
          if (facadeModuleId.includes('/apps/')) {
            const match = facadeModuleId.match(/\/apps\/([^/]+)/);
            if (match) {
              return `js/${match[1]}/[name]-[hash].js`;
            }
          }
          return 'js/[name]-[hash].js';
        },
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'date-fns',
    ],
    // Force esbuild to transform date-fns properly
    esbuildOptions: {
      target: 'es2020',
    },
  },

  define: {
    'process.env': {},
  },
});
