import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * Serviço para gerenciar comunicação WebSocket
 * Fornece métodos para enviar mensagens para clientes conectados
 */
@Injectable()
export class WebSocketService {
  private logger = new Logger('WebSocketService');
  private server: Server | null = null;
  
  /**
   * Define a instância do servidor Socket.io
   * @param server Instância do servidor Socket.io
   */
  setServer(server: Server) {
    this.server = server;
    this.logger.log('Servidor WebSocket configurado');
  }
  
  /**
   * Verifica se o servidor WebSocket está configurado
   * @returns true se o servidor estiver configurado, false caso contrário
   */
  isServerConfigured(): boolean {
    return this.server !== null;
  }
  
  /**
   * Envia uma mensagem para todos os clientes conectados
   * @param type Tipo da mensagem
   * @param payload Conteúdo da mensagem
   */
  broadcast(type: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Tentativa de broadcast sem servidor WebSocket configurado');
      return;
    }
    
    const message: WebSocketMessage = { type, payload };
    this.server.emit('message', message);
    this.logger.debug(`Mensagem de broadcast enviada: ${type}`);
  }
  
  /**
   * Envia uma mensagem para um cliente específico
   * @param clientId ID do cliente Socket.io
   * @param type Tipo da mensagem
   * @param payload Conteúdo da mensagem
   * @returns true se a mensagem foi enviada, false caso contrário
   */
  sendToClient(clientId: string, type: string, payload: any): boolean {
    if (!this.server) {
      this.logger.warn(`Tentativa de enviar mensagem para cliente ${clientId} sem servidor WebSocket configurado`);
      return false;
    }
    
    // Obtém o socket do cliente
    const socket = this.getSocketById(clientId);
    if (!socket) {
      this.logger.warn(`Cliente ${clientId} não encontrado`);
      return false;
    }
    
    // Envia a mensagem
    const message: WebSocketMessage = { type, payload };
    socket.emit('message', message);
    this.logger.debug(`Mensagem enviada para cliente ${clientId}: ${type}`);
    
    return true;
  }
  
  /**
   * Envia uma mensagem para um grupo específico de clientes
   * @param room Nome da sala/grupo
   * @param type Tipo da mensagem
   * @param payload Conteúdo da mensagem
   */
  sendToRoom(room: string, type: string, payload: any) {
    if (!this.server) {
      this.logger.warn(`Tentativa de enviar mensagem para sala ${room} sem servidor WebSocket configurado`);
      return;
    }
    
    const message: WebSocketMessage = { type, payload };
    this.server.to(room).emit('message', message);
    this.logger.debug(`Mensagem enviada para sala ${room}: ${type}`);
  }
  
  /**
   * Adiciona um cliente a uma sala específica
   * @param clientId ID do cliente Socket.io
   * @param room Nome da sala
   * @returns true se o cliente foi adicionado, false caso contrário
   */
  addClientToRoom(clientId: string, room: string): boolean {
    if (!this.server) {
      this.logger.warn('Tentativa de adicionar cliente a sala sem servidor WebSocket configurado');
      return false;
    }
    
    // Obtém o socket do cliente
    const socket = this.getSocketById(clientId);
    if (!socket) {
      this.logger.warn(`Cliente ${clientId} não encontrado`);
      return false;
    }
    
    // Adiciona o cliente à sala
    socket.join(room);
    this.logger.debug(`Cliente ${clientId} adicionado à sala ${room}`);
    
    return true;
  }
  
  /**
   * Remove um cliente de uma sala específica
   * @param clientId ID do cliente Socket.io
   * @param room Nome da sala
   * @returns true se o cliente foi removido, false caso contrário
   */
  removeClientFromRoom(clientId: string, room: string): boolean {
    if (!this.server) {
      this.logger.warn('Tentativa de remover cliente de sala sem servidor WebSocket configurado');
      return false;
    }
    
    // Obtém o socket do cliente
    const socket = this.getSocketById(clientId);
    if (!socket) {
      this.logger.warn(`Cliente ${clientId} não encontrado`);
      return false;
    }
    
    // Remove o cliente da sala
    socket.leave(room);
    this.logger.debug(`Cliente ${clientId} removido da sala ${room}`);
    
    return true;
  }
  
  /**
   * Envia notificação de atualização do orquestrador
   * @param type Tipo da atualização
   * @param data Dados da atualização
   */
  notifyOrchestratorUpdate(type: string, data: any) {
    this.broadcast(`orchestrator:${type}`, data);
  }
  
  /**
   * Envia notificação de atualização de agente
   * @param agentType Tipo do agente
   * @param action Ação realizada
   * @param data Dados da atualização
   */
  notifyAgentUpdate(agentType: string, action: string, data: any) {
    this.broadcast(`agent:${agentType}:${action}`, data);
  }
  
  /**
   * Obtém o socket de um cliente pelo ID
   * @param clientId ID do cliente Socket.io
   * @returns Socket do cliente ou null se não encontrado
   */
  private getSocketById(clientId: string): Socket | null {
    if (!this.server) return null;
    
    // Socket.io v4+
    return this.server.sockets.sockets.get(clientId) || null;
  }
  
  /**
   * Obtém o número de clientes conectados
   * @returns Número de clientes conectados ou -1 se o servidor não estiver configurado
   */
  getConnectedClientsCount(): number {
    if (!this.server) return -1;
    
    return this.server.sockets.sockets.size;
  }
} 