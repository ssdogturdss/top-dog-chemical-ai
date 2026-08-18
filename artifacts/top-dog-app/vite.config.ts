import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT: default to 3000 outside Replit so local dev works without env setup
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// BASE_PATH: default to "/" so the app works at root outside Replit.
// In Replit the platform injects e.g. "/top-dog-app".
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig(async () => {
  // Replit dev plugins — loaded only when inside a Replit workspace.
  // Wrapped in try/catch so builds outside Replit succeed even if the
  // packages are not installed.
  const replitPlugins: import('vite').Plugin[] = [];
  if (process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined) {
    try {
      const { default: runtimeErrorOverlay } = await import(
        '@replit/vite-plugin-runtime-error-modal' as string
      );
      replitPlugins.push(runtimeErrorOverlay());
    } catch { /* not installed outside Replit */ }
    try {
      const { cartographer } = await import('@replit/vite-plugin-cartographer' as string);
      replitPlugins.push(
        cartographer({ root: path.resolve(import.meta.dirname, '..') }),
      );
    } catch { /* not installed outside Replit */ }
    try {
      const { devBanner } = await import('@replit/vite-plugin-dev-banner' as string);
      replitPlugins.push(devBanner());
    } catch { /* not installed outside Replit */ }
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss(), ...replitPlugins],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: { strict: true },
      proxy: {
        // In local dev, proxy /api to the backend (default port 8080)
        '/api': {
          target: process.env.API_URL ?? 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
