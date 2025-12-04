import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a theme for tests
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  withQueryClient?: boolean;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { withRouter = false, withQueryClient = false, ...renderOptions } = options || {};

  let queryClient: QueryClient | null = null;
  if (withQueryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  }

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Always wrap with ThemeProvider first - it's required for MUI components
    return (
      <ThemeProvider theme={theme}>
        {withRouter ? (
          <BrowserRouter>
            {queryClient ? (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            ) : (
              children
            )}
          </BrowserRouter>
        ) : queryClient ? (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ) : (
          children
        )}
      </ThemeProvider>
    );
  };

  return {
    ...rtlRender(ui, { wrapper: AllTheProviders, ...renderOptions }),
    queryClient,
  };
};

export * from '@testing-library/react';
export { customRender as render };
