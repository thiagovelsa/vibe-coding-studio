import React from 'react';
import { useTheme } from '../../context/ThemeContext'; // Ajuste o caminho

interface ThemedPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Exemplo de um painel que usa o ThemeContext para aplicar
 * estilos de glass morphism consistentes para temas claro e escuro.
 */
export const ThemedPanel: React.FC<ThemedPanelProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  // --- Define as classes base e as variantes por tema ---
  // Níveis de transparência podem variar aqui (ex: 15-25%)
  const backgroundClass = theme === 'dark' 
    ? 'bg-slate-900/20' // Fundo escuro semi-transparente
    : 'bg-white/25';    // Fundo claro semi-transparente

  const textClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const borderClass = theme === 'dark' ? 'border-white/5' : 'border-black/5'; // Borda muito sutil

  return (
    <div
      className={`
        p-4 rounded-xl shadow-lg 
        ${backgroundClass} 
        ${textClass} 
        ${borderClass} border // Aplica a borda sutil
        backdrop-blur-md 
        transition-colors duration-300 ease-in-out // Transição suave
        ${className} // Permite classes adicionais
      `}
    >
      {children}
    </div>
  );
};

// Exemplo de como usar:
// <ThemedPanel>
//   <p>Conteúdo do painel</p>
// </ThemedPanel> 