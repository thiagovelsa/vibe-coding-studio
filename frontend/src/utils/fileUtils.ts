import { 
  FiFile, 
  FiFileText, 
  FiCode, 
  FiImage, 
  FiMusic, 
  FiVideo, 
  FiPackage,
  FiGrid,
  FiDatabase,
  FiEdit3,
  FiSettings,
  FiBox,
  FiCoffee,
  FiBookmark,
  FiAward,
  FiGlobe,
  FiLayers
} from 'react-icons/fi';
import { IconType } from 'react-icons';

// Mapa de extensões para ícones
const fileIconMap: Record<string, IconType> = {
  // Documentos de texto
  'txt': FiFileText,
  'md': FiFileText,
  'rtf': FiFileText,
  'doc': FiFileText,
  'docx': FiFileText,
  'odt': FiFileText,
  'pdf': FiFileText,
  
  // Código-fonte
  'js': FiCode,
  'jsx': FiCode,
  'ts': FiCode,
  'tsx': FiCode,
  'html': FiCode,
  'htm': FiCode,
  'css': FiCode,
  'scss': FiCode,
  'less': FiCode,
  'java': FiCode,
  'py': FiCode,
  'c': FiCode,
  'cpp': FiCode,
  'h': FiCode,
  'cs': FiCode,
  'go': FiCode,
  'php': FiCode,
  'rb': FiCode,
  'rs': FiCode,
  'swift': FiCode,
  'kt': FiCode,
  'dart': FiCode,
  
  // Imagens
  'jpg': FiImage,
  'jpeg': FiImage,
  'png': FiImage,
  'gif': FiImage,
  'svg': FiImage,
  'ico': FiImage,
  'webp': FiImage,
  'bmp': FiImage,
  'tif': FiImage,
  'tiff': FiImage,
  
  // Áudio
  'mp3': FiMusic,
  'wav': FiMusic,
  'ogg': FiMusic,
  'flac': FiMusic,
  'm4a': FiMusic,
  'aac': FiMusic,
  
  // Vídeo
  'mp4': FiVideo,
  'webm': FiVideo,
  'avi': FiVideo,
  'mov': FiVideo,
  'wmv': FiVideo,
  'mkv': FiVideo,
  
  // Dados
  'json': FiDatabase,
  'xml': FiDatabase,
  'csv': FiDatabase,
  'xls': FiDatabase,
  'xlsx': FiDatabase,
  'sql': FiDatabase,
  'db': FiDatabase,
  'sqlite': FiDatabase,
  
  // Arquivos compactados
  'zip': FiPackage,
  'rar': FiPackage,
  '7z': FiPackage,
  'tar': FiPackage,
  'gz': FiPackage,
  
  // Configuração
  'env': FiSettings,
  'yml': FiSettings,
  'yaml': FiSettings,
  'toml': FiSettings,
  'ini': FiSettings,
  'conf': FiSettings,
  'config': FiSettings,
  
  // Pacotes e dependências
  'lock': FiBox,
  'package.json': FiBox,
  'composer.json': FiBox,
  'gemfile': FiBox,
  'cargo.toml': FiBox,
  'yarn.lock': FiBox,
  'package-lock.json': FiBox,
  
  // Linguagens específicas
  'jsx': FiCoffee,
  'tsx': FiCoffee,
  'vue': FiGrid,
  'svelte': FiAward,
  
  // Web
  'htaccess': FiGlobe,
  'wasm': FiGlobe,
  
  // Outros
  'gitignore': FiLayers,
  'dockerfile': FiLayers,
  'license': FiBookmark,
  'readme': FiBookmark,
};

/**
 * Obtém o componente de ícone baseado na extensão do arquivo
 * @param extension Extensão do arquivo (sem o ponto)
 * @returns Componente de ícone ou undefined se não encontrado
 */
export function getFileIconByExtension(extension: string): IconType | undefined {
  // Normalizar a extensão para comparação
  const normalizedExt = extension.toLowerCase().replace('.', '');
  
  // Verificar mapeamentos exatos
  if (normalizedExt in fileIconMap) {
    return fileIconMap[normalizedExt];
  }
  
  // Se não encontrar, retornar undefined e deixar o cliente decidir o fallback
  return undefined;
}

/**
 * Verifica se um arquivo é do tipo texto
 * @param extension Extensão do arquivo
 * @returns true se for um arquivo de texto
 */
export function isTextFile(extension: string): boolean {
  const textExtensions = [
    'txt', 'md', 'rtf', 'doc', 'docx', 'odt', 'pdf', 
    'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'less',
    'java', 'py', 'c', 'cpp', 'h', 'cs', 'go', 'php', 'rb', 'rs', 'swift', 'kt',
    'json', 'xml', 'csv', 'yml', 'yaml', 'toml', 'ini', 'conf', 'config',
    'gitignore', 'env', 'sql'
  ];
  
  return textExtensions.includes(extension.toLowerCase().replace('.', ''));
}

/**
 * Verifica se um arquivo é do tipo imagem
 * @param extension Extensão do arquivo
 * @returns true se for uma imagem
 */
export function isImageFile(extension: string): boolean {
  const imageExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp', 'bmp', 'tif', 'tiff'
  ];
  
  return imageExtensions.includes(extension.toLowerCase().replace('.', ''));
}

/**
 * Obtém a extensão de um nome de arquivo
 * @param filename Nome do arquivo
 * @returns Extensão do arquivo (sem o ponto)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Obtém o nome do arquivo sem a extensão
 * @param filename Nome do arquivo
 * @returns Nome sem extensão
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}

/**
 * Obtém o mime type baseado na extensão do arquivo
 * @param extension Extensão do arquivo
 * @returns Mime type do arquivo ou undefined se não reconhecido
 */
export function getMimeTypeFromExtension(extension: string): string | undefined {
  const mimeTypes: Record<string, string> = {
    // Texto
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'json': 'application/json',
    'xml': 'application/xml',
    'md': 'text/markdown',
    
    // Imagens
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Áudio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Vídeo
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    
    // Documentos
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Outros
    'zip': 'application/zip',
    'gz': 'application/gzip',
  };
  
  const normalizedExt = extension.toLowerCase().replace('.', '');
  return mimeTypes[normalizedExt];
} 