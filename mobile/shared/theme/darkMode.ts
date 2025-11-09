/**
 * Dark Mode Theme (T275)
 * Dark mode support for mobile apps
 * System preference detection, manual toggle, persistent storage
 */

import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Storage key for theme preference
 */
const THEME_STORAGE_KEY = '@metapharm:theme';

/**
 * Light theme colors
 */
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Primary colors
    primary: '#007AFF',
    primaryDark: '#0056B3',
    primaryLight: '#66B3FF',

    // Secondary colors
    secondary: '#6C757D',
    secondaryDark: '#545B62',
    secondaryLight: '#ADB5BD',

    // Status colors
    success: '#28A745',
    successDark: '#1E7E34',
    successLight: '#5CB85C',

    danger: '#DC3545',
    dangerDark: '#BD2130',
    dangerLight: '#E4606D',

    warning: '#FFC107',
    warningDark: '#E0A800',
    warningLight: '#FFD54F',

    info: '#17A2B8',
    infoDark: '#117A8B',
    infoLight: '#5DADE2',

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#E9ECEF',

    // Surface colors
    surface: '#FFFFFF',
    surfaceVariant: '#F1F3F5',

    // Text colors
    text: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textDisabled: '#CED4DA',
    textInverse: '#FFFFFF',

    // Border colors
    border: '#DEE2E6',
    borderLight: '#E9ECEF',
    borderDark: '#CED4DA',

    // Card/Container colors
    card: '#FFFFFF',
    cardBorder: '#E9ECEF',

    // Input colors
    input: '#FFFFFF',
    inputBorder: '#CED4DA',
    inputPlaceholder: '#6C757D',
    inputDisabled: '#E9ECEF',

    // Shadow color
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

/**
 * Dark theme colors
 * Designed for healthcare context: low-light environments (night shifts, patient bedrooms)
 */
export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Primary colors (slightly adjusted for dark mode)
    primary: '#66B3FF',
    primaryDark: '#007AFF',
    primaryLight: '#99CCFF',

    // Secondary colors
    secondary: '#ADB5BD',
    secondaryDark: '#6C757D',
    secondaryLight: '#CED4DA',

    // Status colors (adjusted for better contrast on dark backgrounds)
    success: '#5CB85C',
    successDark: '#28A745',
    successLight: '#7EC97E',

    danger: '#E4606D',
    dangerDark: '#DC3545',
    dangerLight: '#ED969D',

    warning: '#FFD54F',
    warningDark: '#FFC107',
    warningLight: '#FFE082',

    info: '#5DADE2',
    infoDark: '#17A2B8',
    infoLight: '#85C1E9',

    // Background colors (dark theme)
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    backgroundTertiary: '#2D2D2D',

    // Surface colors
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',

    // Text colors (light text on dark background)
    text: '#FFFFFF',
    textSecondary: '#ADB5BD',
    textTertiary: '#6C757D',
    textDisabled: '#495057',
    textInverse: '#212529',

    // Border colors
    border: '#495057',
    borderLight: '#3D3D3D',
    borderDark: '#6C757D',

    // Card/Container colors
    card: '#1E1E1E',
    cardBorder: '#3D3D3D',

    // Input colors
    input: '#2D2D2D',
    inputBorder: '#495057',
    inputPlaceholder: '#6C757D',
    inputDisabled: '#3D3D3D',

    // Shadow color
    shadow: '#000000',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  fontSize: lightTheme.fontSize,
  fontWeight: lightTheme.fontWeight,
};

/**
 * Theme type
 */
export type Theme = typeof lightTheme;

/**
 * Get theme based on mode
 */
export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

/**
 * Get system theme preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

/**
 * Get stored theme preference
 */
export const getStoredThemeMode = async (): Promise<ThemeMode> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.error('Error reading stored theme:', error);
  }
  return 'system'; // Default to system preference
};

/**
 * Set theme preference
 */
export const setThemeMode = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Error storing theme:', error);
  }
};

/**
 * Resolve theme mode to actual theme
 */
export const resolveThemeMode = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
};

/**
 * Use theme hook
 * Returns current theme and functions to manage it
 */
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from storage
  useEffect(() => {
    const initTheme = async () => {
      const stored = await getStoredThemeMode();
      setThemeModeState(stored);
      setIsLoading(false);
    };
    initTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        // Force re-render when system theme changes
        setThemeModeState('system');
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  // Resolve current theme
  const currentTheme =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const theme = getTheme(currentTheme);

  // Change theme mode
  const changeThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setThemeMode(mode);
  };

  // Toggle between light and dark (ignores system)
  const toggleTheme = async () => {
    const newMode = currentTheme === 'dark' ? 'light' : 'dark';
    await changeThemeMode(newMode);
  };

  return {
    theme,
    themeMode,
    currentTheme,
    isLoading,
    isDarkMode: currentTheme === 'dark',
    changeThemeMode,
    toggleTheme,
  };
};

/**
 * Theme context type (for creating React Context)
 */
export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  isDarkMode: boolean;
  changeThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

/**
 * Export default
 */
export default {
  lightTheme,
  darkTheme,
  getTheme,
  getSystemTheme,
  getStoredThemeMode,
  setThemeMode,
  resolveThemeMode,
  useTheme,
};
