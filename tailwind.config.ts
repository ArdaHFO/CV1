import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Swiss International Style Colors
      colors: {
        'swiss-white': '#FFFFFF',
        'swiss-black': '#000000',
        'swiss-muted': '#F2F2F2',
        'swiss-accent': '#FF3000', // Swiss Red
        'swiss-border': '#000000',
      },
      // Inter font family (Google Font)
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Bold typography scale (Swiss style: extreme contrast)
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.02em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.04em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.06em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.075em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.1em' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      // No rounded corners (Swiss style is strictly rectangular)
      borderRadius: {
        none: '0px',
      },
      // Swiss spacing scale
      spacing: {
        0: '0px',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },
      // Bold shadows (minimal use; mainly for focus states)
      boxShadow: {
        none: 'none',
        'swiss-focus': '0 0 0 2px #FFFFFF, 0 0 0 4px #FF3000',
        'swiss-ring': '0 0 0 4px rgba(255, 48, 0, 0.1)',
      },
      // Pattern backgrounds (via CSS)
      backgroundImage: {
        'swiss-grid': `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='24' height='24' fill='none'/%3E%3Crect x='0' y='0' width='1' height='24' fill='%23000000' opacity='0.03'/%3E%3Crect x='24' y='0' width='1' height='24' fill='%23000000' opacity='0.03'/%3E%3Crect x='0' y='0' width='24' height='1' fill='%23000000' opacity='0.03'/%3E%3Crect x='0' y='24' width='24' height='1' fill='%23000000' opacity='0.03'/%3E%3C/svg%3E")`,
        'swiss-dots': `radial-gradient(circle, #000000 1px, transparent 1px)`,
        'swiss-diagonal': `repeating-linear-gradient(45deg, transparent, transparent 10px, #000000 10px, #000000 11px)`,
      },
      backgroundSize: {
        'swiss-grid': '24px 24px',
        'swiss-dots': '16px 16px',
        'swiss-diagonal': '14.14px 14.14px',
      },
      backgroundPosition: {
        'swiss-dots': '0 0',
      },
      // Border width
      borderWidth: {
        0: '0px',
        1: '1px',
        2: '2px',
        4: '4px',
      },
      // Transitions
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'linear': 'linear',
      },
    },
  },
  plugins: [],
};

export default config;
