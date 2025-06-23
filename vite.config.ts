import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      '007a-2405-201-d002-83b-7d98-b31c-ac30-9787.ngrok-free.app'
    ]
  }
});
