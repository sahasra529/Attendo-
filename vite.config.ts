import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This config ensures that environment variables are injected into the client bundle at build time.
export default defineConfig({
  plugins: [react()],
  define: {
    // Replaces 'process.env.API_KEY' with the actual value found in the environment during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Replaces 'process.env' with an empty object to prevent runtime ReferenceErrors
    'process.env': JSON.stringify({}),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000
  }
});