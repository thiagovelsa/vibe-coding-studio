import React, { useState, useEffect, useRef } from 'react';

// Interface para representar as APIs disponíveis no electron
interface ElectronAPI {
  dialog: {
    openFile: (options?: any) => Promise<string[] | null>;
    saveFile: (options?: any) => Promise<string | null>;
    openDirectory: (options?: any) => Promise<string[] | null>;
    showMessage: (options: any) => Promise<{ response: number; checkboxChecked?: boolean }>;
  };
  dragDrop: {
    registerFileDropZone: (elementId: string) => void;
    unregisterFileDropZone: (elementId: string) => void;
    onDrop: (callback: (files: string[]) => void) => () => void;
  };
  system: {
    getInfo: () => Promise<any>;
    getPlatform: () => Promise<string>;
    getCpuUsage: () => Promise<number>;
    getMemoryInfo: () => Promise<any>;
    openPath: (path: string) => Promise<string>;
    openExternal: (url: string, options?: any) => Promise<void>;
  };
  taskbar: {
    setProgressBar: (progress: number, options?: any) => Promise<void>;
    clearProgressBar: () => Promise<void>;
    setOverlayIcon: (iconPath: string | null, description: string) => Promise<void>;
    setBadge: (text: string) => Promise<void>;
    flash: (start?: boolean) => Promise<void>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
    readImage: () => Promise<any>;
    writeImage: (image: any) => Promise<void>;
    readHTML: () => Promise<string>;
    writeHTML: (html: string) => Promise<void>;
    clear: () => void;
  };
}

// Verifica se estamos em um ambiente Electron
const isElectron = (): boolean => {
  return !!(window as any).electronAPI;
};

// Helper para acessar a API do Electron com segurança
const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return (window as any).electronAPI;
  }
  return null;
};

