// Tailwind CSS v3 Configuration with Nandhini Deluxe Brand Palette & Enterprise Typography
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F5B55',        // Deep Teal
          'primary-dark': '#08463F',   // Darker Deep Teal
          accent: '#C59A45',          // Warm Gold Accent
          background: '#F8F5EE',      // Warm Ivory / Off-White
          surface: '#FFFFFF',         // White Surface Cards/Tables
          'surface-secondary': '#F3F0E9', // Warm Secondary Surface
          text: '#202522',            // Dark Charcoal Text Primary
          'text-secondary': '#66706B',// Muted Gray Text Secondary
          border: '#E5E2DB',          // Muted Border Neutral
          success: '#23865B',         // Deep Emerald Success
          warning: '#C68A28',         // Amber Gold Warning
          danger: '#C94B45',          // Crimson Danger
          info: '#3377A8',            // Corporate Blue Info
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        'brand': '8px',
        'card': '10px',
      },
      boxShadow: {
        'brand-xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'brand-card': '0 2px 4px rgba(15, 91, 85, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
};
