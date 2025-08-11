import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv, defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    optimizeDeps: {
      exclude: ['.vite', '.vite/deps']
    },
    plugins: [
      sveltekit()
    ],
    preview: {
      port: 5173
    },
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.test.ts']
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  };
});
