import type { Config } from 'tailwindcss';

/**
 * Design tokens HYDRION — « L'eau sous contrôle ».
 * Règle de conversion : le cuivre (copper) est RÉSERVÉ aux actions d'appel / devis / urgence.
 */
export default {
  content: ['./index.html', './mentions-legales.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        night: '#050B18', // fond principal
        abyss: '#0B1628', // fond secondaire, cartes
        water: '#00E5FF', // eau / accent froid
        azure: '#3D7BFF', // eau secondaire
        copper: { DEFAULT: '#FF7A1A', light: '#FFB25B' }, // CTA uniquement
        ink: '#F2F6FF', // texte principal
        mist: '#8A9BB8', // texte secondaire
        success: '#2EE59D',
        line: 'rgba(0, 229, 255, 0.15)', // bordures verre
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      backgroundImage: {
        'copper-grad': 'linear-gradient(135deg, #FF7A1A 0%, #FFB25B 100%)',
        'water-grad': 'linear-gradient(135deg, #00E5FF 0%, #3D7BFF 100%)',
      },
      boxShadow: {
        copper: '0 8px 32px -8px rgba(255, 122, 26, 0.55)',
        water: '0 0 24px -4px rgba(0, 229, 255, 0.45)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-power3': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        // vibration du téléphone : courte, puis repos ~4 s
        ring: {
          '0%, 88%, 100%': { transform: 'rotate(0deg)' },
          '90%': { transform: 'rotate(-14deg)' },
          '92%': { transform: 'rotate(12deg)' },
          '94%': { transform: 'rotate(-10deg)' },
          '96%': { transform: 'rotate(8deg)' },
          '98%': { transform: 'rotate(-4deg)' },
        },
      },
      animation: {
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        ring: 'ring 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
