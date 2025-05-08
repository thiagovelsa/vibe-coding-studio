import { AgentTask, TaskPriority } from '../interfaces/workflow.interface';

/**
 * Implementa uma fila de tarefas com prioridade.
 * Tarefas com maior prioridade são processadas primeiro.
 */
export class PriorityTaskQueue {
  private tasks: AgentTask[] = [];

  /**
   * Adiciona uma tarefa à fila
   * @param task Tarefa a ser adicionada
   */
  enqueue(task: AgentTask): void {
    this.tasks.push(task);
    this.sort();
  }

  /**
   * Remove e retorna a próxima tarefa da fila
   * @returns A próxima tarefa ou undefined se a fila estiver vazia
   */
  dequeue(): AgentTask | undefined {
    return this.tasks.shift();
  }

  /**
   * Verifica se a fila está vazia
   * @returns True se a fila estiver vazia, false caso contrário
   */
  isEmpty(): boolean {
    return this.tasks.length === 0;
  }

  /**
   * Retorna o número de tarefas na fila
   * @returns Número de tarefas
   */
  size(): number {
    return this.tasks.length;
  }

  /**
   * Ordena a fila por prioridade (maior para menor)
   */
  private sort(): void {
    this.tasks.sort((a, b) => {
      // Primeiro por prioridade (maior → menor)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Depois por data de criação (mais antigo → mais recente)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Remove todas as tarefas de um workflow específico
   * @param workflowId ID do workflow
   * @returns Número de tarefas removidas
   */
  removeByWorkflowId(workflowId: string): number {
    const initialSize = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.workflowId !== workflowId);
    return initialSize - this.tasks.length;
  }

  /**
   * Atualiza a prioridade de uma tarefa
   * @param taskId ID da tarefa
   * @param priority Nova prioridade
   * @returns True se a tarefa foi encontrada e atualizada, false caso contrário
   */
  updatePriority(taskId: string, priority: TaskPriority): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      return false;
    }
    
    task.priority = priority;
    this.sort();
    return true;
  }

  /**
   * Obtém todas as tarefas na fila
   * @returns Array com todas as tarefas
   */
  getAllTasks(): AgentTask[] {
    return [...this.tasks];
  }

  /**
   * Limpa a fila
   */
  clear(): void {
    this.tasks = [];
  }

  /**
   * Remove uma tarefa específica da fila, se existir
   * @param taskId ID da tarefa a ser removida
   * @returns Verdadeiro se a tarefa foi removida, falso caso contrário
   */
  remove(taskId: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    return this.tasks.length < initialLength;
  }
} 