import React, { useState, useCallback, useMemo } from 'react';
import { FiSearch, FiFile, FiCode } from 'react-icons/fi';

const SearchPanel = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Otimizando o manipulador de pesquisa com useCallback
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simular resultados de pesquisa após um breve atraso
    setTimeout(() => {
      const mockResults = [
        { 
          id: 1, 
          file: 'App.tsx', 
          path: 'src/components/App.tsx', 
          icon: <FiCode size={14} />,
          lineNumber: 15,
          preview: 'function <mark>App</mark>() { return <div>...</div> }'
        },
        { 
          id: 2, 
          file: 'main.tsx', 
          path: 'src/main.tsx', 
          icon: <FiCode size={14} />,
          lineNumber: 8,
          preview: 'import <mark>App</mark> from \'./components/App\''
        },
        { 
          id: 3, 
          file: 'README.md', 
          path: 'README.md', 
          icon: <FiFile size={14} />,
          lineNumber: 12,
          preview: 'O <mark>app</mark> oferece funcionalidades avançadas...'
        }
      ];
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 800);
  }, [searchQuery]); // Dependência apenas de searchQuery

  // Valores derivados usando useMemo
  const hasResults = useMemo(() => searchResults.length > 0, [searchResults]);

  return (
    <div className="flex h-full flex-col">
      {/* Campo de pesquisa */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex overflow-hidden rounded-md border border-gray-300 focus-within:border-primary-500 dark:border-gray-600 dark:focus-within:border-primary-500">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full bg-white px-3 py-1.5 text-sm text-gray-800 outline-none dark:bg-gray-900 dark:text-gray-200"
          />
          <button
            type="submit"
            className="flex items-center justify-center bg-gray-100 px-3 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <FiSearch size={16} />
          </button>
        </div>
      </form>
      
      {/* Opções de filtro */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          Arquivos
        </button>
        <button className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          Código
        </button>
        <button className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          Símbolos
        </button>
      </div>
      
      {/* Resultados da pesquisa */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-300"></div>
            Pesquisando...
          </div>
        ) : searchQuery && hasResults ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {searchResults.length} resultado(s) encontrado(s)
            </div>
            
            {searchResults.map(result => (
              <div 
                key={result.id}
                className="cursor-pointer rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center text-sm">
                  {result.icon}
                  <span className="ml-2 font-medium">{result.file}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    Linha {result.lineNumber}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{result.path}</span>
                </div>
                <div 
                  className="mt-1 text-xs text-gray-800 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: result.preview }}
                ></div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum resultado encontrado para "{searchQuery}"
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Digite algo para pesquisar
          </div>
        )}
      </div>
    </div>
  );
});

export default SearchPanel; 