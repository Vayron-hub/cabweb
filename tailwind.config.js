/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: false, // Deshabilita completamente el modo oscuro
  theme: {
    extend: {
      colors: {
        // Paleta de colores del proyecto CAB - Sustentabilidad y Ecología
        primary: {
          50: '#f4f6f4',
          100: '#e6ebe7',
          200: '#cdd6cf',
          300: '#a8b8ab',
          400: '#7a9580',
          500: '#4c6b4f', // Verde primario - Color principal del sistema
          600: '#3d4d40', // Verde oscuro - Para hover y énfasis
          700: '#353e37',
          800: '#2d332e',
          900: '#262b27',
        },
        secondary: {
          50: '#f9f8f7',
          100: '#f2f0ed',
          200: '#e8e4df',
          300: '#d9d2ca',
          400: '#c6baae',
          500: '#b6a89a', // Beige - Para fondos neutros y elementos suaves
          600: '#a8967e',
          700: '#8a7865',
          800: '#706256',
          900: '#5c5049',
        },
        accent: {
          50: '#f6f7f6',
          100: '#e9ecea',
          200: '#d5d9d6',
          300: '#b8c0ba',
          400: '#94a097',
          500: '#5e7958', // Verde claro - Para elementos secundarios
          600: '#4e6348',
          700: '#414f3c',
          800: '#364032',
          900: '#2d342a',
        },
        neutral: {
          50: '#f8f7f7',
          100: '#efeeee',
          200: '#dddcdc',
          300: '#c4c2c2',
          400: '#a5a2a2',
          500: '#8b8787',
          600: '#6f6a6a',
          700: '#565151',
          800: '#3c2f2f', // Café - Para textos y elementos de contraste
          900: '#2a1f1f',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Colores específicos para tipos de residuos (manteniendo los originales)
        residue: {
          valorizable: '#2196F3',
          organico: '#4CAF50',
          noValorizable: '#757575',
        },
        // Nuevos colores temáticos para el proyecto sustentable
        earth: {
          green: '#4c6b4f',      // Verde primario
          darkGreen: '#3d4d40',  // Verde oscuro
          lightGreen: '#5e7958', // Verde claro
          beige: '#b6a89a',      // Beige
          brown: '#3c2f2f',      // Café
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'feature': '0 4px 20px rgba(74, 124, 89, 0.15)',
        'card': '0 4px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'button': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'button-hover': '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
        'pulse-custom': 'pulseCustom 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseCustom: {
          '0%': { boxShadow: '0 8px 32px rgba(74, 124, 89, 0.3)' },
          '50%': { boxShadow: '0 8px 32px rgba(74, 124, 89, 0.5)' },
          '100%': { boxShadow: '0 8px 32px rgba(74, 124, 89, 0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // Plugin personalizado para utilidades adicionales
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-gradient-primary': {
          background: 'linear-gradient(135deg, #4a7c59, #5a8a6b)',
        },
        '.bg-gradient-success': {
          background: 'linear-gradient(135deg, #10b981, #059669)',
        },
        '.bg-pattern': {
          'background-image': 'radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.15) 1px, transparent 0)',
          'background-size': '20px 20px',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
