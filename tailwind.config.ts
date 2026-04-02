import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        e3: {
          bg: 'var(--e3-bg)',
          card: 'var(--e3-surface)',
          border: 'var(--e3-border)',
          separator: 'var(--e3-separator)',
          accent: 'var(--e3-accent)',
          text: 'var(--e3-text)',
          muted: 'var(--e3-secondary)',
          danger: 'var(--e3-danger)',
          warning: 'var(--e3-warning)',
          success: 'var(--e3-success)',
          nav: 'var(--e3-nav)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
