import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiClock, FiChevronDown, FiChevronRight } from 'react-icons/fi';

export interface TestSuite {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  tests: Test[];
}

export interface Test {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  errorMessage?: string;
  errorStack?: string;
  output?: string;
}

interface TestResultsProps {
  suites: TestSuite[];
  summary?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
  };
  onRerun?: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({
  suites,
  summary,
  onRerun,
}) => {
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({});
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed' | 'skipped'>('all');

  // Sumarizar resultados se não fornecidos explicitamente
  const calculatedSummary = summary || {
    totalTests: suites.reduce((sum, suite) => sum + suite.tests.length, 0),
    passedTests: suites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'passed').length, 0),
    failedTests: suites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'failed').length, 0),
    skippedTests: suites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'skipped').length, 0),
    duration: suites.reduce((sum, suite) => sum + suite.duration, 0),
  };

  const toggleSuite = (suiteId: string) => {
    setExpandedSuites((prev) => ({
      ...prev,
      [suiteId]: !prev[suiteId],
    }));
  };

  const toggleTest = (testId: string) => {
    setExpandedTests((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
  };

  const filteredSuites = suites.map(suite => ({
    ...suite,
    tests: suite.tests.filter(test => {
      if (filter === 'all') return true;
      return test.status === filter;
    }),
  })).filter(suite => suite.tests.length > 0);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <FiCheckCircle className="text-green-500" />;
      case 'failed':
        return <FiXCircle className="text-red-500" />;
      case 'skipped':
        return <FiAlertCircle className="text-gray-400" />;
      case 'running':
        return <FiClock className="text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getTestStatusColor = (status: string): string => {
    switch (status) {
      case 'passed':
        return 'text-green-500 dark:text-green-400';
      case 'failed':
        return 'text-red-500 dark:text-red-400';
      case 'skipped':
        return 'text-gray-400 dark:text-gray-500';
      case 'running':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getTotalStatus = (): 'passed' | 'failed' | 'running' => {
    if (calculatedSummary.failedTests > 0) return 'failed';
    if (suites.some(suite => suite.status === 'running')) return 'running';
    return 'passed';
  };

  if (suites.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Nenhum resultado de teste disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Cabeçalho com resumo */}
      <div className="bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            {getStatusIcon(getTotalStatus())}
            <span className={`ml-2 font-medium ${getTestStatusColor(getTotalStatus())}`}>
              {getTotalStatus() === 'passed' ? 'Todos os testes passaram' : 
               getTotalStatus() === 'failed' ? 'Falha nos testes' : 'Testes em execução'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="font-mono text-green-500 dark:text-green-400">{calculatedSummary.passedTests}</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">passaram</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-red-500 dark:text-red-400">{calculatedSummary.failedTests}</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">falharam</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-gray-500 dark:text-gray-400">{calculatedSummary.skippedTests}</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">ignorados</span>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1 text-gray-500 dark:text-gray-400" />
              <span className="font-mono text-gray-500 dark:text-gray-400">
                {formatDuration(calculatedSummary.duration)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-between">
          <div className="flex space-x-2">
            <button
              className={`rounded px-2 py-1 text-xs ${filter === 'all' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              className={`rounded px-2 py-1 text-xs ${filter === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('failed')}
            >
              Falhas
            </button>
            <button
              className={`rounded px-2 py-1 text-xs ${filter === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('passed')}
            >
              Sucesso
            </button>
            <button
              className={`rounded px-2 py-1 text-xs ${filter === 'skipped' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setFilter('skipped')}
            >
              Ignorados
            </button>
          </div>
          
          {onRerun && (
            <button
              className="rounded bg-primary-50 px-2 py-1 text-xs text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
              onClick={onRerun}
            >
              Executar novamente
            </button>
          )}
        </div>
      </div>

      {/* Resultados dos testes */}
      <div className="flex-1 overflow-auto p-2">
        {filteredSuites.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Nenhum teste encontrado com o filtro selecionado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSuites.map((suite) => (
              <div key={suite.id} className="rounded-md border border-gray-200 dark:border-gray-700">
                <div
                  className={`flex cursor-pointer items-center justify-between p-3 ${
                    suite.status === 'failed' ? 'bg-red-50 dark:bg-red-900/10' : suite.status === 'passed' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                  onClick={() => toggleSuite(suite.id)}
                >
                  <div className="flex items-center">
                    <button className="mr-2">
                      {expandedSuites[suite.id] ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
                    <div className="mr-2">{getStatusIcon(suite.status)}</div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{suite.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{suite.tests.filter(t => t.status === 'passed').length} passaram</span>
                    <span>{suite.tests.filter(t => t.status === 'failed').length} falharam</span>
                    <span>{formatDuration(suite.duration)}</span>
                  </div>
                </div>
                
                {expandedSuites[suite.id] && (
                  <div className="divide-y divide-gray-100 p-2 dark:divide-gray-800">
                    {suite.tests.map((test) => (
                      <div key={test.id} className="py-2">
                        <div
                          className="flex cursor-pointer items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => toggleTest(test.id)}
                        >
                          <div className="flex items-center">
                            <div className="mr-2">{getStatusIcon(test.status)}</div>
                            <span className={`text-sm ${getTestStatusColor(test.status)}`}>{test.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDuration(test.duration)}
                          </div>
                        </div>
                        
                        {expandedTests[test.id] && test.status === 'failed' && (
                          <div className="ml-8 mt-2 text-xs">
                            {test.errorMessage && (
                              <div className="mb-2 rounded bg-red-50 p-2 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                {test.errorMessage}
                              </div>
                            )}
                            
                            {test.errorStack && (
                              <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                {test.errorStack}
                              </pre>
                            )}
                            
                            {test.output && (
                              <div className="mt-2">
                                <div className="text-gray-500 dark:text-gray-400">Saída do teste:</div>
                                <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                  {test.output}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResults; 