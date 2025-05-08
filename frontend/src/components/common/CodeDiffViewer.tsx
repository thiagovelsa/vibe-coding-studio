import React, { useRef, useEffect } from 'react';
import { DiffEditor, Monaco } from '@monaco-editor/react'; // Importa DiffEditor
// import { motion } from 'framer-motion'; // Não mais necessário
import { FiCopy, FiMaximize2 } from 'react-icons/fi'; // Ícones relevantes
import { useTheme } from '../../context/ThemeProvider'; // Ajustado caminho
import { AnimatedDiv } from '../common/AnimatedDiv'; // Importar
import { AnimatedButton } from '../common/AnimatedButton'; // Importar
import { variants } from '../../lib/animations'; // Importar
import { Logger } from '../../lib/Logger';
import { toast } from 'react-hot-toast';
import { Button } from '../common/ui/button';

// --- Reutiliza a definição de tema do CodeViewer ---
// (Idealmente, importe de um arquivo compartilhado)
const defineMonacoTheme = (monaco: Monaco, themeMode: 'light' | 'dark') => {
  const isDark = themeMode === 'dark';
  monaco.editor.defineTheme('vibe-glass-theme', { // Usa o mesmo nome de tema
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // ... (regras de sintaxe iguais ao CodeViewer) ...
      { token: 'comment', foreground: isDark ? '6a737d' : '6a737d' },
      { token: 'keyword', foreground: isDark ? 'c586c0' : 'b4009a' },
      { token: 'identifier', foreground: isDark ? '9cdcfe' : '005cc5' },
      { token: 'string', foreground: isDark ? 'ce9178' : 'a31515' },
      { token: 'number', foreground: isDark ? 'b5cea8' : '2f8a10' },
      { token: 'type', foreground: isDark ? '4ec9b0' : '267f99' },
    ],
    colors: {
      'editor.background': '#00000000',
      'editor.foreground': isDark ? '#cccccc' : '#333333',
      'editorLineNumber.foreground': isDark ? '#6e7681' : '#aaaaaa',
      'editorLineNumber.activeForeground': isDark ? '#c6c6c6' : '#777777',
      'editorGutter.background': '#00000000',
      'scrollbarSlider.background': isDark ? '#4e4e4e80' : '#aaaaaa80',
      'scrollbarSlider.hoverBackground': isDark ? '#68686880' : '#99999980',
      'scrollbarSlider.activeBackground': isDark ? '#83838380' : '#77777780',
      // Cores específicas do Diff Editor (suaves e transparentes)
      'diffEditor.insertedTextBackground': isDark ? '#2ea0431f' : '#abf2bc33', // Verde bem suave
      'diffEditor.removedTextBackground': isDark ? '#f851491f' : '#ffcec633', // Vermelho bem suave
      'diffEditor.insertedLineBackground': isDark ? '#2ea04315' : '#abf2bc20', // Gutter/linha inserida
      'diffEditor.removedLineBackground': isDark ? '#f8514915' : '#ffcec620', // Gutter/linha removida
    },
  });
};

// --- Componente Título para Diff com AnimatedButton ---
interface DiffTitleBarProps {
  originalFileName?: string;
  modifiedFileName?: string;
  onCopyDiff?: () => void; // Pode querer copiar o diff em formato patch
  onMaximize?: () => void;
  theme: 'light' | 'dark';
}

const DiffTitleBar: React.FC<DiffTitleBarProps> = ({ originalFileName, modifiedFileName, onCopyDiff, onMaximize, theme }) => {
  const titleBg = theme === 'dark' ? 'bg-black/10' : 'bg-white/15';
  const iconColor = theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700';
  const fileName = modifiedFileName || originalFileName || 'diff';

  return (
    <div className={`flex items-center justify-between h-8 px-3 ${titleBg} backdrop-blur-sm rounded-t-lg border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
      <span className="text-xs font-medium truncate mr-4">{`Diff: ${fileName}`}</span>
      <div className="flex items-center space-x-1.5">
        {onCopyDiff && (
          <AnimatedButton 
            title="Copiar Diff" 
            onClick={onCopyDiff} 
            className={`p-1 rounded ${iconColor} transition-colors`}
            variant="subtleScale"
          >
            <FiCopy className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
        {onMaximize && (
           <AnimatedButton 
            title="Maximizar" 
            onClick={onMaximize} 
            className={`p-1 rounded ${iconColor} transition-colors`}
            variant="subtleScale"
          >
            <FiMaximize2 className="w-3.5 h-3.5" />
          </AnimatedButton>
        )}
      </div>
    </div>
  );
};

// --- Componente Principal CodeDiffViewer ---
interface CodeDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language: string;
  originalFileName?: string;
  modifiedFileName?: string;
  className?: string;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ 
    originalCode,
    modifiedCode,
    language,
    originalFileName,
    modifiedFileName,
    className = '' 
}) => {
  const { theme } = useTheme();
  const monacoRef = useRef<Monaco | null>(null);
  const diffEditorRef = useRef<any>(null); // Monaco Diff Editor instance type

  const wrapperBg = theme === 'dark' ? 'bg-black/20' : 'bg-white/25';

  const handleEditorWillMount = (monacoInstance: Monaco) => {
    monacoRef.current = monacoInstance;
    defineMonacoTheme(monacoInstance, theme); // Reusa a definição de tema
  };

  useEffect(() => {
    if (monacoRef.current) {
      defineMonacoTheme(monacoRef.current, theme);
      monacoRef.current.editor.setTheme('vibe-glass-theme');
    }
  }, [theme]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    diffEditorRef.current = editor;
    // Outras configs pós-montagem
  }

  // Ação de cópia para diff pode ser mais complexa (formato patch?)
  const handleCopyDiff = () => {
    // console.log("Copiar diff - Lógica a implementar");
    Logger.info("Copy diff - Logic to implement");
    navigator.clipboard.writeText(patch);
    toast.info("Diff copiado para a área de transferência!");
  };

  return (
    <AnimatedDiv 
        className={`rounded-xl overflow-hidden shadow-lg ${wrapperBg} backdrop-blur-md ${className}`}
        initial="hidden"
        animate="visible"
        variants={variants.scaleIn}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <DiffTitleBar 
        originalFileName={originalFileName}
        modifiedFileName={modifiedFileName}
        theme={theme} 
        onCopyDiff={handleCopyDiff} 
      />
      <div className="relative h-[400px]"> {/* Altura fixa ou use flex-grow */} 
        <DiffEditor
          height="100%"
          language={language}
          original={originalCode}
          modified={modifiedCode}
          theme="vibe-glass-theme" // Mesmo tema
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            domReadOnly: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
            wordWrap: 'off', // Geralmente melhor para diff
            automaticLayout: true,
            renderSideBySide: false, // Visão Inline (mais minimalista)
            enableSplitViewResizing: false,
            renderIndicators: true, // Mostra +/- no gutter
            // Opções de scrollbar minimalistas
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
              useShadows: false,
              arrowSize: 8,
            },
            // Outras opções visuais
            matchBrackets: 'never',
            occurrencesHighlight: false,
            selectionHighlight: false,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
        />
      </div>
    </AnimatedDiv>
  );
};

// export default CodeDiffViewer; 