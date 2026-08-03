/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          background: 'rgb(var(--color-app-background) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
        },
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          surface: 'rgb(var(--color-success-surface) / <alpha-value>)',
          border: 'rgb(var(--color-success-border) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          surface: 'rgb(var(--color-warning-surface) / <alpha-value>)',
          border: 'rgb(var(--color-warning-border) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          surface: 'rgb(var(--color-error-surface) / <alpha-value>)',
          border: 'rgb(var(--color-error-border) / <alpha-value>)',
        },
        information: {
          DEFAULT: 'rgb(var(--color-information) / <alpha-value>)',
          surface: 'rgb(var(--color-information-surface) / <alpha-value>)',
          border: 'rgb(var(--color-information-border) / <alpha-value>)',
        },
        profile: {
          husband: 'rgb(var(--color-profile-husband) / <alpha-value>)',
          'husband-surface': 'rgb(var(--color-profile-husband-surface) / <alpha-value>)',
          wife: 'rgb(var(--color-profile-wife) / <alpha-value>)',
          'wife-surface': 'rgb(var(--color-profile-wife-surface) / <alpha-value>)',
        },
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
      },
      borderRadius: {
        card: '0.875rem',
      },
    },
  },
  plugins: [],
}
