import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api -> backend on :3000, so the frontend can call
// /api/v1/* with no CORS fuss and no hardcoded host.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind 0.0.0.0 so other devices on the LAN can reach it
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
