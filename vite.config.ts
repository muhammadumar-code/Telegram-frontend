import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const hmrPort = Number(process.env.VITE_HMR_PORT || 24678);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: {
        port: hmrPort,
        host: 'localhost',
      },
      watch: null,
    },
  };
});
