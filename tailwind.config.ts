import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        alabaster: '#FDFCFB', /* Slightly warmer and cleaner */
        charcoal: '#1A1817', 
        muted: '#8A8581',
        sage: '#A5B59E',
        terra: '#E38A70',
        sand: '#F7F4EB',
        surface: 'rgba(255, 255, 255, 0.4)',
        'surface-strong': 'rgba(255, 255, 255, 0.85)',
        border: 'rgba(26, 24, 23, 0.05)'
      },
      fontFamily: {
        serif: ['var(--font-newsreader)', 'serif'],
        sans: ['var(--font-manrope)', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(26, 24, 23, 0.03)',
        'glass-hover': '0 12px 48px 0 rgba(26, 24, 23, 0.06)',
        float: '0 24px 60px -12px rgba(26, 24, 23, 0.08)',
        'float-sm': '0 12px 24px -6px rgba(26, 24, 23, 0.05)',
        glow: '0 0 20px 0 rgba(165, 181, 158, 0.4)'
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' }
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(15px)' }
        },
        'cursor-dance': {
          '0%': { transform: 'translate(0, 0)' },
          '20%': { transform: 'translate(40px, -20px)' },
          '40%': { transform: 'translate(80px, 10px)' },
          '60%': { transform: 'translate(30px, 30px)' },
          '80%': { transform: 'translate(-20px, 10px)' },
          '100%': { transform: 'translate(0, 0)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 1.2s ease-out forwards',
        'scale-in': 'scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float-reverse 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'cursor-dance': 'cursor-dance 12s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite'
      }
    }
  },
  plugins: []
};

export default config;
