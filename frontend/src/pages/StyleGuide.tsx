import React from 'react';
import { useTheme } from '../context/ThemeProvider'; // Ajuste o caminho se necessário
import { FiSun, FiMoon } from 'react-icons/fi'; // Ícones para o botão de tema

// Componente auxiliar para exibir uma amostra de cor
const ColorSwatch: React.FC<{ colorVar: string; name: string; className?: string }> = ({ colorVar, name, className = '' }) => (
  <div className={`flex flex-col items-center space-y-1 ${className}`}>
    <div 
      className="w-16 h-16 rounded-md border border-black/10 dark:border-white/10" 
      style={{ backgroundColor: `var(${colorVar})` }}
    />
    <span className="text-xs text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)]">{name}</span>
    <span className="text-[9px] font-mono text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)] opacity-75">{colorVar}</span>
  </div>
);

// Componente auxiliar para exibir texto com uma fonte específica
const TypeSample: React.FC<{ text: string; fontVar: string; className?: string }> = ({ text, fontVar, className = '' }) => (
  <p style={{ fontFamily: `var(${fontVar})` }} className={className}>
    {text} ({fontVar})
  </p>
);

// Componente auxiliar para exibir um card de exemplo
const ExampleCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
   <div className={`p-4 rounded-lg bg-[var(--color-card-bg-light)] dark:bg-[var(--color-card-bg-dark)] backdrop-blur-sm border border-black/5 dark:border-white/5 shadow-sm ${className}`}>
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        {children}
    </div>
);

