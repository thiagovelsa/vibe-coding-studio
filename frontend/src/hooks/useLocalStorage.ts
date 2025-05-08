import { useState, useEffect } from 'react';

/**
 * Hook para persistir estado no localStorage
 * @param key Chave do localStorage
 * @param initialValue Valor inicial
 * @returns Estado e função para atualizá-lo
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Obtém o valor do localStorage pela chave
      const item = window.localStorage.getItem(key);
      // Parseia o JSON armazenado ou retorna o valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao recuperar valor do localStorage [${key}]:`, error);
      return initialValue;
    }
  });
  
  // Função para atualizar o valor no localStorage e no estado
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite usar função ou valor para atualizar
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva o estado
      setStoredValue(valueToStore);
      
      // Salva no localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Erro ao armazenar valor no localStorage [${key}]:`, error);
    }
  };
  
  // Efeito para atualizar o localStorage quando a chave muda
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      // Se não houver valor no localStorage para a nova chave, salve o valor atual
      if (!item) {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
} 