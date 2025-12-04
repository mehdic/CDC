import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  useColorScheme,
  ColorSchemeName,
} from 'react-native';

/**
 * T2-054: Dark Mode Support for Mobile Apps
 * System preference detection, manual toggle, persistent storage
 */

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  disabled: string;
  skeleton: string;
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

const LIGHT_THEME: Theme = {
  isDark: false,
  colors: {
    primary: '#00897b',
    primaryLight: '#4db8a8',
    primaryDark: '#00695c',
    accent: '#ff6b6b',
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    text: '#212121',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    error: '#f44336',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    disabled: '#bdbdbd',
    skeleton: '#e0e0e0',
  },
};

const DARK_THEME: Theme = {
  isDark: true,
  colors: {
    primary: '#4db8a8',
    primaryLight: '#80cdc8',
    primaryDark: '#00897b',
    accent: '#ff8a80',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2c2c2c',
    text: '#ffffff',
    textSecondary: '#bbbbbb',
    textTertiary: '#999999',
    border: '#424242',
    error: '#ff5252',
    success: '#69f0ae',
    warning: '#ffb74d',
    info: '#42a5f5',
    disabled: '#616161',
    skeleton: '#424242',
  },
};

const DARK_MODE_STORAGE_KEY = '@metapharm/dark_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

interface DarkModeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);

interface DarkModeProviderProps {
  children: React.ReactNode;
}

/**
 * Dark mode provider component
 * Wraps app to provide theme context to all components
 */
export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Load theme preference from storage
  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (saved) {
        setThemeModeState((saved as ThemeMode) || 'system');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Save theme preference to storage
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Determine current theme
  const isDarkMode =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode: ThemeMode =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(newMode);
  };

  const value: DarkModeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleDarkMode,
    isDarkMode,
  };

  if (!isLoaded) {
    return null; // Or render a splash screen
  }

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

/**
 * Hook to use dark mode context
 */
export function useDarkMode(): DarkModeContextType {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
}

/**
 * Hook to use theme colors
 */
export function useTheme(): Theme {
  return useDarkMode().theme;
}

/**
 * Hook to use theme colors (alias)
 */
export function useThemeColors(): ThemeColors {
  return useDarkMode().theme.colors;
}

/**
 * Helper to get color based on theme
 */
export function getThemedColor(
  lightColor: string,
  darkColor: string,
): (theme: Theme) => string {
  return (theme: Theme) => (theme.isDark ? darkColor : lightColor);
}

/**
 * Get light theme
 */
export function getLightTheme(): Theme {
  return LIGHT_THEME;
}

/**
 * Get dark theme
 */
export function getDarkTheme(): Theme {
  return DARK_THEME;
}

/**
 * Get theme by mode
 */
export function getThemeByMode(
  mode: ThemeMode,
  systemColorScheme: ColorSchemeName,
): Theme {
  const isDarkMode =
    mode === 'system'
      ? systemColorScheme === 'dark'
      : mode === 'dark';
  return isDarkMode ? DARK_THEME : LIGHT_THEME;
}