const StyleGuide: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-gradient-to-br from-[var(--color-bg-gradient-start-light)] via-[var(--color-bg-gradient-via-light)] to-[var(--color-bg-gradient-end-light)] dark:from-[var(--color-bg-gradient-start-dark)] dark:via-[var(--color-bg-gradient-via-dark)] dark:to-[var(--color-bg-gradient-end-dark)] text-[var(--color-text-base-light)] dark:text-[var(--color-text-base-dark)] transition-colors duration-300">
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">VibeForge Style Guide</h1>
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full bg-[var(--color-panel-secondary-bg-light)] dark:bg-[var(--color-panel-secondary-bg-dark)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title={`Mudar para tema ${theme === 'light' ? 'Escuro' : 'Claro'}`}
        >
          {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
      </div>

      {/* Seção de Cores */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-black/10 dark:border-white/10 pb-2">Cores</h2>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Fundos e Painéis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             <ColorSwatch colorVar="--color-panel-bg-light" name="Panel BG (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-panel-bg-dark" name="Panel BG (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-panel-secondary-bg-light" name="Panel Secondary (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-panel-secondary-bg-dark" name="Panel Secondary (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-card-bg-light" name="Card BG (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-card-bg-dark" name="Card BG (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-modal-bg-light" name="Modal BG (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-modal-bg-dark" name="Modal BG (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-input-bg-light" name="Input BG (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-input-bg-dark" name="Input BG (Dark)" className="opacity-50 dark:opacity-100" />
          </div>
          <div className="mt-4 text-sm text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)]">
            Nota: Fundos de gradiente são aplicados globalmente (veja o fundo desta página).
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Texto</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             <ColorSwatch colorVar="--color-text-base-light" name="Base (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-text-base-dark" name="Base (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-text-muted-light" name="Muted (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-text-muted-dark" name="Muted (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-text-accent-light" name="Accent (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-text-accent-dark" name="Accent (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-text-inverted-light" name="Inverted (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-text-inverted-dark" name="Inverted (Dark)" className="opacity-50 dark:opacity-100" />
           </div>
        </div>
         <div>
          <h3 className="text-lg font-medium mb-3">Bordas</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             <ColorSwatch colorVar="--color-border-light" name="Border (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-border-dark" name="Border (Dark)" className="opacity-50 dark:opacity-100" />
             <ColorSwatch colorVar="--color-border-accent-light" name="Accent Border (Light)" className="dark:opacity-50" />
             <ColorSwatch colorVar="--color-border-accent-dark" name="Accent Border (Dark)" className="opacity-50 dark:opacity-100" />
           </div>
        </div>
      </section>

      {/* Seção de Tipografia */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-black/10 dark:border-white/10 pb-2">Tipografia</h2>
        <TypeSample fontVar="--font-sans" text="Texto Principal (Sans-Serif): O VibeForge combina IA e colaboração." className="text-base" />
        <TypeSample fontVar="--font-sans" text="Texto Leve: Mais leve para descrições." className="text-base font-light" />
        <TypeSample fontVar="--font-sans" text="Texto Médio: Usado para subtítulos e ênfase." className="text-base font-medium" />
         <TypeSample fontVar="--font-sans" text="Texto Semi-bold: Títulos e destaques." className="text-base font-semibold" />
        <TypeSample fontVar="--font-mono" text="Texto Monoespaçado: Para código e dados. const value = 42;" className="text-sm" />
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">Título Nível 1 (3xl, bold)</h1>
            <h2 className="text-2xl font-semibold">Título Nível 2 (2xl, semibold)</h2>
            <h3 className="text-xl font-semibold">Título Nível 3 (xl, semibold)</h3>
            <h4 className="text-lg font-medium">Título Nível 4 (lg, medium)</h4>
            <p className="text-base">Parágrafo de texto normal (base). Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)]">Texto pequeno e mudo (sm, muted).</p>
        </div>
      </section>

      {/* Seção de Tokens de Design */}
       <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-black/10 dark:border-white/10 pb-2">Tokens de Design</h2>
        
         <div>
            <h3 className="text-lg font-medium mb-3">Border Radius</h3>
            <div className="flex flex-wrap gap-4">
                <div className="w-20 h-20 bg-[var(--color-card-bg-light)] dark:bg-[var(--color-card-bg-dark)] border border-black/10 dark:border-white/10 flex items-center justify-center text-xs" style={{borderRadius: 'var(--radius-sm)'}}>sm</div>
                <div className="w-20 h-20 bg-[var(--color-card-bg-light)] dark:bg-[var(--color-card-bg-dark)] border border-black/10 dark:border-white/10 flex items-center justify-center text-xs" style={{borderRadius: 'var(--radius-md)'}}>md</div>
                <div className="w-20 h-20 bg-[var(--color-card-bg-light)] dark:bg-[var(--color-card-bg-dark)] border border-black/10 dark:border-white/10 flex items-center justify-center text-xs" style={{borderRadius: 'var(--radius-lg)'}}>lg</div>
                <div className="w-20 h-20 bg-[var(--color-card-bg-light)] dark:bg-[var(--color-card-bg-dark)] border border-black/10 dark:border-white/10 flex items-center justify-center text-xs" style={{borderRadius: 'var(--radius-xl)'}}>xl</div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-3">Blur Intensity</h3>
            <div className="flex flex-wrap gap-4 items-center">
                 <div className="w-24 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-md relative">
                     <div className="absolute inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center text-xs font-semibold text-black/70" style={{backdropFilter: 'blur(var(--blur-intensity))'}}>--blur-intensity</div>
                 </div>
                 <div className="w-24 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-md relative">
                     <div className="absolute inset-0 bg-white/30 backdrop-blur-lg flex items-center justify-center text-xs font-semibold text-black/70" style={{backdropFilter: 'blur(var(--blur-intensity-strong))'}}>--blur-intensity-strong</div>
                 </div>
                 <span className="text-sm text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)]">(Aplicado com `backdrop-blur-*`)</span>
            </div>
        </div>

         <div>
          <h3 className="text-lg font-medium mb-3">Sombras</h3>
           <div className="flex flex-wrap gap-4">
                <div className="w-24 h-12 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-xs" style={{boxShadow: '0 4px 6px -1px var(--color-shadow-light), 0 2px 4px -2px var(--color-shadow-light)'}}>Sombra Padrão</div>
                <div className="dark:opacity-100 opacity-50 w-24 h-12 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-xs" style={{boxShadow: '0 4px 6px -1px var(--color-shadow-dark), 0 2px 4px -2px var(--color-shadow-dark)'}}>(Dark Theme Shadow)</div>
           </div>
            <p className="text-xs mt-2 text-[var(--color-text-muted-light)] dark:text-[var(--color-text-muted-dark)]">Variáveis: --color-shadow-light, --color-shadow-dark. (Use com classes `shadow-*` do Tailwind)</p>
        </div>
      </section>
      
      {/* Seção de Exemplos Glass Morphism */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-black/10 dark:border-white/10 pb-2">Exemplos Glass Morphism</h2>
        <div className="grid md:grid-cols-2 gap-6">
            <ExampleCard title="Painel Primário">
                <p className="text-sm">Usa `var(--color-panel-bg-*)` e `backdrop-blur-md`.</p>
                <p className="text-xs mt-1">Fundo: {theme === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(23, 23, 31, 0.20)'}</p>
            </ExampleCard>
            <ExampleCard title="Card/Modal (Blur mais forte)">
                <p className="text-sm">Usa `var(--color-card-bg-*)` ou `var(--color-modal-bg-*)` e `backdrop-blur-lg`.</p>
                 <p className="text-xs mt-1">Fundo (Card): {theme === 'light' ? 'rgba(255, 255, 255, 0.40)' : 'rgba(30, 30, 40, 0.35)'}</p>
            </ExampleCard>
        </div>
      </section>
      
       {/* Seção de Componentes (Exemplo Básico) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-black/10 dark:border-white/10 pb-2">Componentes (Exemplo)</h2>
         <div className="flex flex-wrap gap-4 items-center">
             {/* Adicionar exemplos de AnimatedButton, AnimatedCard etc. se estiverem prontos e estáveis */}
             <button className="px-4 py-2 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors shadow-sm">
                 Botão Primário
             </button>
              <button className="px-4 py-2 rounded-md bg-[var(--color-panel-secondary-bg-light)] dark:bg-[var(--color-panel-secondary-bg-dark)] text-[var(--color-text-base-light)] dark:text-[var(--color-text-base-dark)] text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/10 dark:border-white/10">
                 Botão Secundário
             </button>
              {/* Exemplo com Animação (se AnimatedButton existir) */}
              {/* <AnimatedButton variant="subtleScale" className="...">Botão Animado</AnimatedButton> */}
         </div>
      </section>

    </div>
  );
};

export default StyleGuide; 