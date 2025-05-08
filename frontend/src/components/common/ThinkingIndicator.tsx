import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext'; // Ajuste o caminho

interface ThinkingIndicatorProps {
  text?: string; // Texto opcional a ser exibido (ex: "Gerando código...")
  agentType?: 'coder' | 'product' | 'tester' | 'security' | 'generic'; // Para variações futuras
  className?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  text = 'Processando...',
  agentType = 'generic',
  className = '',
}) => {
  const { theme } = useTheme();

  // --- Estilos Dinâmicos ---
  const containerBg = theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-100/40';
  const dotColor = theme === 'dark' ? 'bg-purple-400/70' : 'bg-purple-500/70';
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const glowColor = theme === 'dark' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(139, 92, 246, 0.15)'; // violet-400 / violet-500 com opacidade baixa

  // --- Animações Framer Motion ---
  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      boxShadow: [
        `0 0 0px 0px ${glowColor}`,
        `0 0 8px 2px ${glowColor}`,
        `0 0 0px 0px ${glowColor}`,
      ],
      transition: {
        opacity: { duration: 0.3, ease: 'easeOut' },
        y: { duration: 0.3, ease: 'easeOut' },
        boxShadow: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
      },
    },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const dotContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15, // Efeito escalonado nos pontos
      },
    },
  };

  const dotVariants = {
    initial: { y: 0, opacity: 0.5 },
    animate: {
      y: [0, -3, 0], // Animação sutil de pulso vertical
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className={`flex items-center space-x-2 p-3 rounded-lg ${containerBg} backdrop-blur-sm border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} w-fit max-w-[85%] ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout // Ajuda na animação se o tamanho mudar
    >
      <motion.div
        className="flex space-x-1.5"
        variants={dotContainerVariants}
        // initial="initial" // O initial/animate principal está no container pai
        // animate="animate"
      >
        <motion.div className={`w-2 h-2 ${dotColor} rounded-full`} variants={dotVariants} />
        <motion.div className={`w-2 h-2 ${dotColor} rounded-full`} variants={dotVariants} />
        <motion.div className={`w-2 h-2 ${dotColor} rounded-full`} variants={dotVariants} />
      </motion.div>
      {text && (
        <span className={`text-xs font-medium ${textColor}`}>{text}</span>
      )}
    </motion.div>
  );
};

// export default ThinkingIndicator; 