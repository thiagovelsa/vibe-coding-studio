import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { hoverScale, tapScale, focusVisibleVariant } from '../../lib/animations'; // Ajuste o caminho
import { cn } from '../../lib/utils';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, 'whileTap' | 'whileHover' | 'whileFocus'> {
  // Props específicas do botão, se houver
  disableDefaultAnimations?: boolean; // Para desabilitar hover/tap padrão
  className?: string;
}

/**
 * Um componente de botão que aplica animações padrão
 * de hover (escala) e tap (escala). 
 * Outras animações (como entrada/saída) devem ser 
 * aplicadas externamente ou via props.
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  disableDefaultAnimations = false,
  className,
  ...rest
}) => {
  const variants = {
    hover: !disableDefaultAnimations ? hoverScale : undefined,
    tap: !disableDefaultAnimations ? tapScale : undefined,
  };

  return (
    <motion.button
      className={cn("px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2", className)}
      variants={variants}
      whileHover="hover"
      whileTap="tap"
      // whileFocus={focusVisibleVariant} // Aplica glow/outline no foco (verificar acessibilidade)
      {...rest} // Passa outras props (className, onClick, etc.)
    >
      {children}
    </motion.button>
  );
};

// Exemplo de Uso:
// <AnimatedButton 
//   className="px-4 py-2 bg-blue-500 text-white rounded"
//   onClick={() => console.log('Clicked')}
// >
//   Clique Aqui
// </AnimatedButton> 