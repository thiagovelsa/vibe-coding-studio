import React, { useState } from 'react';
import { FiCopy, FiCheck, FiCode, FiDownload, FiEye } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface CodePreviewProps {
  files: CodeFile[];
  title?: string;
  onApply?: (file: CodeFile) => Promise<void>;
  onDownload?: (file: CodeFile) => Promise<void>;
  darkMode?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  files,
  title = 'Código Gerado',
  onApply,
  onDownload,
  darkMode = false,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'split' | 'full'>('split');

  const activeFile = files[activeFileIndex] || files[0];

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar para a área de transferência:', err);
    }
  };

  const handleApply = async () => {
    if (onApply && activeFile) {
      await onApply(activeFile);
    }
  };

  const handleDownload = async () => {
    if (onDownload && activeFile) {
      await onDownload(activeFile);
    }
  };

  const guessLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      php: 'php',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
    };
    
    return languageMap[ext] || 'text';
  };

  const getHighlightLanguage = (file: CodeFile): string => {
    if (file.language) return file.language;
    return guessLanguage(file.name);
  };

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FiCode className="mx-auto mb-2 h-8 w-8" />
          <p>Nenhum código disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode(previewMode === 'split' ? 'full' : 'split')}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
            title={previewMode === 'split' ? 'Modo tela cheia' : 'Modo dividido'}
          >
            <FiEye size={16} />
          </button>
          {onDownload && (
            <button
              onClick={handleDownload}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-primary-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
              title="Fazer download"
            >
              <FiDownload size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-1 ${previewMode === 'split' ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {(previewMode === 'split' || files.length > 1) && (
          <div className={`${previewMode === 'split' ? 'w-1/4 min-w-[180px]' : 'w-full h-12'} overflow-auto border-r border-gray-200 dark:border-gray-700`}>
            <div className={`${previewMode === 'split' ? 'flex flex-col' : 'flex flex-row'} divide-y divide-gray-200 dark:divide-gray-700`}>
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700
                    ${activeFileIndex === index ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => setActiveFileIndex(index)}
                >
                  <div className="flex items-center">
                    <FiCode className="mr-2" />
                    <span className="truncate">{file.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-auto">
          <div className="absolute right-4 top-4 z-10 flex space-x-2">
            <button
              onClick={() => copyToClipboard(activeFile.content, activeFileIndex)}
              className="rounded-md bg-white p-2 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              title="Copiar código"
            >
              {copiedIndex === activeFileIndex ? <FiCheck className="text-green-500" /> : <FiCopy />}
            </button>
            {onApply && (
              <button
                onClick={handleApply}
                className="rounded-md bg-primary-500 p-2 text-white shadow-sm hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700"
                title="Aplicar código"
              >
                Aplicar
              </button>
            )}
          </div>

          <SyntaxHighlighter
            language={getHighlightLanguage(activeFile)}
            style={darkMode ? vscDarkPlus : vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              minHeight: '100%',
            }}
            showLineNumbers
            wrapLongLines
          >
            {activeFile.content}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default CodePreview; 