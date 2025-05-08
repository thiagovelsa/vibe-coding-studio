import React, { createContext, useReducer, useCallback, ReactNode, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Importing just the types from ErrorManager instead of the hook
import { ApplicationError, ErrorSeverity, ErrorSource } from '../lib/ErrorManager';

// Tipos de problemas
export enum ProblemType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Interface para um problema
export interface Problem {
  id: string;
  message: string;
  type: ProblemType;
  source: ErrorSource | string;
  timestamp: string;
  code?: string;
  location?: {
    fileId?: string;
    filePath?: string;
    line?: number;
    column?: number;
  };
  relatedTo?: string[];
  isResolved: boolean;
  applicationError?: ApplicationError; // Referência ao erro original, se existir
  details?: string;
}

// Estado do contexto
interface ProblemsState {
  problems: Problem[];
  filter: {
    types: ProblemType[];
    sources: string[];
    onlyActive: boolean;
  };
  selectedProblemId: string | null;
}

// Ações para o reducer
type ProblemsAction =
  | { type: 'ADD_PROBLEM'; payload: Problem }
  | { type: 'REMOVE_PROBLEM'; payload: string } // ID do problema
  | { type: 'RESOLVE_PROBLEM'; payload: string } // ID do problema
  | { type: 'UNRESOLVE_PROBLEM'; payload: string } // ID do problema
  | { type: 'SET_FILTER_TYPES'; payload: ProblemType[] }
  | { type: 'SET_FILTER_SOURCES'; payload: string[] }
  | { type: 'SET_FILTER_ONLY_ACTIVE'; payload: boolean }
  | { type: 'SET_SELECTED_PROBLEM'; payload: string | null }
  | { type: 'CLEAR_ALL_PROBLEMS' }
  | { type: 'CLEAR_RESOLVED_PROBLEMS' };

// Estado inicial
const initialState: ProblemsState = {
  problems: [],
  filter: {
    types: [ProblemType.ERROR, ProblemType.WARNING, ProblemType.INFO],
    sources: [],
    onlyActive: true,
  },
  selectedProblemId: null,
};

// Reducer
function problemsReducer(state: ProblemsState, action: ProblemsAction): ProblemsState {
  switch (action.type) {
    case 'ADD_PROBLEM':
      // Não adicionar se já existe um problema com o mesmo ID
      if (state.problems.some(p => p.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        problems: [...state.problems, action.payload],
      };
    
    case 'REMOVE_PROBLEM':
      return {
        ...state,
        problems: state.problems.filter(p => p.id !== action.payload),
        selectedProblemId: state.selectedProblemId === action.payload ? null : state.selectedProblemId,
      };
    
    case 'RESOLVE_PROBLEM':
      return {
        ...state,
        problems: state.problems.map(p => 
          p.id === action.payload 
            ? { ...p, isResolved: true } 
            : p
        ),
      };
    
    case 'UNRESOLVE_PROBLEM':
      return {
        ...state,
        problems: state.problems.map(p => 
          p.id === action.payload 
            ? { ...p, isResolved: false } 
            : p
        ),
      };
    
    case 'SET_FILTER_TYPES':
      return {
        ...state,
        filter: {
          ...state.filter,
          types: action.payload,
        },
      };
    
    case 'SET_FILTER_SOURCES':
      return {
        ...state,
        filter: {
          ...state.filter,
          sources: action.payload,
        },
      };
    
    case 'SET_FILTER_ONLY_ACTIVE':
      return {
        ...state,
        filter: {
          ...state.filter,
          onlyActive: action.payload,
        },
      };
    
    case 'SET_SELECTED_PROBLEM':
      return {
        ...state,
        selectedProblemId: action.payload,
      };
    
    case 'CLEAR_ALL_PROBLEMS':
      return {
        ...state,
        problems: [],
        selectedProblemId: null,
      };
    
    case 'CLEAR_RESOLVED_PROBLEMS':
      return {
        ...state,
        problems: state.problems.filter(p => !p.isResolved),
        selectedProblemId: state.selectedProblemId !== null && 
          state.problems.find(p => p.id === state.selectedProblemId)?.isResolved
            ? null
            : state.selectedProblemId,
      };
    
    default:
      return state;
  }
}

// Interface do contexto
interface ProblemsContextType {
  state: ProblemsState;
  addProblem: (problem: Omit<Problem, 'id' | 'timestamp' | 'isResolved'>) => void;
  removeProblem: (id: string) => void;
  resolveProblem: (id: string) => void;
  unresolveProblem: (id: string) => void;
  setFilterTypes: (types: ProblemType[]) => void;
  setFilterSources: (sources: string[]) => void;
  setFilterOnlyActive: (onlyActive: boolean) => void;
  setSelectedProblem: (id: string | null) => void;
  clearAllProblems: () => void;
  clearResolvedProblems: () => void;
  getFilteredProblems: () => Problem[];
  getSelectedProblem: () => Problem | undefined;
  convertErrorToProblem: (error: ApplicationError) => Problem;
}

// Criar contexto
const ProblemsContext = createContext<ProblemsContextType | undefined>(undefined);

// Mapeamento de severidade para tipo de problema
function mapSeverityToProblemType(severity: ErrorSeverity): ProblemType {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      return ProblemType.ERROR;
    case ErrorSeverity.WARNING:
      return ProblemType.WARNING;
    case ErrorSeverity.INFO:
    default:
      return ProblemType.INFO;
  }
}

// Provider do contexto
export const ProblemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(problemsReducer, initialState);
  // Remove direct dependency on useErrorManager
  // const { state: errorState } = useErrorManager();

  // Função para gerar um ID único
  const generateUniqueId = (): string => {
    return `problem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Adicionar um problema
  const addProblem = useCallback((problem: Omit<Problem, 'id' | 'timestamp' | 'isResolved'>) => {
    const newProblem: Problem = {
      ...problem,
      id: generateUniqueId(),
      timestamp: new Date().toISOString(),
      isResolved: false,
    };
    dispatch({ type: 'ADD_PROBLEM', payload: newProblem });
  }, []);

  // Remover um problema
  const removeProblem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PROBLEM', payload: id });
  }, []);

  // Resolver um problema
  const resolveProblem = useCallback((id: string) => {
    dispatch({ type: 'RESOLVE_PROBLEM', payload: id });
  }, []);

  // Desfazer resolução de um problema
  const unresolveProblem = useCallback((id: string) => {
    dispatch({ type: 'UNRESOLVE_PROBLEM', payload: id });
  }, []);

  // Definir tipos de filtro
  const setFilterTypes = useCallback((types: ProblemType[]) => {
    dispatch({ type: 'SET_FILTER_TYPES', payload: types });
  }, []);

  // Definir fontes de filtro
  const setFilterSources = useCallback((sources: string[]) => {
    dispatch({ type: 'SET_FILTER_SOURCES', payload: sources });
  }, []);

  // Definir filtro de apenas ativos
  const setFilterOnlyActive = useCallback((onlyActive: boolean) => {
    dispatch({ type: 'SET_FILTER_ONLY_ACTIVE', payload: onlyActive });
  }, []);

  // Definir problema selecionado
  const setSelectedProblem = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_PROBLEM', payload: id });
  }, []);

  // Limpar todos os problemas
  const clearAllProblems = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_PROBLEMS' });
  }, []);

  // Limpar problemas resolvidos
  const clearResolvedProblems = useCallback(() => {
    dispatch({ type: 'CLEAR_RESOLVED_PROBLEMS' });
  }, []);

  // Obter problemas filtrados
  const getFilteredProblems = useCallback(() => {
    return state.problems.filter(problem => {
      // Filtrar por tipo
      if (!state.filter.types.includes(problem.type)) {
        return false;
      }

      // Filtrar por fonte
      if (state.filter.sources.length > 0 && !state.filter.sources.includes(problem.source)) {
        return false;
      }

      // Filtrar por status (ativo/resolvido)
      if (state.filter.onlyActive && problem.isResolved) {
        return false;
      }

      return true;
    });
  }, [state.problems, state.filter]);

  // Obter problema selecionado
  const getSelectedProblem = useCallback(() => {
    return state.problems.find(p => p.id === state.selectedProblemId);
  }, [state.problems, state.selectedProblemId]);

  // Converter erro da aplicação em problema
  const convertErrorToProblem = useCallback((error: ApplicationError): Problem => {
    return {
      id: error.id || generateUniqueId(),
      message: error.userFriendlyMessage || error.message,
      type: mapSeverityToProblemType(error.severity),
      source: error.source,
      timestamp: error.timestamp || new Date().toISOString(),
      code: error.code,
      location: error.location,
      isResolved: false,
      applicationError: error,
      details: error.stack,
    };
  }, []);

  const contextValue: ProblemsContextType = {
    state,
    addProblem,
    removeProblem,
    resolveProblem,
    unresolveProblem,
    setFilterTypes,
    setFilterSources,
    setFilterOnlyActive,
    setSelectedProblem,
    clearAllProblems,
    clearResolvedProblems,
    getFilteredProblems,
    getSelectedProblem,
    convertErrorToProblem
  };

  return (
    <ProblemsContext.Provider value={contextValue}>
      {children}
    </ProblemsContext.Provider>
  );
};

// Hook para usar o contexto
export const useProblems = (): ProblemsContextType => {
  const context = useContext(ProblemsContext);
  if (!context) {
    throw new Error('useProblems deve ser usado dentro de um ProblemsProvider');
  }
  return context;
}; 