const DesktopFeaturesDemo: React.FC = () => {
  // Estados
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [clipboardText, setClipboardText] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isTaskbarFlashing, setIsTaskbarFlashing] = useState<boolean>(false);
  const [badgeText, setBadgeText] = useState<string>('');
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  
  // Refs
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dropZoneId = 'desktop-features-drop-zone';
  
  // Efeito para configurar o drag-and-drop
  useEffect(() => {
    const electronAPI = getElectronAPI();
    
    if (!electronAPI || !dropZoneRef.current) return;
    
    // Registrar a zona de drop
    electronAPI.dragDrop.registerFileDropZone(dropZoneId);
    
    // Inscrever-se em eventos de drop
    const unsubscribe = electronAPI.dragDrop.onDrop((files) => {
      setDroppedFiles(files);
    });
    
    // Cleanup
    return () => {
      unsubscribe();
      electronAPI.dragDrop.unregisterFileDropZone(dropZoneId);
    };
  }, []);
  
  // Efeito para simular a barra de progresso
  useEffect(() => {
    if (!isElectron()) return;
    
    let interval: NodeJS.Timeout | null = null;
    
    if (progressValue > 0 && progressValue < 1) {
      interval = setInterval(() => {
        setProgressValue((prev) => {
          const newValue = prev + 0.01;
          return newValue > 1 ? 1 : newValue;
        });
      }, 200);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progressValue]);
  
  // Atualiza a barra de progresso no taskbar
  useEffect(() => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    if (progressValue === 0) {
      electronAPI.taskbar.clearProgressBar();
    } else {
      electronAPI.taskbar.setProgressBar(progressValue);
    }
  }, [progressValue]);
  
  // Manipuladores de eventos
  const handleOpenFile = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const files = await electronAPI.dialog.openFile({
        title: 'Selecione arquivos',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'Imagens', extensions: ['jpg', 'png', 'gif'] },
          { name: 'Documentos', extensions: ['doc', 'docx', 'pdf', 'txt'] }
        ]
      });
      
      if (files) {
        setSelectedFiles(files);
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
    }
  };
  
  const handleSaveFile = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const filePath = await electronAPI.dialog.saveFile({
        title: 'Salvar arquivo',
        defaultPath: 'arquivo.txt',
        filters: [
          { name: 'Arquivos de texto', extensions: ['txt'] },
          { name: 'Todos os arquivos', extensions: ['*'] }
        ]
      });
      
      if (filePath) {
        setSavedFilePath(filePath);
      }
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
    }
  };
  
  const handleSelectDirectory = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const directories = await electronAPI.dialog.openDirectory({
        title: 'Selecione um diretório',
        properties: ['openDirectory', 'createDirectory']
      });
      
      if (directories && directories.length > 0) {
        setSelectedDirectory(directories[0]);
      }
    } catch (error) {
      console.error('Erro ao selecionar diretório:', error);
    }
  };
  
  const handleGetSystemInfo = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const info = await electronAPI.system.getInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
    }
  };
  
  const handleReadClipboard = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const text = await electronAPI.clipboard.readText();
      setClipboardText(text);
    } catch (error) {
      console.error('Erro ao ler área de transferência:', error);
    }
  };
  
  const handleWriteClipboard = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      await electronAPI.clipboard.writeText(clipboardText);
      alert('Texto copiado para a área de transferência');
    } catch (error) {
      console.error('Erro ao escrever na área de transferência:', error);
    }
  };
  
  const handleStartProgress = () => {
    setProgressValue(0.01);
  };
  
  const handleStopProgress = () => {
    setProgressValue(0);
  };
  
  const handleCompleteProgress = () => {
    setProgressValue(1);
  };
  
  const handleToggleFlash = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      await electronAPI.taskbar.flash(!isTaskbarFlashing);
      setIsTaskbarFlashing(!isTaskbarFlashing);
    } catch (error) {
      console.error('Erro ao alternar piscar taskbar:', error);
    }
  };
  
  const handleSetBadge = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      await electronAPI.taskbar.setBadge(badgeText);
    } catch (error) {
      console.error('Erro ao definir badge:', error);
    }
  };
  
  const handleShowMessage = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      const result = await electronAPI.dialog.showMessage({
        type: 'info',
        title: 'Mensagem',
        message: 'Esta é uma mensagem de exemplo',
        detail: 'Esta é uma mensagem de exemplo usando a API de diálogo do Electron',
        buttons: ['OK', 'Cancelar']
      });
      
      console.log('Resultado da mensagem:', result);
    } catch (error) {
      console.error('Erro ao mostrar mensagem:', error);
    }
  };
  
  const handleOpenUrl = async () => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;
    
    try {
      await electronAPI.system.openExternal('https://github.com/YourOrg/VibeForge');
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
    }
  };
  
  // Se não estiver no Electron, mostra uma mensagem
  if (!isElectron()) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Demo de Recursos Desktop</h2>
        <div className="p-4 bg-amber-100 text-amber-800 rounded-md">
          Esta demonstração só funciona quando executada dentro do aplicativo Electron.
          Execute o aplicativo desktop para testar estas funcionalidades.
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Demo de Recursos Desktop</h2>
      
      {/* Diálogos de arquivo */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Diálogos de Arquivo</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleOpenFile}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Abrir Arquivo
          </button>
          <button
            onClick={handleSaveFile}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Salvar Arquivo
          </button>
          <button
            onClick={handleSelectDirectory}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Selecionar Diretório
          </button>
          <button
            onClick={handleShowMessage}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Mostrar Mensagem
          </button>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mb-2">
            <h4 className="font-medium">Arquivos selecionados:</h4>
            <ul className="text-sm">
              {selectedFiles.map((file, index) => (
                <li key={index} className="truncate">{file}</li>
              ))}
            </ul>
          </div>
        )}
        
        {selectedDirectory && (
          <div className="mb-2">
            <h4 className="font-medium">Diretório selecionado:</h4>
            <p className="text-sm truncate">{selectedDirectory}</p>
          </div>
        )}
        
        {savedFilePath && (
          <div>
            <h4 className="font-medium">Arquivo salvo em:</h4>
            <p className="text-sm truncate">{savedFilePath}</p>
          </div>
        )}
      </section>
      
      {/* Drag & Drop */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Drag & Drop</h3>
        <div
          ref={dropZoneRef}
          id={dropZoneId}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <p className="text-gray-500">Arraste e solte arquivos aqui</p>
          {droppedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium">Arquivos recebidos:</h4>
              <ul className="text-sm text-left">
                {droppedFiles.map((file, index) => (
                  <li key={index} className="truncate">{file}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      
      {/* Taskbar / Dock */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Taskbar / Dock</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <h4 className="font-medium mb-1">Barra de Progresso</h4>
            <div className="flex items-center gap-2 mb-2">
              <progress value={progressValue} max="1" className="flex-grow"></progress>
              <span>{Math.round(progressValue * 100)}%</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartProgress}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Iniciar
              </button>
              <button
                onClick={handleCompleteProgress}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Completar
              </button>
              <button
                onClick={handleStopProgress}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Limpar
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Piscar Taskbar</h4>
            <button
              onClick={handleToggleFlash}
              className={`px-3 py-1 text-white text-sm rounded ${
                isTaskbarFlashing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isTaskbarFlashing ? 'Parar de Piscar' : 'Iniciar Piscar'}
            </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Badge (macOS/Linux)</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-16 px-2 py-1 border rounded text-sm"
                placeholder="1"
              />
              <button
                onClick={handleSetBadge}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
              >
                Definir
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Área de Transferência */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Área de Transferência</h3>
        <div className="flex gap-4 mb-4">
          <div className="flex-grow">
            <textarea
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              className="w-full h-24 p-2 border rounded"
              placeholder="Digite algo para copiar ou cole texto aqui..."
            ></textarea>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleReadClipboard}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ler
            </button>
            <button
              onClick={handleWriteClipboard}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Escrever
            </button>
          </div>
        </div>
      </section>
      
      {/* Informações do Sistema */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Informações do Sistema</h3>
        <div className="mb-4">
          <button
            onClick={handleGetSystemInfo}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            Obter Informações do Sistema
          </button>
          <button
            onClick={handleOpenUrl}
            className="ml-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Abrir URL Externa
          </button>
        </div>
        
        {systemInfo && (
          <div className="bg-gray-50 rounded-md p-4 text-sm">
            <h4 className="font-medium mb-2">Informações do Sistema:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p><strong>Plataforma:</strong> {systemInfo.platform}</p>
                <p><strong>Arquitetura:</strong> {systemInfo.arch}</p>
                <p><strong>Versão do SO:</strong> {systemInfo.osVersion}</p>
                <p><strong>Hostname:</strong> {systemInfo.hostname}</p>
              </div>
              <div>
                <p><strong>CPUs:</strong> {systemInfo.cpus?.length}</p>
                <p><strong>Memória Total:</strong> {Math.round(systemInfo.memory?.total / (1024 * 1024 * 1024))} GB</p>
                <p><strong>Memória Livre:</strong> {Math.round(systemInfo.memory?.free / (1024 * 1024 * 1024))} GB</p>
                <p><strong>Tempo de Atividade:</strong> {Math.round(systemInfo.uptime / 3600)} horas</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DesktopFeaturesDemo; 