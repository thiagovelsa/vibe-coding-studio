import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
  children?: MenuItem[];
}

interface AnimatedContextMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  className?: string;
}

export const AnimatedContextMenu: React.FC<AnimatedContextMenuProps> = ({
  items,
  isOpen,
  x,
  y,
  onClose,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Calcular posição do submenu
  const handleSubmenuOpen = (itemId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right,
      y: rect.top
    });
    setActiveSubmenu(itemId);
  };

  // Renderizar item do menu
  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.children && item.children.length > 0;
    
    return (
      <div
        key={item.id}
        className={`px-3 py-2 flex items-center justify-between rounded-md cursor-pointer
                   ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                   ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}
        onClick={() => {
          if (!item.disabled && !hasSubmenu && item.onClick) {
            item.onClick();
            onClose();
          }
        }}
        onMouseEnter={(e) => hasSubmenu ? handleSubmenuOpen(item.id, e) : setActiveSubmenu(null)}
      >
        <div className="flex items-center">
          {item.icon && <span className="mr-2 text-gray-500 dark:text-gray-400">{item.icon}</span>}
          <span>{item.label}</span>
        </div>
        <div className="flex items-center">
          {item.shortcut && (
            <span className="ml-4 text-xs text-gray-500 dark:text-gray-400 font-mono">{item.shortcut}</span>
          )}
          {hasSubmenu && <FiChevronRight className="ml-2 text-gray-400" />}
        </div>
      </div>
    );
  };

  // Renderizar submenu
  const renderSubmenu = (items: MenuItem[], parentId: string) => {
    if (activeSubmenu !== parentId) return null;

    return (
      <motion.div
        className="absolute left-full top-0 bg-white dark:bg-gray-800 rounded-md shadow-lg 
                   border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[160px] py-1 px-0.5 ml-0.5"
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -5 }}
        transition={{ duration: 0.15 }}
        style={{ left: 0, top: 0 }}
      >
        {items.map(item => renderMenuItem(item))}
      </motion.div>
    );
  };

  // Ajustar posição do menu para impedir que vá além da janela
  const adjustMenuPosition = () => {
    if (!menuRef.current) return { x, y };
    
    const { width, height } = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const adjustedX = x + width > windowWidth ? windowWidth - width - 10 : x;
    const adjustedY = y + height > windowHeight ? windowHeight - height - 10 : y;
    
    return { x: adjustedX, y: adjustedY };
  };
  
  const position = adjustMenuPosition();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className={`fixed z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg 
                     border border-gray-200 dark:border-gray-700 overflow-hidden
                     min-w-[160px] py-1 px-0.5 ${className}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          style={{ left: position.x, top: position.y }}
        >
          {items.map(item => (
            <React.Fragment key={item.id}>
              {renderMenuItem(item)}
              {item.children && (
                <AnimatePresence>
                  {renderSubmenu(item.children, item.id)}
                </AnimatePresence>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para facilitar o uso do contexto de menu
export const useContextMenu = () => {
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: MenuItem[];
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    items: []
  });

  const openMenu = (x: number, y: number, items: MenuItem[]) => {
    setMenuState({
      isOpen: true,
      x,
      y,
      items
    });
  };

  const closeMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }));
  };

  // Manipulador para o evento contextmenu (right-click)
  const handleContextMenu = (
    event: React.MouseEvent,
    items: MenuItem[],
    preventDefault = true
  ) => {
    if (preventDefault) {
      event.preventDefault();
    }
    
    openMenu(event.clientX, event.clientY, items);
  };

  return {
    menuState,
    openMenu,
    closeMenu,
    handleContextMenu
  };
};

// Componente de divisória para o menu
export const MenuDivider: React.FC = () => (
  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1 mx-3" />
);

// Componente para grupo de itens no menu
interface MenuGroupProps {
  title: string;
  children: ReactNode;
}

export const MenuGroup: React.FC<MenuGroupProps> = ({ title, children }) => (
  <>
    <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
      {title}
    </div>
    {children}
  </>
); 