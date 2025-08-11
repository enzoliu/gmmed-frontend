import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  
  server: {
    port: 3001,
    host: true
  },

  build: {
    rollupOptions: {
      input: 'index-test.html'
    }
  },

  resolve: {
    alias: {
      '$lib': '/src/lib',
      '$components': '/src/components',
      '$stores': '/src/stores',
      '$utils': '/src/utils'
    }
  }
})
