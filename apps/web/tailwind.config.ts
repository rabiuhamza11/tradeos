import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tradeos: {
          dark: '#0A0E17',
          panel: '#111726',
          accent: '#00D9A3',
          glow: '#00FFB9',
          danger: '#FF4757',
          warn: '#FFA502',
          info: '#3B82F6',
          purple: '#7C3AED',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
