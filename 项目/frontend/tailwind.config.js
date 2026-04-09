/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // UI方案D: 深灰 + 蓝绿配色
        primary: {
          DEFAULT: '#0f9b8e', // 蓝绿色
          50: '#e6f7f5',
          100: '#ccefeb',
          200: '#99dfd7',
          300: '#66cfc3',
          400: '#33bfaf',
          500: '#0f9b8e',
          600: '#0d7c72',
          700: '#0a5d56',
          800: '#083e3a',
          900: '#051f1d',
        },
        dark: {
          DEFAULT: '#1a1a2e', // 深灰/深蓝
          50: '#4a4a5e',
          100: '#3f3f52',
          200: '#343446',
          300: '#29293a',
          400: '#1f1f2e',
          500: '#1a1a2e',
          600: '#151528',
          700: '#101022',
          800: '#0a0a1c',
          900: '#050516',
        },
        accent: '#0f9b8e',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dark-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #0f9b8e 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(15, 155, 142, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(15, 155, 142, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
