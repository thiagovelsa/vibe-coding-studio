import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { elasticScale } from '../../lib/animations';

interface DraggableItemProps {
  id: string;
  type: string;
  data?: any;
  children: React.ReactNode;
  onDragStart?: (id: string, type: string, data?: any) => void;
  onDragEnd?: (id: string, type: string, dropped: boolean, data?: any) => void;
  disabled?: boolean;
  dragThreshold?: number;
  dragConstraints?: React.RefObject<HTMLElement> | false;
  className?: string;
  dragHandleClassName?: string;
  dragIndicator?: React.ReactNode;
  preview?: React.ReactNode;
  previewSize?: 'sm' | 'md' | 'lg';
  dragEffect?: 'lift' | 'fade' | 'scale' | 'none';
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  type,
  data,
  children,
  onDragStart,
  onDragEnd,
  disabled = false,
  dragThreshold = 5,
  dragConstraints = false,
  className = '',
  dragHandleClassName,
  dragIndicator,
  preview,
  previewSize = 'md',
  dragEffect = 'lift'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const originPos = useRef({ x: 0, y: 0 });
  const dragOrigin = useRef<HTMLElement | null>(null);
  const dragDistance = useRef(0);
  const wasDropped = useRef(false);
  
  // Valores de Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transformações baseadas no efeito selecionado
  const scale = useTransform(
    y, 
    [-100, 0, 100], 
    dragEffect === 'scale' ? [0.95, 1, 0.95] : [1, 1, 1]
  );
  
  const opacity = useTransform(
    y, 
    [-100, 0, 100], 
    dragEffect === 'fade' ? [0.7, 1, 0.7] : [1, 1, 1]
  );
  
  const shadow = useTransform(
    y, 
    [-100, 0, 100], 
    dragEffect === 'lift' 
      ? ['0px 5px 10px rgba(0,0,0,0.15)', '0px 0px 0px rgba(0,0,0,0)', '0px 5px 10px rgba(0,0,0,0.15)'] 
      : ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 0px rgba(0,0,0,0)', '0px 0px 0px rgba(0,0,0,0)']
  );
  
