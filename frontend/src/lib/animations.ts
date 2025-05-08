import { Variants } from 'framer-motion';

// --- Configurações Base ---
const durationShort = 0.2; // Para microinterações
const durationMedium = 0.3; // Para entrada/saída geral
const durationLong = 0.5; // Para animações mais dramáticas
const easeDefault = [0.4, 0, 0.2, 1]; // Similar a easeInOutQuint
const easeOutQuint = [0.23, 1, 0.32, 1];
const easeElastic = [0.68, -0.6, 0.32, 1.6]; // Efeito de "esticar" elástico
const easeBackOut = [0.34, 1.56, 0.64, 1]; // Efeito de recuo

// --- Variantes de Entrada/Saída ---

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationMedium, ease: easeDefault } },
  exit: { opacity: 0, transition: { duration: durationShort, ease: easeDefault } },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 10 }, // Começa 10px abaixo
  visible: { opacity: 1, y: 0, transition: { duration: durationMedium, ease: easeOutQuint } },
  exit: { opacity: 0, y: 5, transition: { duration: durationShort, ease: easeDefault } }, // Sai subindo levemente
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -10 }, // Começa 10px acima
  visible: { opacity: 1, y: 0, transition: { duration: durationMedium, ease: easeOutQuint } },
  exit: { opacity: 0, y: -5, transition: { duration: durationShort, ease: easeDefault } }, // Sai descendo levemente
};

export const scaleEnter: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: durationMedium, ease: easeOutQuint } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: durationShort, ease: easeDefault } },
};

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: durationMedium, ease: easeOutQuint } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: durationShort, ease: easeDefault } 
  }
};

export const drawLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      pathLength: { duration: 0.5, ease: easeOutQuint },
      opacity: { duration: 0.25 }
    }
  },
  exit: { 
    pathLength: 0, 
    opacity: 0,
    transition: { duration: 0.25 } 
  }
};

export const elasticScale: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: durationLong, 
      ease: easeElastic,
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.7,
    transition: { duration: durationShort } 
  }
};

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: durationLong, 
      ease: easeBackOut,
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: 10,
    transition: { duration: durationShort } 
  }
};

// --- Variantes de Microinteração ---

export const hoverScale = { scale: 1.05 };
export const tapScale = { scale: 0.95 };
export const focusVisibleVariant = { scale: 1.05, boxShadow: '0 0 0 2px rgba(62, 207, 142, 0.8)' };

export const hoverTilt = { 
  rotate: 2, 
  scale: 1.02,
  transition: { duration: 0.2, ease: easeOutQuint }
};

export const hoverGlow = { 
  boxShadow: '0 0 8px 2px rgba(62, 207, 142, 0.4)',
  scale: 1.02,
  transition: { duration: 0.2 }
};

export const hoverSlideRight = {
  x: 4,
  transition: { duration: 0.2 }
};

// --- Variantes de Estado e Loading ---

export const subtlePulse = {
  scale: [1, 1.01, 1], // Pulso muito leve
  opacity: [0.85, 1, 0.85], // Pulso de opacidade
  transition: {
    duration: 2.0,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "mirror",
  },
};

export const loading = {
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "mirror",
  }
};

export const loadingDots = {
  scale: [0, 1, 0],
  opacity: [0, 1, 0],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "loop",
  }
};

export const loadingBounce = {
  y: ["0%", "-30%", "0%"],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "loop",
  }
};

export const loadingRotate = {
  rotate: [0, 360],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear",
    repeatType: "loop",
  }
};

export const loadingBar = {
  scaleX: [0, 1],
  transformOrigin: ["0%", "0%"],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "loop",
  }
};

export const success = {
  scale: [0.8, 1.1, 1],
  opacity: [0, 1, 1],
  transition: {
    duration: 0.4,
    ease: easeBackOut,
  }
};

export const error = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    ease: "easeInOut",
  }
};

// --- Variantes para transições de estado ---

