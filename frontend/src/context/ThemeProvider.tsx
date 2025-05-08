import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

interface ThemeContextProps {
  theme: Theme; // This will always be the resolved 'light' or 'dark'
  themePreference: ThemePreference; // The user's preference, can be 'system'
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemePreference;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}) => {
  // Estados separados para preferência e tema resolvido
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        return storedTheme as ThemePreference;
      }
      return defaultTheme;
    } catch (e) {
      console.error('Error reading localStorage for theme preference, falling back.', e);
      return defaultTheme;
    }
  });

  // Resolve para 'light' ou 'dark' com base na preferência e configuração do sistema
  const resolveTheme = useCallback((preference: ThemePreference): Theme => {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preference;
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => resolveTheme(themePreference));

  // Efeito para atualizar o tema no DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Efeito para salvar preferência no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, themePreference);
    } catch (e) {
      console.error('Error saving theme to localStorage.', e);
    }
  }, [themePreference, storageKey]);

  // Efeito para escutar mudanças no sistema se preferência for "system"
  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    
    // Inscrever no evento
    mediaQuery.addEventListener('change', handleChange);
    
    // Certificar que tema atual está correto
    handleChange();
    
    // Limpar listener
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference, resolveTheme]);

  // Atualizar tema resolvido quando a preferência mudar
  useEffect(() => {
    setResolvedTheme(resolveTheme(themePreference));
  }, [themePreference, resolveTheme]);

  // Handler para alternância de tema
  const toggleTheme = useCallback(() => {
    setThemePreference(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system'; // Ciclo completo: system -> light -> dark -> system
    });
  }, []);

  // Handler para definir tema diretamente
  const setThemeHandler = useCallback((newTheme: ThemePreference) => {
    setThemePreference(newTheme);
  }, []);

  // Memoizar value para evitar renderizações desnecessárias
  const value = useMemo(() => ({
    theme: resolvedTheme,
    themePreference,
    toggleTheme,
    setTheme: setThemeHandler
  }), [resolvedTheme, themePreference, toggleTheme, setThemeHandler]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 