/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        polaris: {
          cream: '#FAF9F5',
          surface: '#FFFFFF',
          sand: '#F5F2EB',
          border: 'rgba(28, 25, 23, 0.08)',
          charcoal: '#1C1917',
          stone: '#57534E',
          muted: '#8A857D',
          gold: {
            DEFAULT: '#B48A28', // Rich burnished gold (high legibility on light theme)
            bright: '#D4AF37',  // Logo metallic gold
            light: '#F8F3E4',   // Champagne cream wash
            muted: '#8A661C',   // Deep bronze gold
            border: 'rgba(180, 138, 40, 0.25)',
          },
          glacial: '#F0F6F9',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        modern: ['"Syne"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
        luxury: '0.4em',
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
