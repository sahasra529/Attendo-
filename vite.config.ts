
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This replaces 'process.env.API_KEY' in your code with the actual value from Render's environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    port: 3000
  }
});