  // Tamanho do preview
  const previewSizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }[previewSize];

  // Disparar início do arrasto
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent) => {
    if (disabled) return;
    
    // Registrar posição inicial para calcular distância
    originPos.current = { x: x.get(), y: y.get() };
    dragOrigin.current = event.currentTarget as HTMLElement;
    wasDropped.current = false;
    
    setIsDragging(true);
    
    if (onDragStart) {
      onDragStart(id, type, data);
    }
  };
  
  // Lógica durante o arrasto
  const handleDrag = (_: any, info: any) => {
    if (disabled) return;
    
    dragDistance.current = Math.sqrt(
      Math.pow(info.offset.x, 2) + Math.pow(info.offset.y, 2)
    );
  };
  
  // Finalizar o arrasto
  const handleDragEnd = () => {
    if (disabled) return;
    
    setIsDragging(false);
    
    if (onDragEnd) {
      onDragEnd(id, type, wasDropped.current, data);
    }
    
    // Retornar à posição original com animação
    x.set(0);
    y.set(0);
  };
  
  // Definir como "arrastado" quando sobre uma zona de soltura
  const setDropped = (isDropped: boolean) => {
    wasDropped.current = isDropped;
  };

  return (
    <>
      <motion.div
        className={`relative touch-none select-none ${className} ${isDragging ? 'z-50' : 'z-auto'}`}
        style={{ x, y, scale, opacity, boxShadow: shadow }}
        drag={!disabled}
        dragConstraints={dragConstraints || false}
        dragElastic={0.1}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        whileDrag={{ cursor: 'grabbing' }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        dragListener={true}
        dragControls={undefined}
        data-draggable={true}
        data-draggable-id={id}
        data-draggable-type={type}
      >
        {dragIndicator && !dragHandleClassName && (
          <div className="absolute top-1 right-1 text-gray-400 cursor-grab p-1 hover:text-gray-600 dark:hover:text-gray-300">
            {dragIndicator}
          </div>
        )}
        {children}
      </motion.div>

      {/* Preview flutuante durante o arrasto */}
      <AnimatePresence>
        {isDragging && preview && (
          <motion.div
            className={`fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 ${previewSizeClass}`}
            style={{ 
              left: x, 
              top: y,
              position: 'fixed'
            }}
            variants={elasticScale}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {preview}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente DropZone para receber itens arrastáveis
interface DropZoneProps {
  id: string;
  acceptTypes: string[];
  onDrop?: (id: string, itemType: string, itemId: string, data?: any) => void;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  disableDefaultHighlight?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  id,
  acceptTypes,
  onDrop,
  children,
  className = '',
  activeClassName = 'bg-blue-100 dark:bg-blue-800/30 border-blue-300 dark:border-blue-700',
  disableDefaultHighlight = false,
}) => {
  const [isOver, setIsOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Dados do item sendo arrastado
  const draggedItem = useRef<{
    id: string;
    type: string;
    data?: any;
  } | null>(null);
  
  // Verificar se o tipo do item é aceito
  const isValidItem = (itemType: string) => {
    return acceptTypes.includes(itemType) || acceptTypes.includes('*');
  };
  
  // Quando um item entra na zona de soltura
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target as HTMLElement;
    const draggableElement = element.closest('[data-draggable="true"]') as HTMLElement;
    
    if (draggableElement) {
      const itemType = draggableElement.getAttribute('data-draggable-type') || '';
      const itemId = draggableElement.getAttribute('data-draggable-id') || '';
      
      if (isValidItem(itemType)) {
        draggedItem.current = { 
          id: itemId, 
          type: itemType,
          data: draggableElement.dataset.draggableData
        };
        setIsOver(true);
      }
    }
  };
  
  // Quando um item sai da zona de soltura
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se o cursor está fora da área da dropzone
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      const { left, right, top, bottom } = rect;
      
      if (
        clientX < left ||
        clientX > right ||
        clientY < top ||
        clientY > bottom
      ) {
        setIsOver(false);
        draggedItem.current = null;
      }
    }
  };
  
  // Permite que a zona receba o item arrastado
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Quando o item é solto na zona
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsOver(false);
    
    if (draggedItem.current && isValidItem(draggedItem.current.type)) {
      if (onDrop) {
        onDrop(
          id,
          draggedItem.current.type,
          draggedItem.current.id,
          draggedItem.current.data
        );
      }
    }
    
    draggedItem.current = null;
  };
  
  return (
    <div
      ref={dropZoneRef}
      className={`
        ${className}
        ${isOver && !disableDefaultHighlight ? activeClassName : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-dropzone={true}
      data-dropzone-id={id}
      data-accept-types={acceptTypes.join(',')}
    >
      {children}
    </div>
  );
};

// Hook para gerenciar o estado de drag and drop em um componente
export function useDragAndDrop() {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedItem: { id: string; type: string; data?: any } | null;
    dragSource: string | null;
    dropTarget: string | null;
  }>({
    isDragging: false,
    draggedItem: null,
    dragSource: null,
    dropTarget: null,
  });
  
  // Iniciar o arrasto
  const handleDragStart = (id: string, type: string, data?: any, source?: string) => {
    setDragState({
      isDragging: true,
      draggedItem: { id, type, data },
      dragSource: source || null,
      dropTarget: null,
    });
  };
  
  // Finalizar o arrasto
  const handleDragEnd = (dropped: boolean, target?: string) => {
    setDragState(prev => ({
      isDragging: false,
      draggedItem: dropped ? null : prev.draggedItem,
      dragSource: null,
      dropTarget: dropped ? target || null : null,
    }));
  };
  
  // Configurar zona de soltura
  const handleDrop = (targetId: string, itemType: string, itemId: string, data?: any) => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      dropTarget: targetId,
    }));
    
    return {
      item: { id: itemId, type: itemType, data },
      source: dragState.dragSource,
      target: targetId,
    };
  };
  
  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
} 