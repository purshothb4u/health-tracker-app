/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          background: 'rgb(var(--color-app-background) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'border-muted': 'rgb(var(--color-border-muted) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          pressed: 'rgb(var(--color-primary-pressed) / <alpha-value>)',
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
          hover: 'rgb(var(--color-error-hover) / <alpha-value>)',
          pressed: 'rgb(var(--color-error-pressed) / <alpha-value>)',
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
          'husband-accent': 'rgb(var(--color-profile-husband-accent) / <alpha-value>)',
          'husband-surface': 'rgb(var(--color-profile-husband-surface) / <alpha-value>)',
          wife: 'rgb(var(--color-profile-wife) / <alpha-value>)',
          'wife-accent': 'rgb(var(--color-profile-wife-accent) / <alpha-value>)',
          'wife-surface': 'rgb(var(--color-profile-wife-surface) / <alpha-value>)',
          shared: 'rgb(var(--color-profile-shared) / <alpha-value>)',
          'shared-surface': 'rgb(var(--color-profile-shared-surface) / <alpha-value>)',
        },
        metric: {
          nutrition: 'rgb(var(--color-metric-nutrition) / <alpha-value>)',
          'nutrition-surface': 'rgb(var(--color-metric-nutrition-surface) / <alpha-value>)',
          hydration: 'rgb(var(--color-metric-hydration) / <alpha-value>)',
          'hydration-surface': 'rgb(var(--color-metric-hydration-surface) / <alpha-value>)',
          activity: 'rgb(var(--color-metric-activity) / <alpha-value>)',
          'activity-surface': 'rgb(var(--color-metric-activity-surface) / <alpha-value>)',
          sleep: 'rgb(var(--color-metric-sleep) / <alpha-value>)',
          'sleep-surface': 'rgb(var(--color-metric-sleep-surface) / <alpha-value>)',
        },
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
      },
      fontSize: {
        'page-title': [
          'clamp(1.875rem, 1.75rem + 0.55vw, 2.25rem)',
          { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' },
        ],
        'section-title': [
          'clamp(1.25rem, 1.17rem + 0.35vw, 1.5rem)',
          { lineHeight: '1.3', letterSpacing: '-0.012em', fontWeight: '650' },
        ],
        'metric-value': [
          'clamp(1.75rem, 1.58rem + 0.72vw, 2.25rem)',
          { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' },
        ],
        'card-title': ['1rem', { lineHeight: '1.45', fontWeight: '650' }],
        supporting: ['0.9375rem', { lineHeight: '1.6' }],
        label: ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }],
        metadata: ['0.8125rem', { lineHeight: '1.45' }],
      },
      spacing: {
        'rhythm-sm': 'var(--space-rhythm-sm)',
        rhythm: 'var(--space-rhythm)',
        'rhythm-lg': 'var(--space-rhythm-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
    },
  },
  plugins: [],
}
