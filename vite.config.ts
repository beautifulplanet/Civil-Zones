import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  
  // Development server settings
  server: {
    port: 3000,
    open: '/game.html',  // Open the new TypeScript game
    hmr: true
  },
  
  // Build settings
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',  // Use esbuild (built-in) instead of terser
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'game.html')
      },
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'game-core': [
            './src/types/index.ts',
            './src/config/index.ts',
            './src/core/index.ts'
          ],
          'game-systems': [
            './src/systems/index.ts',
            './src/buildings/index.ts',
            './src/entities/index.ts'
          ],
          'game-rendering': [
            './src/rendering/index.ts',
            './src/ui/index.ts'
          ],
          'game-ai': [
            './src/ai/index.ts'
          ]
        }
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: []
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/types'),
      '@config': resolve(__dirname, 'src/config'),
      '@core': resolve(__dirname, 'src/core'),
      '@systems': resolve(__dirname, 'src/systems'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@game': resolve(__dirname, 'src/game'),
      '@input': resolve(__dirname, 'src/input'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@buildings': resolve(__dirname, 'src/buildings'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@events': resolve(__dirname, 'src/events'),
      '@world': resolve(__dirname, 'src/world'),
      '@time': resolve(__dirname, 'src/time')
    }
  }
});
