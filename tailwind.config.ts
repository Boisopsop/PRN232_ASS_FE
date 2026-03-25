/**
 * Cấu hình Tailwind CSS cho CapReview.
 * Mở rộng theme theo hệ màu và font của hệ thống thiết kế.
 */
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F1B3D',
        primary: '#4F46E5',
        background: '#F5F7FF',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

