import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeName, themes } from './tokens';

type Preference = ThemeName | 'system';

interface ThemeContextValue {
  theme: Theme;
  preference: Preference;
  setPreference: (p: Preference) => void;
}

const KEY = 'shift.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<Preference>('dark');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'dark') setPreferenceState(v);
      })
      .catch(() => {
        // A missing or unreadable preference just means we use dark. Not worth surfacing.
      });
  }, []);

  const setPreference = useCallback((p: Preference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const resolved: ThemeName = 'dark';
    return { theme: themes[resolved], preference, setPreference };
  }, [preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used inside <ThemeProvider>');
  return { preference: ctx.preference, setPreference: ctx.setPreference };
}
