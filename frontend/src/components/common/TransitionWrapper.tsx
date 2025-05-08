import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  fadeSlideUp,
  fadeSlideDown,
  scaleEnter,
  scaleFade,
  elasticScale,
  fade, 
  bounceIn
} from '../../lib/animations';

// Tipos de animações disponíveis
export type TransitionType = 
  | 'fade'
  | 'fadeUp' 
  | 'fadeDown'
  | 'scale'
  | 'scaleFade'
  | 'elasticScale'
  | 'bounce'
  | 'none';

interface TransitionWrapperProps {
  children: ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  isVisible?: boolean;
  exitBeforeEnter?: boolean;
  className?: string;
  customVariants?: Variants;
  layoutId?: string;
  onAnimationComplete?: () => void;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  type = 'fade',
  duration = 0.3,
  delay = 0,
  isVisible = true,
  exitBeforeEnter = false,
  className = '',
  customVariants,
  layoutId,
  onAnimationComplete,
  staggerChildren = false,
  staggerDelay = 0.1
}) => {
  // Seleciona as variantes de animação com base no tipo
  const getVariants = (): Variants => {
    if (customVariants) return customVariants;

    switch (type) {
      case 'fadeUp':
        return fadeSlideUp;
      case 'fadeDown':
        return fadeSlideDown;
      case 'scale':
        return scaleEnter;
      case 'scaleFade':
        return scaleFade;
      case 'elasticScale':
        return elasticScale;
      case 'bounce':
        return bounceIn;
      case 'fade':
        return fade;
      case 'none':
        return {
          hidden: { opacity: 1 },
          visible: { opacity: 1 },
          exit: { opacity: 1 }
        };
      default:
        return fade;
    }
  };

  // Configurações de transição
  const transition = {
    duration,
    delay,
    ease: [0.25, 0.1, 0.25, 1], // curva de easing padrão
  };

  // Configurações para staggering children
  const containerVariants = staggerChildren ? {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      }
    }
  } : undefined;

  return (
    <AnimatePresence mode={exitBeforeEnter ? 'wait' : 'sync'} onExitComplete={onAnimationComplete}>
      {isVisible && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants || getVariants()}
          transition={containerVariants ? undefined : transition}
          layoutId={layoutId}
          onAnimationComplete={() => {
            if (onAnimationComplete) onAnimationComplete();
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente para animar items com stagger
export const StaggerContainer: React.FC<
  TransitionWrapperProps & { as?: React.ElementType }
> = ({
  children,
  as: Component = 'div',
  staggerDelay = 0.05,
  delay = 0.1,
  className = '',
  ...rest
}) => {
  return (
    <TransitionWrapper
      staggerChildren
      staggerDelay={staggerDelay}
      delay={delay}
      className={className}
      {...rest}
    >
      <Component className="w-full">
        {children}
      </Component>
    </TransitionWrapper>
  );
};

// Componente para os itens dentro de um container com stagger
export const StaggerItem: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: 'spring', 
            stiffness: 400, 
            damping: 20,
            delay
          }
        },
        exit: { 
          opacity: 0, 
          y: 10,
          transition: { duration: 0.2 }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Componente para animações de página inteira
export const PageTransition: React.FC<{
  children: ReactNode;
  type?: TransitionType;
  className?: string;
}> = ({ 
  children, 
  type = 'fadeUp',
  className = 'w-full h-full' 
}) => {
  return (
    <TransitionWrapper
      type={type}
      duration={0.4}
      className={className}
    >
      {children}
    </TransitionWrapper>
  );
}; 