import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// Import visualizer if you want to avoid require
// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [react()];
  
  if (env.ANALYZE_BUNDLE === 'true') {
    // Using require here to avoid making rollup-plugin-visualizer a direct dependency
    // if it's only used conditionally for analysis.
    // If it's frequently used, import it at the top.
    const visualizerPlugin = require('rollup-plugin-visualizer').visualizer;
    plugins.push(
      visualizerPlugin({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      })
    );
  }

  return defineConfig({
    plugins: plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@lib': path.resolve(__dirname, './src/lib'), // Ensure @lib alias is present
      },
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
        '/ws': {
          target: 'ws://localhost:3000',
          ws: true,
          changeOrigin: true,
        },
      },
      cors: true,
      watch: {
        usePolling: false, // Desativa polling para melhorar performance do HMR
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true, 
      emptyOutDir: true,
      target: 'es2020', // Melhor compatibilidade com browsers modernos
      cssCodeSplit: true, // Separa CSS em múltiplos arquivos
      minify: 'terser', // Usar terser para melhor minificação
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs em produção
        },
      },
      chunkSizeWarningLimit: 1000, // Aumenta o limite de aviso de tamanho de chunk
      rollupOptions: {
        // external: [ '@fontsource/inter/variable.css', '@fontsource/jetbrains-mono' ], // Decision on this is deferred
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) { return 'react'; }
            if (id.includes('node_modules/@monaco-editor/')) { return 'monaco-editor'; }
            if (id.includes('node_modules/reactflow/')) { return 'reactflow'; }
            if (id.includes('node_modules/framer-motion/')) { return 'framer'; }
            if (id.includes('node_modules/react-markdown/') || id.includes('node_modules/remark-gfm/') || id.includes('node_modules/remark-math/') || id.includes('node_modules/rehype-katex/')) {
              return 'markdown';
            }
            if (id.includes('node_modules/react-icons/')) { return 'react-icons'; }
            if (id.includes('node_modules/@headlessui/react/')) { return 'headless'; }
            if (id.includes('node_modules/react-syntax-highlighter/')) { return 'syntax-highlighter'; }
            if (id.includes('node_modules/react-window/') || id.includes('node_modules/react-virtuoso/')) {
              return 'virtualization';
            }
            // Catch-all for other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      reportCompressedSize: false, // Melhora velocidade de build desabilitando cálculo de tamanho comprimido
    },
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        '@monaco-editor/react',
        'framer-motion',
        'react-markdown',
      ],
      exclude: [], // Pacotes que não devem ser pré-empacotados
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
  });
}; 