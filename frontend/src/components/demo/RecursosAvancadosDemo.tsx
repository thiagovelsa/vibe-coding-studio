import React, { useState } from 'react';
import { FiFileText, FiFolder, FiTrash2, FiMenu, FiGrid, FiMove, FiRotateCw, FiEdit, FiCornerUpLeft, FiCornerUpRight } from 'react-icons/fi';
import {
  DraggableItem,
  DropZone,
  FileItemDraggable,
  FileListDraggable,
  AnimatedContextMenu,
  useContextMenu,
  HistoryView,
  HistoryProvider,
  HistoryStateIndicator,
  TransitionWrapper,
  AnimatedCard
} from '../common';
import { HistoryContext, useHistoryContext, HistoryOperationTypes, createHistoryItem } from '../../lib/history';

const RecursosAvancadosDemo: React.FC = () => {
  return (
    <HistoryProvider>
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-semibold mb-6">
          Demonstração de Recursos Avançados
        </h1>
        
        <TransitionWrapper type="fadeUp">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DragDropDemo />
            <ContextMenuDemo />
          </div>
        </TransitionWrapper>
        
        <TransitionWrapper type="fadeUp" delay={0.1}>
          <div className="w-full">
            <HistoriaDemo />
          </div>
        </TransitionWrapper>
      </div>
    </HistoryProvider>
  );
};

