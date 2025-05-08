import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { env } from '@/config/env';
import { websocketEvents } from '@/config/websocketEvents';
import { AgentContext } from '@/context/AgentContext'; // Para dispatch de trigger
import { ApiChatMessage, ApiTriggerResponse } from '@/types/agent';
import { Logger } from '../lib/Logger';
import { sleep } from '@/utils/sleep';
import { Socket, io } from 'socket.io-client';

// Interface para mensagens do WebSocket
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id: string;
}

// --- Novas Interfaces para Payloads e Retornos --- 
export interface TriggerPayloadBase { sessionId: string; }

export interface TriggerTestGenerationPayload extends TriggerPayloadBase {
  coderMessageId: string;
  productMessageId?: string;
}

export interface TriggerSecurityAnalysisPayload extends TriggerPayloadBase {
  coderMessageId: string;
  productMessageId?: string; 
}

export interface TriggerTestSimulationPayload extends TriggerPayloadBase {
    coderMessageId: string;
    testGenMessageId: string;
}

export interface TriggerTestFixValidationPayload extends TriggerPayloadBase {
    coderFixMessageId: string; 
    testResultMessageId: string;
    originalCoderMessageId?: string;
    originalPassedTestsMessageId?: string;
}

export interface TriggerSecurityFixVerificationPayload extends TriggerPayloadBase {
    coderFixMessageId: string; 
    securityAnalysisMessageId: string;
    originalCoderMessageId?: string;
}

// Interface para resultados específicos (pode ser expandida)
export interface TriggerResult {
    event: string; // e.g., 'result:testGeneration', 'error:trigger'
    success: boolean;
    data?: any;
    message?: string;
}

export interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  autoReconnect?: boolean;
  bufferSize?: number; // Tamanho máximo do histórico de mensagens
  onTriggerResult?: (result: TriggerResult) => void; // Callback para resultados específicos
}

// Interface para o retorno do hook useWebSocket (ATUALIZADA)
export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  messages: WebSocketMessage[]; // Mensagens gerais ainda disponíveis
  sendMessage: (type: string, payload: any) => void;
  clearMessages: () => void;
  reconnect: () => void;
  disconnect: () => void;
  connectionError: Error | null;
  // --- NOVAS FUNÇÕES DE TRIGGER --- 
  triggerTestGeneration: (payload: TriggerTestGenerationPayload) => void;
  triggerSecurityAnalysis: (payload: TriggerSecurityAnalysisPayload) => void;
  triggerTestSimulation: (payload: TriggerTestSimulationPayload) => void;
  triggerTestFixValidation: (payload: TriggerTestFixValidationPayload) => void;
  triggerSecurityFixVerification: (payload: TriggerSecurityFixVerificationPayload) => void;
}

/**
 * Hook React para gerenciar conexão WebSocket
 * @param path Caminho do endpoint WebSocket
 * @param options Opções para o gerenciamento da conexão
 * @returns Objeto com estado da conexão, mensagens e funções
 */
