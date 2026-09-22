import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0F172A',
          900: '#172033',
          700: '#334155',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgb(15 23 42 / 6%)',
      },
    },
  },
  plugins: [],
};

export default config;
