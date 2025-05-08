import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

export interface TransitionOptions {
  timeout?: {
    enter?: number;
    exit?: number;
  };
  initialEntered?: boolean;
  animationsEnabled?: boolean;
}

/**
 * Hook para gerenciar transições de estado com animações
 * @param options Configurações de timeout e estado inicial
 * @returns Estado atual da transição e funções para controle
 */
export const useTransition = (options: TransitionOptions = {}) => {
  const {
    timeout = { enter: 300, exit: 300 },
    initialEntered = false,
    animationsEnabled: animEnabledProp,
  } = options;

  // Verifica se as animações estão habilitadas nas preferências do usuário
  const [animationsEnabled] = useLocalStorage('vf-animations-enabled', true);
  const shouldAnimate = animEnabledProp !== undefined ? animEnabledProp : animationsEnabled;
  
  const [state, setState] = useState<TransitionState>(
    initialEntered ? 'entered' : 'exited'
  );
  const [visible, setVisible] = useState(initialEntered);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpa qualquer timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Função para iniciar a transição de entrada
  const enter = useCallback(() => {
    if (!shouldAnimate) {
      setState('entered');
      setVisible(true);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Se já está saindo, primeiro define como saído
    if (state === 'exiting') {
      setState('exited');
      
      // Micro-delay para permitir que o DOM atualize
      timeoutRef.current = setTimeout(() => {
        setState('entering');
        setVisible(true);
        
        // Define timeout para completar a entrada
        timeoutRef.current = setTimeout(() => {
          setState('entered');
        }, timeout.enter);
      }, 20);
      return;
    }

    // Fluxo normal de entrada
    setVisible(true);
    setState('entering');
    
    timeoutRef.current = setTimeout(() => {
      setState('entered');
    }, timeout.enter);
  }, [state, shouldAnimate, timeout.enter]);

  // Função para iniciar a transição de saída
  const exit = useCallback(() => {
    if (!shouldAnimate) {
      setState('exited');
      setVisible(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Se ainda está entrando, primeiro define como entrado
    if (state === 'entering') {
      setState('entered');
      
      // Micro-delay para permitir que o DOM atualize
      timeoutRef.current = setTimeout(() => {
        setState('exiting');
        
        // Define timeout para completar a saída
        timeoutRef.current = setTimeout(() => {
          setState('exited');
          setVisible(false);
        }, timeout.exit);
      }, 20);
      return;
    }

    // Fluxo normal de saída
    setState('exiting');
    
    timeoutRef.current = setTimeout(() => {
      setState('exited');
      setVisible(false);
    }, timeout.exit);
  }, [state, shouldAnimate, timeout.exit]);

  // Função de toggle
  const toggle = useCallback(() => {
    if (state === 'entering' || state === 'entered') {
      exit();
    } else {
      enter();
    }
  }, [state, enter, exit]);

  // Aplica o estado de animação aos estilos CSS
  const getTransitionProps = useCallback(() => {
    // Se animações estão desabilitadas, retorna props simplificados
    if (!shouldAnimate) {
      return {
        style: { transition: 'none' },
        'data-state': state,
        'aria-hidden': !visible,
      };
    }

    return {
      style: {
        transition: `opacity ${state === 'entering' ? timeout.enter : timeout.exit}ms, transform ${state === 'entering' ? timeout.enter : timeout.exit}ms`,
      },
      'data-state': state,
      'aria-hidden': !visible,
    };
  }, [state, visible, shouldAnimate, timeout.enter, timeout.exit]);

  // Gera classes para diferentes frameworks de estilos
  const getTransitionClasses = useCallback(
    (
      baseClass: string = '',
      classMap: {
        entering?: string;
        entered?: string;
        exiting?: string;
        exited?: string;
      } = {}
    ) => {
      if (!shouldAnimate) {
        return baseClass + (visible ? classMap.entered || '' : classMap.exited || '');
      }

      const stateClass = classMap[state] || '';
      return `${baseClass} ${stateClass}`.trim();
    },
    [state, visible, shouldAnimate]
  );

  return {
    state,
    visible,
    enter,
    exit,
    toggle,
    getTransitionProps,
    getTransitionClasses,
  };
};

export default useTransition; 