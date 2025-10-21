/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors (Vercel-inspired)
        background: '#0A0A0A',
        foreground: '#FAFAFA',
        card: '#18181B',
        'card-foreground': '#FAFAFA',
        popover: '#18181B',
        'popover-foreground': '#FAFAFA',
        primary: '#3B82F6',
        'primary-foreground': '#FAFAFA',
        secondary: '#27272A',
        'secondary-foreground': '#FAFAFA',
        muted: '#27272A',
        'muted-foreground': '#A1A1AA',
        accent: '#3B82F6',
        'accent-foreground': '#FAFAFA',
        destructive: '#EF4444',
        'destructive-foreground': '#FAFAFA',
        border: '#27272A',
        input: '#27272A',
        ring: '#3B82F6',

        // Custom colors for demos
        safe: '#10B981',
        danger: '#EF4444',
        processing: '#3B82F6',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'typing': 'typing 2s steps(20) infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'attack-theater': 'attack-theater 15s linear infinite',
      },
      keyframes: {
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '.5',
            transform: 'scale(1.05)',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'attack-theater': {
          '0%, 20%': { transform: 'translateY(0)' },
          '25%, 45%': { transform: 'translateY(-100%)' },
          '50%, 70%': { transform: 'translateY(-200%)' },
          '75%, 95%': { transform: 'translateY(-300%)' },
          '100%': { transform: 'translateY(-400%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid': 'url("data:image/svg+xml,%3csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cg fill=\'none\' fill-rule=\'evenodd\'%3e%3cg fill=\'%2327272a\' fill-opacity=\'0.2\'%3e%3cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")',
      },
    },
  },
  plugins: [],
}