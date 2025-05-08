import React, { memo } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { AnimatedButton } from '../common/AnimatedButton';
import { ChatSession } from '../../services/agent-api.service';

interface SessionListItemProps {
  session: ChatSession;
  isEditing: boolean;
  isActive: boolean;
  editingTitle: string;
  theme: string;
  inputRef: React.RefObject<HTMLInputElement>;
  handleOpenSession: (sessionId: string) => void;
  handleEditClick: (e: React.MouseEvent, session: ChatSession) => void;
  handleCancelEdit: () => void;
  handleSaveTitle: () => Promise<void>;
  handleDeleteClick: (e: React.MouseEvent, sessionId: string, sessionTitle?: string) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setEditingTitle: (title: string) => void;
  style?: React.CSSProperties; // Para virtualização
  role?: string; // Para acessibilidade
  'aria-selected'?: boolean; // Para acessibilidade
  id?: string; // Para acessibilidade
}

const SessionListItemComponent: React.FC<SessionListItemProps> = ({
  session,
  isEditing,
  isActive,
  editingTitle,
  theme,
  inputRef,
  handleOpenSession,
  handleEditClick,
  handleCancelEdit,
  handleSaveTitle,
  handleDeleteClick,
  handleInputKeyDown,
  setEditingTitle,
  style,
  role = "option",
  'aria-selected': ariaSelected,
  id
}) => {
  return (
    <div 
      key={session.id} 
      className={`group relative flex items-center w-full p-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
          isEditing ? (theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50') : 
          isActive ? (theme === 'dark' ? 'bg-white/10 text-purple-300' : 'bg-black/10 text-purple-600') : 
          (theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-black/5') 
      }`}
      onClick={isEditing ? undefined : () => handleOpenSession(session.id)}
      title={isEditing ? 'Editando título...' : `Carregar sessão: ${session.title || session.id}`}
      style={style} // Aplicar estilos para virtualização, se existirem
      role={role}
      aria-selected={ariaSelected}
      id={id}
    >
      {isEditing ? (
          <div className="flex items-center flex-1 min-w-0 pr-1">
              <input 
                  ref={inputRef}
                  type="text" 
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleSaveTitle}
                  className={`flex-1 bg-transparent border-b outline-none text-xs px-0.5 py-0 mx-1 ${theme === 'dark' ? 'border-purple-400 text-white' : 'border-purple-500 text-black'}`} 
                  autoFocus
                  aria-label="Editar título da sessão"
              />
              <AnimatedButton 
                onClick={handleSaveTitle} 
                title="Salvar (Enter)" 
                className="text-green-500 hover:bg-green-500/20 ml-1 p-0.5"
                aria-label="Salvar título"
              > 
                <FiCheck className="w-3.5 h-3.5" aria-hidden="true"/> 
              </AnimatedButton>
              <AnimatedButton 
                onClick={handleCancelEdit} 
                title="Cancelar (Esc)" 
                className="text-red-500 hover:bg-red-500/20 ml-0.5 p-0.5"
                aria-label="Cancelar edição"
              > 
                <FiX className="w-3.5 h-3.5" aria-hidden="true"/> 
              </AnimatedButton>
          </div>
      ) : (
          <>
              <span className={`truncate flex-1 mr-2 ${isActive ? 'font-medium' : ''}`}>
                  {session.title || `Session ${session.id.substring(0, 8)}...`}
              </span>
              <span className="text-[10px] opacity-70 flex-shrink-0 group-hover:hidden mr-1" aria-hidden="true"> 
                  {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : ''}
              </span>
               <div className="absolute right-1 top-1/2 transform -translate-y-1/2 hidden group-hover:flex items-center space-x-0.5 bg-gray-500/30 dark:bg-gray-700/50 backdrop-blur-sm p-0.5 rounded z-10">
                   <AnimatedButton 
                     onClick={(e) => handleEditClick(e, session)} 
                     title="Renomear" 
                     className="text-gray-300 hover:text-white hover:bg-white/20 p-0.5"
                     aria-label="Renomear sessão"
                   > 
                     <FiEdit2 className="w-3 h-3" aria-hidden="true"/> 
                   </AnimatedButton>
                   <AnimatedButton 
                     onClick={(e) => handleDeleteClick(e, session.id, session.title)} 
                     title="Deletar" 
                     className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-0.5"
                     aria-label="Deletar sessão"
                   > 
                     <FiTrash2 className="w-3 h-3" aria-hidden="true"/> 
                   </AnimatedButton>
               </div>
          </>
      )}
    </div>
  );
};

// Implementar memoização com comparação customizada para evitar re-renderizações desnecessárias
export const SessionListItem = memo(SessionListItemComponent, (prevProps, nextProps) => {
  // Comparação para determinar se é necessário re-renderizar
  return (
    prevProps.session.id === nextProps.session.id &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isActive === nextProps.isActive &&
    (prevProps.isEditing ? prevProps.editingTitle === nextProps.editingTitle : true) &&
    prevProps.theme === nextProps.theme &&
    prevProps['aria-selected'] === nextProps['aria-selected']
  );
}); 