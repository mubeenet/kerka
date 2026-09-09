import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@graph-web-component/chart': new URL('../chart/src/index.ts', import.meta.url).pathname,
    },
  },
  build: {
    emptyOutDir: true,
    minify: 'oxc',
    outDir: new URL('../../dist', import.meta.url).pathname,
    lib: {
      entry: new URL('./src/register.ts', import.meta.url).pathname,
      fileName: (format) => (format === 'umd' ? 'kerka.umd.min.js' : 'kerka.min.js'),
      formats: ['es', 'umd'],
      name: 'Kerka',
    },
    rollupOptions: {
      external: ['chart.js'],
      output: {
        globals: {
          'chart.js': 'Chart',
        },
      },
    },
  },
});
