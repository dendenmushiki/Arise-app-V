/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0b0d1c',
        'dark-panel': '#0d0e26',
        'violet-border': '#7c3aed',
        'violet-accent': '#9f7aea',
        'violet-hover': '#b794f4',
        'text-light': '#e0e0e0',
        'text-muted': '#a0a0a0',

        // Solo Leveling theme colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        'level-gold': 'hsl(var(--level-gold))',
        'stat-green': 'hsl(var(--stat-green))',
        'stat-red': 'hsl(var(--stat-red))',
        'stat-blue': 'hsl(var(--stat-blue))',
        'glow-purple': 'hsl(var(--glow-purple))',
        'glow-cyan': 'hsl(var(--glow-cyan))',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['Newt', 'serif'],
        heading: ['Newt', 'serif'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.5)',
        button: '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        card: '1rem',
        button: '0.75rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px hsl(262 83% 58% / 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 20px hsl(262 83% 58% / 0.8))' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
