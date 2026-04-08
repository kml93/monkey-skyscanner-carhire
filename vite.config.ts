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
      server: {
        mountGmApi: true,
      },
      userscript: {
        author: `Jacky Daniel's`,
        name: 'Skyscanner - Car Rental - Dashboard',
        icon: 'https://www.skyscanner.fr/favicon.ico',
        namespace: 'kml93/skyscanner-car_rental',
        include: [
          '*://*.skyscanner.*/carhire/results/*',
          // '*://*.skyscanner.tld/carhire/results/*',
        ],
        grant: ['GM_setValue', 'GM_getValue', 'GM_addValueChangeListener', 'GM_removeValueChangeListener', 'GM_addStyle'],
        'run-at': 'document-idle',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
