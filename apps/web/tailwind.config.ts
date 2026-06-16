import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary violet scale
        primary: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        // Accent amber scale
        accent: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        // Semantic surface tokens — map to CSS variables
        surface: {
          DEFAULT:  'var(--surface)',
          raised:   'var(--surface-raised)',
          overlay:  'var(--surface-overlay)',
          sunken:   'var(--surface-sunken)',
        },
        // Border tokens
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        // Text tokens
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverted:  'var(--text-inverted)',
        },
        // Brand tokens (single values — not scales)
        brand: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-hover)',
          light:   'var(--primary-light)',
        },
        // Status tokens
        success: {
          DEFAULT: 'var(--success)',
          light:   'var(--success-light)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light:   'var(--warning-light)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light:   'var(--danger-light)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light:   'var(--info-light)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      spacing: {
        '100': '25rem',
        '105': '26.25rem',
        '110': '27.5rem',
        '120': '30rem',
        '125': '31.25rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        '105': '26.25rem',
        '110': '27.5rem',
      },
    },
  },
  plugins: [],
};

export default config;