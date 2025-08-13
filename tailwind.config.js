/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/app.html', './src/**/*.{html,js,svelte,ts}'],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // 偉鉅股份有限公司品牌色彩
        gmmed: {
          50: '#f0f4f8',    // 淺藍灰背景
          100: '#d9e2ec',   // 淺藍灰邊框
          200: '#bccadc',   // 中淺藍灰
          300: '#9fb3c8',   // 中藍灰
          400: '#829ab1',   // 中深藍灰
          500: '#627d98',   // 主藍色
          600: '#486581',   // 深藍色
          700: '#334e68',   // 更深藍色
          800: '#eb6200',   // 按鈕色
          900: '#4c4948',   // 深灰色（背景色）
        },
        // 醫療專業色彩
        medical: {
          50: '#fefefe',    // 純白
          100: '#fafafa',   // 淺灰白
          200: '#f5f5f5',   // 淺灰
          300: '#e5e5e5',   // 中淺灰
          400: '#d4d4d4',   // 中灰
          500: '#737373',   // 中深灰
          600: '#525252',   // 深灰
          700: '#404040',   // 更深灰
          800: '#262626',   // 深灰（主要文字色）
          900: '#171717',   // 最深灰
        },
        // 高級金色系
        gold: {
          50: '#fffbeb',    // 淺金黃
          100: '#fef3c7',   // 淺金
          200: '#fde68a',   // 中淺金
          300: '#fcd34d',   // 中金
          400: '#fbbf24',   // 中深金
          500: '#f59e0b',   // 主金色
          600: '#d97706',   // 深金
          700: '#b45309',   // 更深金
          800: '#92400e',   // 深金
          900: '#78350f',   // 最深金
        },
        // 信任藍色系
        trust: {
          50: '#eff6ff',    // 淺信任藍
          100: '#dbeafe',   // 淺藍
          200: '#bfdbfe',   // 中淺藍
          300: '#93c5fd',   // 中藍
          400: '#60a5fa',   // 中深藍
          500: '#3b82f6',   // 主信任藍
          600: '#2563eb',   // 深藍
          700: '#1d4ed8',   // 更深藍
          800: '#1e40af',   // 深藍
          900: '#1e3a8a',   // 最深藍
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 