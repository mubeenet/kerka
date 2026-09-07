import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: '../../packages/3d-pie-chart/dist',
  resolve: {
    alias: {
      '@graph-web-component/chart': new URL(
        '../../packages/chart/src/index.ts',
        import.meta.url,
      ).pathname,
      '@graph-web-component/3d-pie-chart': new URL(
        '../../packages/3d-pie-chart/src/index.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
