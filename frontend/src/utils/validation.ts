import { AgentType } from '../context/AgentContext';
import { FileNode, OpenFile } from '../context/WorkspaceContext';

/**
 * Tipo de validação genérico para qualquer objeto
 */
export type Validator<T> = (value: unknown) => value is T;

/**
 * Verifica se um valor é uma string não vazia
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Verifica se um valor é um objeto
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Verifica se um valor é do tipo AgentType
 */
export const isAgentType = (value: unknown): value is AgentType => {
  const validTypes: AgentType[] = ['product', 'coder', 'test', 'security'];
  return typeof value === 'string' && validTypes.includes(value as AgentType);
};

/**
 * Verifica se um valor tem o formato de um FileNode
 */
export const isFileNode = (value: unknown): value is FileNode => {
  if (!isObject(value)) return false;
  
  const requiredProps = ['id', 'name', 'path', 'type', 'parent'];
  const missingProps = requiredProps.filter(prop => !(prop in value));
  if (missingProps.length > 0) return false;
  
  // Verifica tipo de arquivo
  if (value.type !== 'file' && value.type !== 'directory') return false;
  
  // Verifica outras propriedades
  if (typeof value.id !== 'string' || 
      typeof value.name !== 'string' || 
      typeof value.path !== 'string' || 
      (value.parent !== null && typeof value.parent !== 'string')) {
    return false;
  }
  
  return true;
};

/**
 * Verifica se um valor tem o formato de um OpenFile
 */
export const isOpenFile = (value: unknown): value is OpenFile => {
  if (!isObject(value)) return false;
  
  const requiredProps = ['id', 'fileId', 'content', 'path', 'name', 'isDirty', 'language', 'lastModified'];
  const missingProps = requiredProps.filter(prop => !(prop in value));
  if (missingProps.length > 0) return false;
  
  // Verifica tipos das propriedades
  if (typeof value.id !== 'string' || 
      typeof value.fileId !== 'string' || 
      typeof value.content !== 'string' || 
      typeof value.path !== 'string' || 
      typeof value.name !== 'string' || 
      typeof value.isDirty !== 'boolean' || 
      typeof value.language !== 'string' || 
      typeof value.lastModified !== 'string') {
    return false;
  }
  
  return true;
};

/**
 * Verifica se um objeto tem um formato específico usando um validador
 * @param obj Objeto a ser validado
 * @param validator Função de validação
 * @returns Objeto tipado se for válido, undefined se não for
 */
export function validate<T>(obj: unknown, validator: Validator<T>): T | undefined {
  if (validator(obj)) {
    return obj;
  }
  return undefined;
}

/**
 * Sanitiza um objeto removendo campos vazios, nulos ou indefinidos
 * @param obj Objeto a ser sanitizado
 * @returns Objeto sem campos vazios
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      // Recursivamente sanitiza objetos aninhados
      if (isObject(value)) {
        result[key as keyof T] = sanitizeObject(value) as any;
      } else {
        result[key as keyof T] = value;
      }
    }
  }
  
  return result;
}

/**
 * Sanitiza uma string, removendo caracteres perigosos
 * @param input String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove tags HTML e scripts
  const withoutTags = input.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Escapa caracteres especiais
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 