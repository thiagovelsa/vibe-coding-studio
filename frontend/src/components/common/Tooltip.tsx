import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = '200px',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Gerencia posicionamento após renderização
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      
      // Certifica-se de que o tooltip está totalmente visível
      if (rect.x < 0) {
        tooltip.style.marginLeft = `${-rect.x + 10}px`;
      } else if (rect.right > window.innerWidth) {
        tooltip.style.marginLeft = `${window.innerWidth - rect.right - 10}px`;
      }
      
      if (rect.y < 0) {
        tooltip.style.marginTop = `${-rect.y + 10}px`;
      } else if (rect.bottom > window.innerHeight) {
        tooltip.style.marginTop = `${window.innerHeight - rect.bottom - 10}px`;
      }
    }
  }, [isVisible]);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2',
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {React.cloneElement(children, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800
            rounded-md shadow-md whitespace-normal transition-opacity duration-150 ease-in-out
            ${positionClasses[position]}
          `}
          style={{ maxWidth }}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip; 