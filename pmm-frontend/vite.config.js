import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  chunkSizeWarningLimit: 1000, // Aumentamos el límite de advertencia a 1000KB para evitar warnings por chunks grandes
})
