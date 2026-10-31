import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('node_modules/phaser') ? 'phaser' : undefined,
      },
    },
  },
});
