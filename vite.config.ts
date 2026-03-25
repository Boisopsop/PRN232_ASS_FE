/**
 * Cấu hình Vite cho ứng dụng CapReview (React + TypeScript),
 * bao gồm plugin React và alias import tuyệt đối `@/`.
 */
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

