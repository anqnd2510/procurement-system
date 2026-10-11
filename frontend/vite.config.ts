import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:8081';
  const routes = [
    '/auth',
    '/health',
    '/products',
    '/categories',
    '/inventories',
    '/organizations',
    '/purchase-requests',
    '/purchase-orders',
    '/audit-logs',
    '/dashboard',
  ];

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: Object.fromEntries(
        routes.map((route) => [route, { target, changeOrigin: true }]),
      ),
    },
  };
});
