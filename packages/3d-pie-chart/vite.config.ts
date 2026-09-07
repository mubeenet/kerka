import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@graph-web-component/chart': new URL('../chart/src/index.ts', import.meta.url).pathname,
    },
  },
  build: {
    emptyOutDir: false,
    outDir: new URL('./dist', import.meta.url).pathname,
    lib: {
      entry: new URL('./src/register.ts', import.meta.url).pathname,
      formats: ['iife'],
      name: 'GraphThreeDPieChart',
    },
    rollupOptions: {
      external: ['chart.js'],
      output: {
        entryFileNames: 'register.global.js',
        globals: {
          'chart.js': 'Chart',
        },
      },
    },
  },
});
