import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        e3: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#3b82f6',
          text: '#f1f5f9',
          muted: '#94a3b8',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
