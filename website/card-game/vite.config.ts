import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], base: './', server: { proxy: { '/games': 'http://127.0.0.1:51399', '/socket.io': { target: 'http://127.0.0.1:51399', ws: true } } } });