// Demonstração de Drag and Drop
const DragDropDemo: React.FC = () => {
  const [droppedItems, setDroppedItems] = useState<{
    id: string;
    name: string;
    source: string;
  }[]>([]);
  
  // Dados de arquivo fictícios para demonstração
  const mockFiles = [
    { id: 'file1', name: 'documento.txt', path: '/documentos/documento.txt', type: 'file', extension: 'txt', size: 1024, lastModified: new Date().toISOString() },
    { id: 'file2', name: 'imagem.png', path: '/imagens/imagem.png', type: 'file', extension: 'png', size: 102400, lastModified: new Date().toISOString() },
    { id: 'file3', name: 'código.js', path: '/código/código.js', type: 'file', extension: 'js', size: 5120, lastModified: new Date().toISOString() },
    { id: 'folder1', name: 'Projetos', path: '/Projetos', type: 'directory', lastModified: new Date().toISOString() },
  ];
  
  // Manipuladores de eventos
  const handleDragStart = (id: string, type: string, data: any) => {
    console.log('Iniciou arrasto:', id, type, data);
  };
  
  const handleDragEnd = (id: string, type: string, dropped: boolean, data: any) => {
    console.log('Finalizou arrasto:', id, type, dropped, data);
  };
  
  const handleDrop = (zoneId: string, itemType: string, itemId: string, data: any) => {
    console.log('Item solto:', zoneId, itemType, itemId, data);
    
    // Adicionar item na lista de itens soltos
    if (data && data.name) {
      setDroppedItems(prev => [
        ...prev,
        {
          id: itemId,
          name: data.name,
          source: data.path,
        }
      ]);
    }
  };
  
  const handleClearDropZone = () => {
    setDroppedItems([]);
  };
  
  return (
    <AnimatedCard className="col-span-1">
      <div className="p-4">
        <h2 className="text-lg font-medium flex items-center mb-3">
          <FiMove className="mr-2" />
          Arrastar e Soltar (Drag and Drop)
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Arquivos Arrastáveis
            </h3>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <FileListDraggable 
                files={mockFiles}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="p-2"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
              <span>Área de Soltura</span>
              
              {droppedItems.length > 0 && (
                <button 
                  className="text-xs flex items-center text-gray-500 hover:text-red-500"
                  onClick={handleClearDropZone}
                >
                  <FiTrash2 className="mr-1" size={12} />
                  Limpar
                </button>
              )}
            </h3>
            
            <DropZone 
              id="demo-dropzone"
              acceptTypes={['file-file', 'file-directory']}
              onDrop={handleDrop}
              className="min-h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center p-4"
              activeClassName="border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            >
              {droppedItems.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  <FiGrid className="mx-auto mb-2" size={24} />
                  <p>Arraste arquivos ou pastas para esta área</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Itens soltos ({droppedItems.length}):
                  </div>
                  <ul className="space-y-1">
                    {droppedItems.map((item) => (
                      <li key={item.id} className="flex items-center text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                        <FiFileText className="mr-2 text-blue-500" size={16} />
                        <div className="flex-1 truncate">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.source}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DropZone>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

// Demonstração de Menu de Contexto
const ContextMenuDemo: React.FC = () => {
  const { menuState, handleContextMenu, closeMenu } = useContextMenu();
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  
  // Itens para o menu de contexto
  const menuItems = [
    {
      id: 'new',
      label: 'Novo',
      icon: <FiFileText />,
      children: [
        { id: 'new-file', label: 'Arquivo', icon: <FiFileText />, onClick: () => setClickedItem('Novo arquivo') },
        { id: 'new-folder', label: 'Pasta', icon: <FiFolder />, onClick: () => setClickedItem('Nova pasta') }
      ]
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: <FiEdit />,
      onClick: () => setClickedItem('Editar'),
      shortcut: 'Ctrl+E'
    },
    {
      id: 'refresh',
      label: 'Atualizar',
      icon: <FiRotateCw />,
      onClick: () => setClickedItem('Atualizar'),
      shortcut: 'F5'
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <FiTrash2 />,
      onClick: () => setClickedItem('Excluir'),
      danger: true,
      shortcut: 'Del'
    }
  ];
  
  return (
    <AnimatedCard className="col-span-1">
      <div className="p-4">
        <h2 className="text-lg font-medium flex items-center mb-3">
          <FiMenu className="mr-2" />
          Menu de Contexto
        </h2>
        
        <div 
          className="min-h-[200px] border border-gray-200 dark:border-gray-700 rounded-md p-4 flex items-center justify-center"
          onContextMenu={(e) => handleContextMenu(e, menuItems)}
        >
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Clique com o botão direito nesta área para abrir o menu de contexto
            </p>
            
            {clickedItem && (
              <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                Você clicou em: <span className="font-medium">{clickedItem}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Renderizar o menu de contexto */}
        <AnimatedContextMenu
          items={menuState.items}
          isOpen={menuState.isOpen}
          x={menuState.x}
          y={menuState.y}
          onClose={closeMenu}
        />
      </div>
    </AnimatedCard>
  );
};

// Demonstração de Histórico
const HistoriaDemo: React.FC = () => {
  const { addHistoryItem, undo, redo, canUndo, canRedo } = useHistoryContext();
  
  // Função para adicionar um item ao histórico
  const addHistoricalAction = (action: string) => {
    const item = createHistoryItem(
      HistoryOperationTypes.DOCUMENT_EDIT,
      { action, timestamp: Date.now() },
      `Ação: ${action}`,
      { user: 'demo-user', actionType: 'demo' }
    );
    
    addHistoryItem(item);
  };
  
  // Ações disponíveis para demonstração
  const actions = [
    'Criar arquivo',
    'Editar documento',
    'Excluir pasta',
    'Renomear arquivo',
    'Compilar projeto',
    'Executar teste',
    'Commit de alterações'
  ];
  
  return (
    <AnimatedCard>
      <div className="p-4">
        <h2 className="text-lg font-medium flex items-center mb-3">
          <FiRotateCw className="mr-2" />
          Sistema de Histórico
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1.5 rounded-md flex items-center
                          ${canUndo 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'}`}
                disabled={!canUndo}
                onClick={undo}
              >
                <FiCornerUpLeft className="mr-1" size={14} />
                Desfazer
              </button>
              
              <button 
                className={`px-3 py-1.5 rounded-md flex items-center
                          ${canRedo 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'}`}
                disabled={!canRedo}
                onClick={redo}
              >
                <FiCornerUpRight className="mr-1" size={14} />
                Refazer
              </button>
              
              <div className="flex-1"></div>
              
              <HistoryStateIndicator showCounts />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Adicionar ao Histórico
              </h3>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2.5 flex flex-wrap gap-2">
                {actions.map(action => (
                  <button
                    key={action}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-sm"
                    onClick={() => addHistoricalAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border-l-4 border-yellow-400">
              <p>
                <strong>Dica:</strong> Adicione ações ao histórico e teste as funções de desfazer/refazer. Cada ação é registrada com metadados e pode ser visualizada na lista à direita.
              </p>
            </div>
          </div>
          
          <div>
            <HistoryView 
              title="Histórico de Ações"
              maxHeight="300px"
              showControls={true}
            />
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default RecursosAvancadosDemo; 