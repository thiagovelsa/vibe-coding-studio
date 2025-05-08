import { useEffect, useState, useCallback, useRef } from 'react';

export type KeyCombo = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
};

export type KeyboardShortcut = KeyCombo & {
  id: string;
  description: string;
  action: () => void;
  disabled?: boolean;
  scope?: string; // opcional para agrupar atalhos por escopo (ex: 'editor', 'global')
};

export type ShortcutMap = Record<string, KeyboardShortcut>;

/**
 * Hook para gerenciar atalhos de teclado globais
 * @param shortcuts Lista de atalhos de teclado para registrar
 * @param globalScope Escopo global para filtrar atalhos (opcional)
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  globalScope?: string
) => {
  const [activeShortcuts, setActiveShortcuts] = useState<KeyboardShortcut[]>([]);
  const registeredShortcuts = useRef<ShortcutMap>({});
  
  // Converte a lista de atalhos em um mapa para fácil acesso
  const buildShortcutMap = useCallback((shortcutList: KeyboardShortcut[]): ShortcutMap => {
    const map: ShortcutMap = {};
    shortcutList.forEach(shortcut => {
      // Filtra por escopo se especificado
      if (globalScope && shortcut.scope && shortcut.scope !== globalScope) {
        return;
      }
      
      // Ignore atalhos desativados
      if (shortcut.disabled) {
        return;
      }
      
      map[shortcut.id] = shortcut;
    });
    return map;
  }, [globalScope]);
  
  // Cria uma representação legível do atalho (para exibição)
  const formatShortcut = useCallback((shortcut: KeyCombo): string => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Meta');
    
    // Adiciona a tecla principal
    keys.push(shortcut.key);
    
    return keys.join('+');
  }, []);

  // Manipulador de evento de tecla
  useEffect(() => {
    // Atualiza a referência de atalhos
    registeredShortcuts.current = buildShortcutMap(shortcuts);
    setActiveShortcuts(shortcuts.filter(s => !s.disabled));
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignora eventos em campos de entrada
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (event.target as HTMLElement).tagName
      )) {
        return;
      }
      
      // Verifica se algum elemento contentEditable está focado
      if ((event.target as HTMLElement).isContentEditable) {
        return;
      }
      
      // Verifica cada atalho registrado
      const matchingShortcuts = Object.values(registeredShortcuts.current).filter(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        
        return keyMatch && altMatch && ctrlMatch && shiftMatch && metaMatch;
      });
      
      if (matchingShortcuts.length > 0) {
        event.preventDefault();
        
        // Executa a ação do último atalho registrado (maior prioridade)
        const shortcut = matchingShortcuts[matchingShortcuts.length - 1];
        shortcut.action();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, buildShortcutMap]);

  // Registra um novo atalho dinamicamente
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setActiveShortcuts(prev => {
      const newShortcuts = [...prev.filter(s => s.id !== shortcut.id), shortcut];
      registeredShortcuts.current = buildShortcutMap(newShortcuts);
      return newShortcuts;
    });
  }, [buildShortcutMap]);

  // Remove um atalho pelo ID
  const unregisterShortcut = useCallback((shortcutId: string) => {
    setActiveShortcuts(prev => {
      const newShortcuts = prev.filter(s => s.id !== shortcutId);
      registeredShortcuts.current = buildShortcutMap(newShortcuts);
      return newShortcuts;
    });
  }, [buildShortcutMap]);

  return {
    activeShortcuts,
    registerShortcut,
    unregisterShortcut,
    formatShortcut
  };
};

export default useKeyboardShortcuts; 