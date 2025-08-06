/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Maverick color system (inspired by Goose's Arcade colors)
        'background-primary': 'var(--bg-primary)',
        'background-secondary': 'var(--bg-secondary)',
        'background-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        'border-subtle': 'var(--border-subtle)',
        'border-standard': 'var(--border-standard)',
        'border-prominent': 'var(--border-prominent)',
        'accent-primary': 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
      },
      fontFamily: {
        sans: ['"Cash Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'thinking-bounce': 'thinking-bounce 1.4s infinite ease-in-out both',
      },
      keyframes: {
        'thinking-bounce': {
          '0%, 80%, 100%': {
            transform: 'scale(0.6)',
            opacity: '0.5',
          },
          '40%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};