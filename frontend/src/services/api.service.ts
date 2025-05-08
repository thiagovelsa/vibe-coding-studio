import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { errorManager, ErrorSource, ErrorSeverity } from '../lib/ErrorManager';

// Interface para o retorno do hook useApi
interface UseApiReturn {
  api: AxiosInstance | null;
  loading: boolean;
  error: Error | null;
  clearError: () => void;
}

// Configuração da API
interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Formatar mensagem de erro amigável
export const formatApiErrorMessage = (error: AxiosError): string => {
  const statusCode = error.response?.status;
  
  // Mensagens customizadas por código de status
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return 'Requisição inválida. Verifique os dados enviados.';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Acesso negado. Você não tem permissão para este recurso.';
      case 404:
        return 'Recurso não encontrado.';
      case 408:
      case 504:
        return 'Tempo de requisição esgotado. O servidor está demorando para responder.';
      case 429:
        return 'Muitas requisições realizadas. Aguarde um momento e tente novamente.';
      case 500:
      case 502:
      case 503:
        return 'Erro no servidor. Tente novamente mais tarde.';
      default:
        if (statusCode >= 500) {
          return 'Erro no servidor. Tente novamente mais tarde.';
        } else if (statusCode >= 400) {
          return 'Erro na requisição. Verifique os dados e tente novamente.';
        }
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Tempo de conexão esgotado. Verifique sua conexão e tente novamente.';
  }
  
  if (error.code === 'ERR_NETWORK') {
    return 'Erro de rede. Verifique sua conexão com a internet.';
  }
  
  return error.message || 'Erro desconhecido na comunicação com o servidor.';
};

// Tratamento de erros de API
export const handleApiError = (error: unknown, context?: Record<string, any>): never => {
  let axiosError: AxiosError | null = null;
  let errorMessage = 'Erro desconhecido na comunicação com o servidor.';
  let statusCode: number | undefined;
  let apiErrorDetails: any = {};
  let originalResponse: unknown = null;
  
  // Extrair informações de erro se for um AxiosError
  if (axios.isAxiosError(error)) {
    axiosError = error;
    statusCode = axiosError.response?.status;
    originalResponse = axiosError.response?.data;
    errorMessage = formatApiErrorMessage(axiosError);
    
    apiErrorDetails = {
      method: axiosError.config?.method?.toUpperCase(),
      url: axiosError.config?.url,
      status: statusCode,
      statusText: axiosError.response?.statusText,
      responseData: axiosError.response?.data,
    };
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Usar nosso novo ErrorManager
  const appError = errorManager.createApiError(
    errorMessage, 
    {
      ...context,
      ...apiErrorDetails,
      originalError: error,
      originalResponse
    }
  );
  
  throw appError;
};

// Hook para usar a API
export const useApi = (config: ApiConfig = {}): UseApiReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Configuração padrão
  const defaultConfig: ApiConfig = {
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  };

  // Mesclar configuração padrão com a fornecida
  const apiConfig: ApiConfig = { ...defaultConfig, ...config };

  // Criar instância do Axios
  const api = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: apiConfig.headers,
    withCredentials: apiConfig.withCredentials,
  });

  // Interceptor de requisição
  api.interceptors.request.use(
    (config) => {
      setLoading(true);
      
      // Adicionar token de autenticação se disponível (exemplo)
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      setLoading(false);
      const appError = errorManager.createApiError(error, { phase: 'request' });
      setError(appError);
      return Promise.reject(appError);
    }
  );

  // Interceptor de resposta
  api.interceptors.response.use(
    (response) => {
      setLoading(false);
      return response;
    },
    (error) => {
      setLoading(false);
      
      // Gerar um erro para o ErrorManager que inclui informações do erro do Axios
      const apiError = axios.isAxiosError(error) ? error : new Error('Erro na resposta da API');
      const appError = errorManager.createApiError(
        apiError,
        {
          url: axios.isAxiosError(error) ? error.config?.url : undefined,
          method: axios.isAxiosError(error) ? error.config?.method : undefined,
          status: axios.isAxiosError(error) ? error.response?.status : undefined,
          data: axios.isAxiosError(error) ? error.response?.data : undefined,
          phase: 'response'
        }
      );
      
      // Definir erro no estado
      setError(appError);
      
      // Verificar se é um erro de autenticação (401)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Limpar dados de autenticação e redirecionar para login
        localStorage.removeItem('auth_token');
        // window.location.href = '/login'; // Descomente se tiver página de login
      }
      
      return Promise.reject(appError);
    }
  );

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    api,
    loading,
    error,
    clearError,
  };
};

// export default createApiClient; // Removed: createApiClient is not defined in this file 