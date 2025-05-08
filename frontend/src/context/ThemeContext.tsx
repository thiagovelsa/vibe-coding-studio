import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  fontFamily: string;
  customCSS?: string;
  customColors?: Record<string, string>;
}

interface ThemeContextProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('system'); // Default, será sobrescrito
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Efeito para carregar tema inicial (localStorage > system > default)
  useEffect(() => {
    const storedTheme = localStorage.getItem('vibeforge-theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    setIsInitialLoad(false); // Marca que o carregamento inicial terminou
  }, []);

  // Efeito para aplicar classe e salvar no localStorage (apenas após load inicial e se mudado)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);

    // Só salva no localStorage após o carregamento inicial para não sobrescrever
    // a preferência do sistema desnecessariamente na primeira visita.
    if (!isInitialLoad) {
        try {
            localStorage.setItem('vibeforge-theme', theme);
        } catch (e) {
            console.error("Failed to save theme to localStorage", e);
        }
    }
  }, [theme, isInitialLoad]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    // A mudança de estado acionará o useEffect acima para salvar e aplicar a classe
  }, []);

  // Garante que o provider só renderize o conteúdo após o tema inicial ser definido
  // para evitar flickering (embora a classe no root ajude mais)
  if (isInitialLoad) {
      return null; // Ou um spinner/placeholder
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 