export const useWebSocket = (
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  // Gera um URL WebSocket baseado no ambiente
  const getWebSocketUrl = useCallback((): string => {
    // Em desenvolvimento, usa o localhost
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? 'ws://localhost:3000' : '';
    
    if (baseUrl) {
      return baseUrl;
    }
    
    // Em produção, usa a URL da aplicação
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }, []);

  const {
    reconnectAttempts = 5,
    reconnectInterval = 2000,
    onOpen,
    onError,
    onClose,
    autoReconnect = true,
    bufferSize = 100,
    onTriggerResult, // Novo callback
  } = options;

  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  // Função para criar uma nova conexão WebSocket
  const connect = useCallback(() => {
    try {
      // Limpa qualquer tentativa de reconexão pendente
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Limpa qualquer conexão existente
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }

      setConnecting(true);
      setConnectionError(null);
      
      const wsUrl = getWebSocketUrl();
      
      // Configurar a nova conexão Socket.io
      const newSocket = io(wsUrl, {
        path: '/ws', // Crítico: deve corresponder ao path no backend
        transports: ['websocket'],
        reconnection: false, // Desativamos a reconexão automática do socket.io
        timeout: 10000, // Timeout em milissegundos
      });

      // Armazena a referência do socket
      socketRef.current = newSocket;

      // Configura os handlers de evento do Socket.io
      newSocket.on('connect', () => {
        Logger.info('WebSocket connected');
        setConnected(true);
        setConnecting(false);
        reconnectAttemptsRef.current = 0; // Resetar tentativas ao conectar
        if (onOpen) onOpen(new Event('open'));
      });

      newSocket.on('disconnect', (reason) => {
        Logger.warn(`WebSocket disconnected: ${reason}`);
        setConnected(false);
        
        if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          const timer = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
          reconnectTimerRef.current = timer;
        }
        
        if (onClose) onClose(new CloseEvent('close'));
      });

      newSocket.on('message', (data) => {
        try {
          // Não precisamos fazer parse pois o Socket.io já entrega o objeto
          const messageId = data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Verifica se é uma resposta de trigger específico
          if (data.event && (data.event.startsWith('result:') || data.event.startsWith('error:trigger'))) {
            const triggerResult: TriggerResult = {
              event: data.event,
              success: data.success !== false, // Assume sucesso a menos que explicitamente false
              data: data.data,
              message: data.message,
            };
            // Chama o callback se fornecido
            if (onTriggerResult) {
              onTriggerResult(triggerResult);
            }
          } else {
            // É uma mensagem genérica ou de broadcast, adiciona ao histórico geral
            const generalMessage: WebSocketMessage = {
              type: data.type || 'unknown',
              payload: data.payload || data,
              timestamp: data.timestamp || new Date().toISOString(),
              id: messageId,
            };
            setMessages(prev => {
              const newMessages = [...prev, generalMessage];
              return newMessages.slice(-bufferSize);
            });
          }
        } catch (err) {
          Logger.error('Failed to process WebSocket message:', err);
        }
      });

      newSocket.on('error', (error) => {
        Logger.error('WebSocket error', error);
        setConnectionError(error instanceof Error ? error : new Error('WebSocket connection error'));
        if (onError) onError(new Event('error'));
      });

      newSocket.on('connect_error', (error) => {
        Logger.error('WebSocket connect error', error);
        setConnectionError(error instanceof Error ? error : new Error('WebSocket connection error'));
        setConnected(false);
        setConnecting(false);
        
        if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          const timer = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
          reconnectTimerRef.current = timer;
        }
      });

    } catch (error) {
      Logger.error('Failed to establish WebSocket connection', error);
      setConnectionError(error instanceof Error ? error : new Error('WebSocket connection error'));
      setConnected(false);
      setConnecting(false);
    }
  }, [getWebSocketUrl, reconnectAttempts, reconnectInterval, autoReconnect, bufferSize, onOpen, onClose, onError, onTriggerResult]);

  // Conectar quando o componente montar
  useEffect(() => {
    connect();
    
    // Limpar quando o componente desmontar
    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  // Função para enviar mensagens
  const sendMessage = useCallback((type: string, payload: any) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    const messageToSend = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `outgoing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    socketRef.current.emit('message', messageToSend);
  }, [connected]);

  // Função para limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Função para reconectar manualmente
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Função para desconectar manualmente
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setConnected(false);
  }, []);

  // --- Funções específicas de trigger ---
  
  // Função para disparar geração de testes
  const triggerTestGeneration = useCallback((payload: TriggerTestGenerationPayload) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot trigger test generation: WebSocket not connected');
      return;
    }
    socketRef.current.emit('trigger:testGeneration', payload);
  }, [connected]);

  // Função para disparar análise de segurança
  const triggerSecurityAnalysis = useCallback((payload: TriggerSecurityAnalysisPayload) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot trigger security analysis: WebSocket not connected');
      return;
    }
    socketRef.current.emit('trigger:securityAnalysis', payload);
  }, [connected]);

  // Função para disparar simulação de testes
  const triggerTestSimulation = useCallback((payload: TriggerTestSimulationPayload) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot trigger test simulation: WebSocket not connected');
      return;
    }
    socketRef.current.emit('trigger:testSimulation', payload);
  }, [connected]);

  // Função para validar correção de testes
  const triggerTestFixValidation = useCallback((payload: TriggerTestFixValidationPayload) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot trigger test fix validation: WebSocket not connected');
      return;
    }
    socketRef.current.emit('trigger:testFixValidation', payload);
  }, [connected]);

  // Função para verificar correção de segurança
  const triggerSecurityFixVerification = useCallback((payload: TriggerSecurityFixVerificationPayload) => {
    if (!socketRef.current || !connected) {
      Logger.warn('Cannot trigger security fix verification: WebSocket not connected');
      return;
    }
    socketRef.current.emit('trigger:securityFixVerification', payload);
  }, [connected]);

  // Retornar interface unificada e memoizada
  return useMemo(() => ({
    connected,
    connecting,
    messages,
    sendMessage,
    clearMessages,
    reconnect,
    disconnect,
    connectionError,
    triggerTestGeneration,
    triggerSecurityAnalysis,
    triggerTestSimulation,
    triggerTestFixValidation,
    triggerSecurityFixVerification,
  }), [
    connected,
    connecting,
    messages,
    sendMessage,
    clearMessages,
    reconnect,
    disconnect,
    connectionError,
    triggerTestGeneration,
    triggerSecurityAnalysis,
    triggerTestSimulation,
    triggerTestFixValidation,
    triggerSecurityFixVerification,
  ]);
};

/**
 * Filtra mensagens por tipo
 * @param type Tipo de mensagem para filtrar
 * @param messages Lista de todas as mensagens
 * @returns Lista de mensagens do tipo especificado, com payload tipado
 */
export const useWebSocketMessagesByType = <T = any>(
  type: string,
  messages: WebSocketMessage[]
): T[] => {
  return useMemo(() => (
    messages
      .filter(msg => msg.type === type)
      .map(msg => msg.payload as T)
  ), [messages, type]);
}; 