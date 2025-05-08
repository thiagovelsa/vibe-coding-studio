/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita o modo escuro baseado em classe no HTML
  theme: {
    extend: {
      // Mapeia variáveis CSS para nomes de cores do Tailwind
      colors: {
        // Cores Semânticas
        background: {
          DEFAULT: 'transparent', // O gradiente é aplicado no body
        },
        panel: {
          DEFAULT: 'var(--color-panel-bg-light)',
          secondary: 'var(--color-panel-secondary-bg-light)',
          dark: 'var(--color-panel-bg-dark)',
          darkSecondary: 'var(--color-panel-secondary-bg-dark)',
        },
        card: {
          DEFAULT: 'var(--color-card-bg-light)',
          dark: 'var(--color-card-bg-dark)',
        },
        modal: {
          DEFAULT: 'var(--color-modal-bg-light)',
          dark: 'var(--color-modal-bg-dark)',
        },
        input: {
          DEFAULT: 'var(--color-input-bg-light)',
          dark: 'var(--color-input-bg-dark)',
        },
        text: {
          DEFAULT: 'var(--color-text-base-light)',
          muted: 'var(--color-text-muted-light)',
          accent: 'var(--color-text-accent-light)',
          inverted: 'var(--color-text-inverted-light)',
          dark: 'var(--color-text-base-dark)',
          darkMuted: 'var(--color-text-muted-dark)',
          darkAccent: 'var(--color-text-accent-dark)',
          darkInverted: 'var(--color-text-inverted-dark)',
        },
        border: {
          DEFAULT: 'var(--color-border-light)',
          accent: 'var(--color-border-accent-light)',
          dark: 'var(--color-border-dark)',
          darkAccent: 'var(--color-border-accent-dark)',
        },
        // Acentos específicos se necessário (use as cores base do Tailwind ou defina mais)
        accent: {
          DEFAULT: 'var(--color-text-accent-light)', // Roxo claro
          dark: 'var(--color-text-accent-dark)',     // Roxo escuro
        },
      },
      // Mapeia variáveis de raio
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      // Mapeia variáveis de blur (útil para consistência)
      backdropBlur: {
        DEFAULT: 'var(--blur-intensity)',
        strong: 'var(--blur-intensity-strong)',
      },
      // Mapeia variáveis de sombra (ou use as do Tailwind)
      boxShadow: {
         subtle: '0 1px 3px 0 var(--color-shadow-light)', // Exemplo sombra clara
         darkSubtle: '0 2px 5px 0 var(--color-shadow-dark)', // Exemplo sombra escura
      },
      // Define as fontes
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [
    // Adicione plugins se necessário (ex: para scrollbars customizadas em Firefox)
    // require('@tailwindcss/forms'),
  ],
} 