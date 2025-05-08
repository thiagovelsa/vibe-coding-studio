import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface VirtualizedListProps<T> {
  items: T[];
  itemContent: (index: number, item: T) => React.ReactNode;
  emptyContent?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  overscan?: number;
  scrollToBottom?: boolean;
  initialTopMostItemIndex?: number;
  initialBottomMostItemIndex?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
  itemSize?: number;
  totalHeight?: number | string;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemContent,
  emptyContent,
  className = '',
  itemClassName = '',
  overscan = 10,
  scrollToBottom = false,
  initialTopMostItemIndex,
  initialBottomMostItemIndex,
  header,
  footer,
  style,
  totalHeight = '100%',
  onItemsRendered
}: VirtualizedListProps<T>) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isAtBottom, setIsAtBottom] = useState(scrollToBottom);

  // Efeito para rolar automaticamente para o final quando novos items são adicionados
  useEffect(() => {
    if (scrollToBottom && isAtBottom && items.length > 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: items.length - 1,
        behavior: 'auto',
      });
    }
  }, [items.length, scrollToBottom, isAtBottom]);

  // Efeito para rolar para o final na primeira renderização se scrollToBottom for true
  useEffect(() => {
    if (scrollToBottom && items.length > 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: items.length - 1,
        behavior: 'auto',
      });
      setIsAtBottom(true);
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Considerar "no final" se estiver a menos de 20px do final
    const atBottom = scrollHeight - scrollTop - clientHeight < 20;
    setIsAtBottom(atBottom);
  }, []);

  // Se não houver items, mostrar conteúdo vazio
  if (items.length === 0 && emptyContent) {
    return <>{emptyContent}</>;
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: totalHeight, width: '100%', ...style }}
      totalCount={items.length}
      itemContent={(index) => (
        <div className={itemClassName}>
          {itemContent(index, items[index])}
        </div>
      )}
      className={className}
      overscan={overscan}
      initialTopMostItemIndex={initialTopMostItemIndex}
      followOutput={scrollToBottom ? 'auto' : undefined}
      atBottomStateChange={setIsAtBottom}
      onScroll={handleScroll}
      components={{
        Header: () => header || null,
        Footer: () => footer || null,
      }}
      rangeChanged={(range) => {
        onItemsRendered?.(range.startIndex, range.endIndex);
      }}
    />
  );
} 