import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@apps': path.resolve(__dirname, './src/apps'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
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

  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
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
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
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
    ],
  },

  define: {
    'process.env': {},
  },
});
