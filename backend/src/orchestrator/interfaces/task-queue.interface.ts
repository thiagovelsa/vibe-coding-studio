import { AgentTask } from './agent-task.interface';

/**
 * Interface para uma fila de tarefas de agentes
 */
export interface TaskQueue {
  /**
   * Adiciona uma nova tarefa à fila
   * @param task Tarefa a ser adicionada à fila
   */
  enqueue(task: AgentTask): void;
  
  /**
   * Remove e retorna a próxima tarefa da fila
   * @returns A próxima tarefa ou undefined se a fila estiver vazia
   */
  dequeue(): AgentTask | undefined;
  
  /**
   * Retorna a próxima tarefa sem removê-la da fila
   * @returns A próxima tarefa ou undefined se a fila estiver vazia
   */
  peek(): AgentTask | undefined;
  
  /**
   * Retorna todas as tarefas na fila
   * @returns Array de tarefas
   */
  getAll(): AgentTask[];
  
  /**
   * Retorna o número de tarefas na fila
   * @returns Tamanho da fila
   */
  size(): number;
  
  /**
   * Verifica se a fila está vazia
   * @returns true se a fila estiver vazia, false caso contrário
   */
  isEmpty(): boolean;
  
  /**
   * Remove uma tarefa específica da fila
   * @param taskId ID da tarefa a ser removida
   * @returns true se a tarefa foi removida, false se não foi encontrada
   */
  remove(taskId: string): boolean;
} 