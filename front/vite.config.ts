import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react-dom', 'react-icons', 'react-router-dom'],
          tailwind: ['tailwindcss', 'tailwind-merge'],
          mattailwind: ['@material-tailwind/react'],
        },
      },
    },
  },
  plugins: [react(), tsconfigPaths()],
});
