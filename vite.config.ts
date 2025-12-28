import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This replaces 'process.env.API_KEY' in your code with the actual value from Render's environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Provide a safe empty object for any other process.env calls to prevent crashes
    'process.env': '({})'
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