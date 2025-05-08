import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { animationVariants, AnimationType } from '../../lib/animations'; // Ajuste o caminho

interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  /** Tipo de animação de entrada/saída predefinida */
  animationType?: AnimationType;
  /** Se true, não aplica animações predefinidas (útil para controle manual) */
  noDefaultAnimation?: boolean;
}

/**
 * Um wrapper simples para motion.div que aplica animações
 * de entrada/saída predefinidas. Use dentro de <AnimatePresence /> 
 * para que as animações de saída funcionem.
 */
export const AnimatedDiv: React.FC<AnimatedDivProps> = ({
  animationType = 'fadeSlideUp', // Default animation
  noDefaultAnimation = false,
  variants,
  initial,
  animate,
  exit,
  children,
  ...rest
}) => {

  const defaultVariants = noDefaultAnimation ? undefined : animationVariants[animationType];

  return (
    <motion.div
      // Prioriza variantes passadas via props, senão usa as padrões
      variants={variants ?? defaultVariants}
      initial={initial ?? "hidden"}
      animate={animate ?? "visible"}
      exit={exit ?? "exit"}
      {...rest} // Passa outras props (className, style, etc.)
    >
      {children}
    </motion.div>
  );
};

// Exemplo de Uso:
// import { AnimatePresence } from 'framer-motion';
// 
// {isVisible && (
//   <AnimatePresence>
//     <AnimatedDiv animationType="scaleEnter" className="p-4 bg-blue-100">
//       Conteúdo que aparece/desaparece
//     </AnimatedDiv>
//   </AnimatePresence>
// )} 