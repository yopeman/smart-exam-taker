import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightColors, darkColors, ColorScheme } from './colors';
import { baseFontSizes } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  colors: typeof lightColors;
  typography: {
    scale: number;
    sizes: Record<keyof typeof baseFontSizes, number>;
  };
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  setTextScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME_MODE: 'set_theme_mode',
  TEXT_SCALE: 'set_text_scale',
};

function getSystemScheme(): ColorScheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const systemQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

const calculateFontSizes = (scale: number) => {
  return Object.entries(baseFontSizes).reduce((acc, [key, value]) => {
    acc[key as keyof typeof baseFontSizes] = Math.round(value * scale);
    return acc;
  }, {} as Record<keyof typeof baseFontSizes, number>);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [textScale, setTextScaleState] = useState(1.0);
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(() => getSystemScheme());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
    const savedScale = localStorage.getItem(STORAGE_KEYS.TEXT_SCALE);
    if (savedMode) setThemeModeState(savedMode);
    if (savedScale) setTextScaleState(parseFloat(savedScale));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!systemQuery) return;
    const handler = () => setSystemScheme(getSystemScheme());
    systemQuery.addEventListener('change', handler);
    return () => systemQuery.removeEventListener('change', handler);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch {
      // ignore
    }
  };

  const setTextScale = (scale: number) => {
    const clamped = Math.max(0.8, Math.min(1.2, scale));
    setTextScaleState(clamped);
    try {
      localStorage.setItem(STORAGE_KEYS.TEXT_SCALE, clamped.toString());
    } catch {
      // ignore
    }
  };

  const effectiveColorScheme: ColorScheme =
    themeMode === 'system' ? systemScheme : themeMode;

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveColorScheme;
  }, [effectiveColorScheme]);

  const theme: Theme = {
    mode: themeMode,
    colors: effectiveColorScheme === 'light' ? lightColors : darkColors,
    typography: {
      scale: textScale,
      sizes: calculateFontSizes(textScale),
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