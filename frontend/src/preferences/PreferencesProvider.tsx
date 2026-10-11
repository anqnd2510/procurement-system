import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { i18n } from '../i18n';

export type Language = 'en' | 'vi';
export type Theme = 'light' | 'dark';

interface PreferencesValue {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);
const LANGUAGE_KEY = 'supplydesk.language';
const THEME_KEY = 'supplydesk.theme';

function readPreference<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return valid.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    readPreference(LANGUAGE_KEY, ['en', 'vi'], 'en'),
  );
  const [theme, setTheme] = useState<Theme>(() =>
    readPreference(THEME_KEY, ['light', 'dark'], 'light'),
  );

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Keep the selected language for this page load if storage is unavailable.
    }
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme selection still works for this page load without persistent storage.
    }
  }, [theme]);

  const value = useMemo<PreferencesValue>(
    () => ({
      language,
      theme,
      setLanguage: setLanguageState,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [language, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return value;
}
