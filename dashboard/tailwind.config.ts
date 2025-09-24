import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'safeprompt-green': '#00FF41',
        'safeprompt-blue': '#3B82F6',
        'safeprompt-dark': '#0A0A0A',
        // Match website colors
        primary: '#3B82F6',
        secondary: '#27272A',
        muted: '#A1A1AA',
        safe: '#10B981',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}
export default config