import { VitePWA } from 'vite-plugin-pwa';

export default {
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
  plugins: [
    VitePWA({ manifest: false }),
  ],
};
