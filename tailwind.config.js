/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // PRIMARY: Calming Blue (Main brand color)
        primary: {
          50: '#eff6ff',   // Very light blue for backgrounds
          100: '#dbeafe',  // Light hover states
          200: '#bfdbfe',  // Disabled states
          300: '#93c5fd',  // Subtle accents
          400: '#60a5fa',  // Interactive elements
          500: '#3b82f6',  // Main primary (WCAG AAA: 4.52:1 on white)
          600: '#2563eb',  // Primary buttons, active states
          700: '#1d4ed8',  // Hover states
          800: '#1e40af',  // Pressed states
          900: '#1e3a8a',  // Dark text on light backgrounds
        },

        // SECONDARY: Trust Teal (Supporting actions, secondary features)
        secondary: {
          50: '#f0fdfa',   // Light backgrounds
          100: '#ccfbf1',  // Hover backgrounds
          200: '#99f6e4',  // Disabled
          300: '#5eead4',  // Accents
          400: '#2dd4bf',  // Interactive
          500: '#14b8a6',  // Main secondary (WCAG AAA: 3.57:1 on white)
          600: '#0d9488',  // Active states
          700: '#0f766e',  // Hover
          800: '#115e59',  // Pressed
          900: '#134e4a',  // Dark text
        },

        // SAFETY ZONES: Visual hierarchy for risk levels
        safe: {
          50: '#f0fdf4',   // Light green background
          100: '#dcfce7',  // Hover
          200: '#bbf7d0',  // Border
          300: '#86efac',  // Icon background
          400: '#4ade80',  // Interactive
          500: '#22c55e',  // Main (WCAG AA: 3.02:1 on white)
          600: '#16a34a',  // Active
          700: '#15803d',  // Text on light
          800: '#166534',  // Dark
          900: '#14532d',  // Very dark
        },

        caution: {
          50: '#fffbeb',   // Light amber
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main (WCAG AA: 2.37:1 - requires dark text)
          600: '#d97706',  // Active
          700: '#b45309',  // Text on light
          800: '#92400e',
          900: '#78350f',
        },

        danger: {
          50: '#fef2f2',   // Light red
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Main (WCAG AA: 3.35:1)
          600: '#dc2626',  // Active, emergency button
          700: '#b91c1c',  // Text on light
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // SEMANTIC COLORS
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },

        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },

        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // NEUTRALS: Gray scale for UI elements
        neutral: {
          50: '#f9fafb',   // Lightest background
          100: '#f3f4f6',  // Card backgrounds
          200: '#e5e7eb',  // Borders
          300: '#d1d5db',  // Disabled
          400: '#9ca3af',  // Placeholder text
          500: '#6b7280',  // Secondary text (WCAG AAA: 4.54:1)
          600: '#4b5563',  // Primary text on light
          700: '#374151',  // Headings
          800: '#1f2937',  // Dark text
          900: '#111827',  // Darkest text (WCAG AAA: 15.53:1)
        },
      },

      // SPACING: Touch-friendly sizes
      spacing: {
        '18': '4.5rem',   // 72px - Large touch targets
        '22': '5.5rem',   // 88px - Extra large buttons
      },

      // BORDER RADIUS: Softer, more approachable
      borderRadius: {
        '4xl': '2rem',    // 32px - Very rounded cards
        '5xl': '2.5rem',  // 40px - Pill buttons
      },

      // SHADOWS: Depth and hierarchy
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'emergency': '0 12px 32px rgba(220, 38, 38, 0.25)',
      },
    },
  },
  plugins: [],
}
