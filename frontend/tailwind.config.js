/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Habilita o modo escuro baseado em classes
  theme: {
    extend: {
      colors: {
        // Tema principal
        primary: {
          DEFAULT: '#5c6ac4',
          50: '#f5f7ff',
          100: '#ebeefe',
          200: '#d6dbfc',
          300: '#b2bcf9',
          400: '#8594f4',
          500: '#5c6ac4',
          600: '#4c56be',
          700: '#3d45a5',
          800: '#343b87',
          900: '#2d326a',
          950: '#1a1d3d',
        },
        // Tema secundário
        secondary: {
          DEFAULT: '#14b8a6',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#022c22',
        },
        // Cores para barras e elementos de interface
        editor: {
          bg: '#1e1e1e',
          line: '#282828',
          widget: '#333333',
          foreground: '#d4d4d4',
        },
        // Cores para feedback
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      screens: {
        '3xl': '1920px',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      boxShadow: {
        menu: '0 4px 12px rgba(0, 0, 0, 0.15)',
        card: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}; 