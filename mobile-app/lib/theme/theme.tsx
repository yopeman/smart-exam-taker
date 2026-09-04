import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorScheme } from './colors';
import { baseFontSizes, fontWeights, lineHeights, letterSpacing } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  colors: typeof lightColors;
  typography: {
    scale: number;
    sizes: typeof baseFontSizes;
    weights: typeof fontWeights;
    lineHeights: typeof lineHeights;
    letterSpacing: typeof letterSpacing;
  };
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  setTextScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME_MODE: '@theme_mode',
  TEXT_SCALE: '@text_scale',
};

const calculateFontSizes = (scale: number): typeof baseFontSizes => {
  return Object.entries(baseFontSizes).reduce((acc, [key, value]) => {
    acc[key as keyof typeof baseFontSizes] = Math.round((value as number) * scale);
    return acc;
  }, {} as typeof baseFontSizes);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [textScale, setTextScaleState] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      const savedScale = await AsyncStorage.getItem(STORAGE_KEYS.TEXT_SCALE);
      
      if (savedMode) setThemeModeState(savedMode as ThemeMode);
      if (savedScale) setTextScaleState(parseFloat(savedScale));
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setTextScale = async (scale: number) => {
    const clampedScale = Math.max(0.8, Math.min(1.2, scale));
    setTextScaleState(clampedScale);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEXT_SCALE, clampedScale.toString());
    } catch (error) {
      console.error('Failed to save text scale:', error);
    }
  };

  const effectiveColorScheme: ColorScheme = 
    themeMode === 'system' 
      ? (systemColorScheme as ColorScheme) || 'light'
      : themeMode;

  const theme: Theme = {
    mode: themeMode,
    colors: effectiveColorScheme === 'light' ? lightColors : darkColors,
    typography: {
      scale: textScale,
      sizes: calculateFontSizes(textScale),
      weights: fontWeights,
      lineHeights,
      letterSpacing,
    },
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, setTextScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
