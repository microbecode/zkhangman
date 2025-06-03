import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: { 
      target: "esnext",
      supported: {
        'top-level-await': true
      }
    },
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js']
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});