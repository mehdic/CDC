import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import App from './App';
import { register as registerServiceWorker } from '@shared/utils/serviceWorkerRegistration';
import { performanceMonitor } from '@shared/utils/performanceMonitor';
import { initCDNConnections } from '@shared/utils/cdnConfig';
import { initAssetPreloading } from '@shared/utils/assetPreloader';
import { initSentry } from './config/sentry';

// Initialize i18n (must be imported before App)
import './i18n/config';

// Initialize Sentry error tracking (before everything else)
initSentry();

// Initialize CDN connections early for faster asset loading
initCDNConnections();
initAssetPreloading();

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f73378',
      dark: '#9a0036',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Render the app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Loading fallback for i18n Suspense
const I18nLoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Suspense fallback={<I18nLoadingFallback />}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Suspense>
  </React.StrictMode>
);

// Register service worker for caching (T2-045)
registerServiceWorker({
  onSuccess: () => {
    console.log('[ServiceWorker] Content cached for offline use');
  },
  onUpdate: () => {
    console.log('[ServiceWorker] New content available; please refresh');
    // Optional: Show notification to user about update
  },
});

// Initialize performance monitoring (T2-043 to T2-048)
if (process.env.NODE_ENV === 'development') {
  // In development, report metrics after 10 seconds
  setTimeout(() => {
    const grade = performanceMonitor.getGrade();
    console.log('[Performance] Grade:', grade.grade, `(${grade.score}/100)`);
    if (grade.issues.length > 0) {
      console.warn('[Performance] Issues detected:');
      grade.issues.forEach((issue) => console.warn(`  - ${issue}`));
    }
  }, 10000);
}
