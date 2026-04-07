import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        author: `Jacky Daniel's`,
        name: 'Skyscanner - Car Rental - Dashboard',
        icon: '[https://vitejs.dev/logo.svg](https://vitejs.dev/logo.svg)',
        namespace: 'kml93/skyscanner-car_rental',
        include: ['*://*skyscanner.tld/carhire/results/*'],
        // grant: [],
        // 'run-at': 'document-idle',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