export const transitionStates = {
  initial: { opacity: 0, scale: 0.9 },
  idle: { opacity: 1, scale: 1 },
  loading: { 
    opacity: 1, 
    scale: 1,
    transition: {
      repeat: Infinity,
      duration: 2,
      repeatType: "reverse",
    }
  },
  success: { 
    opacity: 1, 
    scale: 1, 
    y: [0, -5, 0],
    transition: { duration: 0.3, ease: easeBackOut } 
  },
  error: { 
    opacity: 1, 
    scale: 1, 
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.4 } 
  },
};

// --- Novas Variantes para Feedback Interativo ---

export const typewriterEffect: Variants = {
  hidden: { width: 0, opacity: 0 },
  visible: { 
    width: "100%", 
    opacity: 1,
    transition: { 
      duration: 0.8, 
      ease: easeOutQuint,
      staggerChildren: 0.03
    }
  },
  exit: { 
    width: 0, 
    opacity: 0,
    transition: { duration: 0.3 } 
  }
};

export const charVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 200 }
  }
};

export const progressArc: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      pathLength: { duration: 1, ease: easeOutQuint },
      opacity: { duration: 0.3 }
    }
  },
  exit: { 
    pathLength: 0, 
    opacity: 0,
    transition: { duration: 0.3 } 
  }
};

export const morphShape: Variants = {
  circle: { 
    borderRadius: "50%",
    transition: { duration: 0.5, ease: easeOutQuint }
  },
  square: { 
    borderRadius: "8px",
    transition: { duration: 0.5, ease: easeOutQuint }
  }
};

export const successIndicator: Variants = {
  hidden: { 
    pathLength: 0,
    opacity: 0,
    pathOffset: 0
  },
  visible: { 
    pathLength: 1,
    opacity: 1,
    pathOffset: 0,
    transition: { 
      pathLength: { duration: 0.5, ease: easeOutQuint },
      opacity: { duration: 0.3 }
    }
  }
};

export const notificationAppear: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    x: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    x: 0,
    transition: { 
      type: "spring", 
      damping: 15, 
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    x: 30,
    transition: { duration: 0.2 } 
  }
};

export const codeBlockAppear: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    height: 0
  },
  visible: { 
    opacity: 1, 
    y: 0,
    height: "auto",
    transition: { 
      height: { duration: 0.4, ease: easeOutQuint },
      opacity: { duration: 0.3, delay: 0.1 },
      y: { duration: 0.3, delay: 0.1 }
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    height: 0,
    transition: { 
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    } 
  }
};

// --- Atualização do agrupamento para Componentes ---

export const animationVariants = {
  fade,
  fadeSlideUp,
  fadeSlideDown,
  scaleEnter,
  scaleFade,
  elasticScale,
  bounceIn,
  drawLine,
  // Novos variants
  typewriterEffect,
  charVariant,
  progressArc,
  morphShape,
  successIndicator,
  notificationAppear,
  codeBlockAppear
};

export type AnimationType = keyof typeof animationVariants;

// Animation variants for components
export const variants = {
  // Fade in/out animations
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  } as Variants,
  
  // Scale animations
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  } as Variants,
  
  // Slide-in animations
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  } as Variants,
  
  slideInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  } as Variants,
  
  slideInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  } as Variants,
  
  slideInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  } as Variants,
  
  // Staggered list animations
  listItem: {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  } as Variants,
  
  // For modals/dialogs
  modal: {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 10 },
  } as Variants,
  
  // For toast notifications
  toast: {
    hidden: { opacity: 0, y: 50, x: 20 },
    visible: { opacity: 1, y: 0, x: 0 },
    exit: { opacity: 0, x: 100 },
  } as Variants,
  
  // Staggered children animations
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as Variants,
  
  staggerItem: {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 20 }
    },
  } as Variants,
  
  // Notification status
  notificationSuccess: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.3,
        ease: easeBackOut
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { 
        duration: 0.2
      }
    }
  } as Variants,
  
  notificationError: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.3,
        ease: easeOutQuint
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { 
        duration: 0.2
      }
    }
  } as Variants,
}; 