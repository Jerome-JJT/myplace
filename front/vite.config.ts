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
    // rollupOptions: {
    //   output: {
        // manualChunks(id) {
        //   if (id.includes('node_modules')) {
        //     if (id.includes('react-dom') || id.includes('react-icons') || id.includes('react-router-dom')) {
        //       return 'react';
        //     }
        //     if (id.includes('tailwindcss') || id.includes('tailwind-merge')) {
        //       return 'tailwind';
        //     }
        //     if (id.includes('@material-tailwind')) {
        //       return 'mattailwind';
        //     }
        //     if (id.includes('@weston/react-world-flags')) {
        //       return 'flags';
        //     }
        //   }
        // },
        // manualChunks: {
        //   react: ['react-dom', 'react-icons', 'react-router-dom'],
        //   tailwind: ['tailwindcss', 'tailwind-merge'],
        //   mattailwind: ['@material-tailwind/react'],
        //   flags: ['@weston/react-world-flags'],
        // } as any,
    //   },
    // },
  },
  plugins: [react(), tsconfigPaths()],
});
