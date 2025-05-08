import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext'; // Ajuste o caminho
import { animationVariants, hoverScale } from '../../lib/animations'; // Ajuste o caminho

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, 'variants'> {
  children: React.ReactNode;
  className?: string;
  applyHoverScale?: boolean;
}

/**
 * Exemplo de um componente de Card que aplica animações
 * de entrada (fadeSlideUp por padrão) e hover (scale).
 * Use dentro de <AnimatePresence /> se precisar de animação de saída.
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  applyHoverScale = true,
  ...rest
}) => {
  const { theme } = useTheme();

  const cardBg = theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/60';

  return (
    <motion.div
      className={`p-4 rounded-lg shadow-md ${cardBg} backdrop-blur-sm ${className}`}
      variants={animationVariants.fadeSlideUp} // Animação de entrada padrão
      initial="hidden"
      animate="visible"
      exit="exit" // Funcionará se envolvido por AnimatePresence
      whileHover={applyHoverScale ? hoverScale : undefined}
      layout // Anima layout changes smoothly
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// Exemplo de Uso:
// <AnimatedCard className="w-full">
//   <h3>Título do Card</h3>
//   <p>Conteúdo...</p>
// </AnimatedCard> 