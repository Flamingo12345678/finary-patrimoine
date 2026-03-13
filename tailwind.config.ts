import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        panel: '#111827',
        accent: '#0f766e',
        accentSoft: '#ccfbf1'
      },
      boxShadow: {
        card: '0 10px 35px rgba(15, 23, 42, 0.08)'
      }
    },
  },
  plugins: [],
};

export default config;
