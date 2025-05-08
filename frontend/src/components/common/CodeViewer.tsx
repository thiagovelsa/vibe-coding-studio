import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { FiCopy, FiDownload, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeProvider';
import { AnimatedDiv } from '../common/AnimatedDiv';
import { AnimatedButton } from '../common/AnimatedButton';
import { variants } from '../../lib/animations';
import { toast } from 'react-toastify';
import { getVibeGlassTheme } from '../../themes/monaco/vibe-glass-theme';

// --- Componente Título com AnimatedButton ---
interface TitleBarProps {
  fileName: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onToggleMaximize: () => void;
  isMaximized: boolean;
  theme: 'light' | 'dark';
}

const TitleBar: React.FC<TitleBarProps> = ({ fileName, onCopy, onDownload, onToggleMaximize, isMaximized, theme }) => {
  const titleBg = theme === 'dark' ? 'bg-black/10' : 'bg-white/15';
  const buttonBg = theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'; // Hover handled by AnimatedButton
  const iconColor = theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'; // Add hover color change here or rely on AnimatedButton
  const MaximizeIcon = isMaximized ? FiMinimize2 : FiMaximize2;
  const maximizeTitle = isMaximized ? 'Minimizar' : 'Maximizar';

  return (
    <div className={`flex items-center justify-between h-8 px-3 ${titleBg} backdrop-blur-sm rounded-t-lg border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
      <span className="text-xs font-medium truncate mr-4">{fileName}</span>
      <div className="flex items-center space-x-1.5">
        {onCopy && (
          <AnimatedButton 
            title="Copiar" 
            onClick={onCopy} 
            className={`p-1 rounded ${iconColor} transition-colors`}
            variant="subtleScale"
           >
            <FiCopy className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
        {onDownload && (
           <AnimatedButton 
              title="Baixar" 
              onClick={onDownload} 
              className={`p-1 rounded ${iconColor} transition-colors`}
              variant="subtleScale"
            >
            <FiDownload className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
         <AnimatedButton 
              title={maximizeTitle} 
              onClick={onToggleMaximize} 
              className={`p-1 rounded ${iconColor} transition-colors`}
              variant="subtleScale"
            >
            <MaximizeIcon className="w-3.5 h-3.5" />
          </AnimatedButton>
      </div>
    </div>
  );
};

// --- Componente Principal CodeViewer ---
interface CodeViewerProps {
  content: string;
  language: string;
  filePath?: string;
  className?: string;
  onContentChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ 
    content,
    language,
    filePath = '',
    className = '',
    onContentChange,
    readOnly = false
}) => {
  const { theme } = useTheme();
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const baseWrapperClasses = `rounded-xl overflow-hidden shadow-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white/25'} backdrop-blur-md ${className}`;
  const maximizedWrapperClasses = `fixed inset-0 z-50 rounded-none shadow-2xl ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`;
  
  const effectiveFileName = filePath ? filePath.split(/[\\/]/).pop() || 'file' : 'untitled';

  // Define e aplica o tema
  const setupTheme = useCallback((monacoInstance: Monaco) => {
    const themeData = getVibeGlassTheme(theme);
    monacoInstance.editor.defineTheme('vibe-glass-theme', themeData);
    monacoInstance.editor.setTheme('vibe-glass-theme');
  }, [theme]);

  // Carrega o tema quando o Monaco estiver pronto
  const handleEditorWillMount = useCallback((monacoInstance: Monaco) => {
    monacoRef.current = monacoInstance;
    setupTheme(monacoInstance);
  }, [setupTheme]);

  // Re-define o tema se o tema da aplicação mudar
  useEffect(() => {
    if (monacoRef.current) {
      setupTheme(monacoRef.current);
    }
  }, [theme, setupTheme]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    // Focar o editor se não for read-only?
    // if (!readOnly) {
    //  editor.focus();
    // }
  }

  // --- Ações --- 
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
        .then(() => toast.success('Conteúdo copiado!'))
        .catch(err => toast.error('Falha ao copiar.'));
  }, [content]);

  const handleDownload = useCallback(() => {
      try {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = effectiveFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.info(`Baixando ${effectiveFileName}...`);
      } catch (err) {
           toast.error('Falha ao baixar.');
      }
  }, [content, effectiveFileName]);

  // --- Toggle Maximize --- 
  const toggleMaximize = useCallback(() => {
       setIsMaximized(prev => !prev);
        // Forçar layout do editor após a mudança de estado e re-renderização
        // Usar requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        });
   }, []);

  if (editorRef.current && monacoRef.current) {
    const model = editorRef.current.getModel();
    if (model && onContentChange) {
      // O listener já está anexado no onMount, apenas certifique-se que está atualizado
    }
     // Adiciona salvamento com Ctrl+S se não for readonly
     // if (!readOnly) {
     //   editorRef.current.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS, () => {
     //     // Chamar onSave aqui
     //     if (onSave) onSave(model.getValue());
     //   });
     // }
  }

  return (
    <AnimatedDiv 
        className={`${isMaximized ? maximizedWrapperClasses : baseWrapperClasses} flex flex-col`}
        initial={!isMaximized ? "hidden" : false}
        animate={!isMaximized ? "visible" : false}
        variants={variants.scaleIn}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ height: isMaximized ? '100vh' : '100%' }}
    >
      <TitleBar 
          fileName={effectiveFileName}
          theme={theme} 
          onCopy={handleCopy} 
          onDownload={handleDownload} 
          onToggleMaximize={toggleMaximize}
          isMaximized={isMaximized}
      />
      <div className="relative flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vibe-glass-theme"
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={onContentChange}
          options={{
            readOnly: readOnly,
            domReadOnly: readOnly,
            lineNumbersMinChars: 3,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            minimap: { enabled: true, scale: 1, side: 'right' },
            fontSize: 13,
            fontFamily: 'Fira Code, Menlo, Monaco, Consolas, "Courier New", monospace',
            fontLigatures: true,
            wordWrap: 'on',
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            renderLineHighlight: readOnly ? 'none' : 'gutter',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
              arrowSize: 8,
            },
            padding: {
                top: 10,
                bottom: 10
            },
            matchBrackets: 'always',
            renderIndentGuides: true,
            occurrencesHighlight: true,
            selectionHighlight: true,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            stickyScroll: { enabled: true },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
          }}
        />
      </div>
    </AnimatedDiv>
  );
};

// export default CodeViewer; 