import { useContext } from 'react';
import { ThemeContext, ColorScheme, FontSize } from '../context/ThemeContext';

/**
 * Hook para acessar as funcionalidades de gerenciamento de tema
 * @returns Funções e estado para controlar o tema da aplicação
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
}

/**
 * Hook simplificado que retorna apenas as funções mais comuns para controle do tema
 * @returns Funções simplificadas para controlar o tema
 */
export function useSimpleTheme() {
  const { 
    currentTheme, 
    effectiveTheme, 
    settings, 
    toggleTheme, 
    setThemeMode,
    setColorScheme,
    setFontSize 
  } = useTheme();
  
  return {
    currentTheme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    colorScheme: settings.colorScheme,
    fontSize: settings.fontSize,
    fontFamily: settings.fontFamily,
    
    // Funções simplificadas
    toggleTheme,
    setThemeMode,
    setColorScheme,
    setFontSize,
    
    // Funções de conveniência
    setDarkTheme: () => setThemeMode('dark'),
    setLightTheme: () => setThemeMode('light'),
    setSystemTheme: () => setThemeMode('system'),
  };
}

/**
 * Hook para obter classes CSS baseadas no tema atual
 * @returns Funções para obter classes CSS condicionais
 */
export function useThemeClasses() {
  const { effectiveTheme, settings } = useTheme();
  const isDark = effectiveTheme === 'dark';
  
  return {
    // Função para condicionar classes baseadas no tema
    getConditionalClasses: (
      options: { 
        base?: string; 
        light?: string; 
        dark?: string;
        colorScheme?: Record<ColorScheme, string>;
        fontSize?: Record<FontSize, string>;
      }
    ) => {
      const classes: string[] = [];
      
      if (options.base) {
        classes.push(options.base);
      }
      
      if (isDark && options.dark) {
        classes.push(options.dark);
      } else if (!isDark && options.light) {
        classes.push(options.light);
      }
      
      if (options.colorScheme && options.colorScheme[settings.colorScheme]) {
        classes.push(options.colorScheme[settings.colorScheme]);
      }
      
      if (options.fontSize && options.fontSize[settings.fontSize]) {
        classes.push(options.fontSize[settings.fontSize]);
      }
      
      return classes.join(' ');
    },
    
    // Classes comuns baseadas no tema
    text: isDark ? 'text-gray-200' : 'text-gray-800',
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark 
      ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500',
    button: isDark
      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    primary: isDark
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white',
  };
} 