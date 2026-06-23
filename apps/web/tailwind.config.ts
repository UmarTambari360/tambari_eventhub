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
        // Primary - Warm Emerald (replaces violet)
        primary: {
          50:  '#F0F9F6',
          100: '#D1F0E8',
          200: '#A3E0D3',
          300: '#6BC8B8',
          400: '#3AA38F',
          500: '#0F766E',
          600: '#0F5F5A',
          700: '#0C4A46',
          800: '#093632',
          900: '#062421',
          950: '#031211',
        },
        // Accent - Warm Gold (replaces bright amber)
        accent: {
          50:  '#FFF9EB',
          100: '#FFF0C7',
          200: '#FFDF8A',
          300: '#FFC74D',
          400: '#F5A623',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        // Semantic surface tokens — map to CSS variables (unchanged structure)
        surface: {
          DEFAULT:  'var(--surface)',
          raised:   'var(--surface-raised)',
          overlay:  'var(--surface-overlay)',
          sunken:   'var(--surface-sunken)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverted:  'var(--text-inverted)',
        },
        brand: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-hover)',
          light:   'var(--primary-light)',
        },
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