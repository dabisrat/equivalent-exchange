import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@eq-ex/shared': path.resolve(__dirname, '../../packages/shared'),
      '@eq-ex/auth': path.resolve(__dirname, '../../packages/auth'),
      '@app': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
})