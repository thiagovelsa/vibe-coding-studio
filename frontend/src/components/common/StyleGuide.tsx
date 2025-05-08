import React from 'react';
import { useTheme } from '../../context/ThemeContext'; // Ajuste o caminho
import { AnimatedButton } from './AnimatedButton'; // Importa botão animado
import { FiZap } from 'react-icons/fi';

// Componente auxiliar para mostrar amostras de cores
const ColorSample: React.FC<{ name: string; className: string; textColorClass?: string }> = 
  ({ name, className, textColorClass = 'text-xs' }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-8 h-8 rounded ${className}`}></div>
      <span className={`text-xs ${textColorClass}`}>{name}</span>
    </div>
);

// Componente auxiliar para mostrar seções do guia
const StyleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8 p-4 border border-border dark:border-border-dark rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export const StyleGuide: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="p-6 space-y-8 bg-panel dark:bg-panel-dark rounded-lg shadow-lg backdrop-blur-md text-text dark:text-text-dark">
      <h2 className="text-2xl font-bold mb-6">Guia de Estilos - VibeForge Glass Morphism</h2>

      {/* Tipografia */}
      <StyleSection title="Tipografia (Fontes: Sans e Mono)">
        <p className="font-sans text-4xl font-bold">Título Principal (Sans Bold)</p>
        <p className="font-sans text-2xl font-semibold">Subtítulo (Sans Semibold)</p>
        <p className="font-sans text-base">Parágrafo normal (Sans Regular). Lorem ipsum dolor sit amet.</p>
        <p className="font-sans text-sm text-text-muted dark:text-text-darkMuted">Texto Mudo (Sans Small)</p>
        <p className="font-mono text-base">Código/Mono Regular: `const example = true;`</p>
      </StyleSection>

      {/* Cores */}
      <StyleSection title="Paleta de Cores (Claro/Escuro)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSample name="Panel BG" className="bg-panel dark:bg-panel-dark border border-border dark:border-border-dark" />
          <ColorSample name="Panel Secondary" className="bg-panel-secondary dark:bg-panel-darkSecondary border border-border dark:border-border-dark" />
          <ColorSample name="Card BG" className="bg-card dark:bg-card-dark border border-border dark:border-border-dark" />
          <ColorSample name="Modal BG" className="bg-modal dark:bg-modal-dark border border-border dark:border-border-dark" />
          <ColorSample name="Input BG" className="bg-input dark:bg-input-dark border border-border dark:border-border-dark" />
          <ColorSample name="Text Base" className="bg-transparent" textColorClass="text-text dark:text-text-dark" />
          <ColorSample name="Text Muted" className="bg-transparent" textColorClass="text-text-muted dark:text-text-darkMuted" />
          <ColorSample name="Text Accent" className="bg-transparent" textColorClass="text-text-accent dark:text-text-darkAccent" />
          <ColorSample name="Border" className="border border-border dark:border-border-dark" />
          <ColorSample name="Border Accent" className="border border-border-accent dark:border-border-darkAccent" />
          <ColorSample name="Accent Color" className="bg-accent dark:bg-accent-dark" />
        </div>
      </StyleSection>
      
      {/* Raio da Borda */}
      <StyleSection title="Raio da Borda">
         <div className="flex space-x-4">
           <div className="w-16 h-16 bg-card dark:bg-card-dark rounded-sm border border-border dark:border-border-dark flex items-center justify-center text-xs">sm (8px)</div>
           <div className="w-16 h-16 bg-card dark:bg-card-dark rounded-md border border-border dark:border-border-dark flex items-center justify-center text-xs">md (12px)</div>
           <div className="w-16 h-16 bg-card dark:bg-card-dark rounded-lg border border-border dark:border-border-dark flex items-center justify-center text-xs">lg (16px)</div>
           <div className="w-16 h-16 bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark flex items-center justify-center text-xs">xl (24px)</div>
         </div>
      </StyleSection>

       {/* Botões */}
      <StyleSection title="Botões">
        <div className="flex flex-wrap gap-4 items-center">
          <AnimatedButton className="px-4 py-2 rounded-lg bg-accent dark:bg-accent-dark text-white text-sm font-medium shadow-subtle dark:shadow-darkSubtle">
             Botão Principal
          </AnimatedButton>
          <AnimatedButton className="px-4 py-2 rounded-lg bg-panel dark:bg-panel-dark text-text dark:text-text-dark border border-border dark:border-border-dark text-sm font-medium">
             Botão Secundário
          </AnimatedButton>
           <AnimatedButton className="p-2 rounded-full bg-panel dark:bg-panel-dark text-text-muted dark:text-text-darkMuted border border-border dark:border-border-dark">
             <FiZap/>
          </AnimatedButton>
        </div>
      </StyleSection>

      {/* Exemplo de Card */}
      <StyleSection title="Exemplo de Card/Painel (Glass Morphism)">
        <div className="p-4 rounded-lg bg-card dark:bg-card-dark backdrop-blur shadow-subtle dark:shadow-darkSubtle border border-border dark:border-border-dark">
          <h4 className="font-semibold mb-2">Título do Card</h4>
          <p className="text-sm text-text-muted dark:text-text-darkMuted">Este card usa a cor de fundo `bg-card` ou `dark:bg-card-dark` com backdrop-blur e sombra/borda sutil.</p>
        </div>
      </StyleSection>

    </div>
  );
};

// export default StyleGuide; 