import React, { useState, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { SessionListItem } from '../layout/SessionListItem';
import { ChatSession } from '../../services/agent-api.service';

interface VirtualizedSessionListProps {
  sessions: ChatSession[];
  activeChatSessionId: string | null;
  theme: string;
  onOpenSession: (sessionId: string) => void;
  onEditSession: (e: React.MouseEvent, session: ChatSession) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string, sessionTitle?: string) => void;
  editingSessionId: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  handleSaveTitle: () => Promise<void>;
  handleCancelEdit: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  role?: string;
  'aria-activedescendant'?: string;
}

export const VirtualizedSessionList: React.FC<VirtualizedSessionListProps> = ({
  sessions,
  activeChatSessionId,
  theme,
  onOpenSession,
  onEditSession,
  onDeleteSession,
  editingSessionId,
  editingTitle,
  setEditingTitle,
  handleSaveTitle,
  handleCancelEdit,
  handleInputKeyDown,
  'aria-label': ariaLabel = "Lista de sessões",
  role = "listbox",
  'aria-activedescendant': ariaActiveDescendant
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Retornar mensagem quando não há sessões
  if (sessions.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400 italic px-1 py-2" aria-live="polite">
        No past sessions found.
      </p>
    );
  }

  // Função para renderizar cada item da lista
  const renderRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const session = sessions[index];
    return (
      <SessionListItem
        key={session.id}
        session={session}
        isActive={session.id === activeChatSessionId}
        isEditing={session.id === editingSessionId}
        editingTitle={editingTitle}
        theme={theme}
        inputRef={inputRef}
        handleOpenSession={onOpenSession}
        handleEditClick={onEditSession}
        handleDeleteClick={onDeleteSession}
        handleCancelEdit={handleCancelEdit}
        handleSaveTitle={handleSaveTitle}
        handleInputKeyDown={handleInputKeyDown}
        setEditingTitle={setEditingTitle}
        style={style}
        role="option"
        aria-selected={session.id === activeChatSessionId}
        id={`session-${session.id}`}
      />
    );
  };

  // Altura estimada de cada item (ajuste conforme necessário)
  const itemHeight = 32; // Altura em pixels para cada item da sessão
  
  // Altura total da lista (limitada a ~60% da altura do Sidebar)
  const listHeight = Math.min(sessions.length * itemHeight, 240); // Máximo de 240px

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-activedescendant={ariaActiveDescendant}
    >
      <FixedSizeList
        className="custom-scrollbar -mx-2 px-2"
        height={listHeight}
        width="100%"
        itemCount={sessions.length}
        itemSize={itemHeight}
        overscanCount={5} // Pré-renderiza itens adicionais para scrolling suave
        aria-busy={false}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
}; 