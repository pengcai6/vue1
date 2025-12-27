import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#409eff',
          dark: '#337ecc',
        },
        success: {
          DEFAULT: '#67c23a',
          dark: '#529b2e',
        },
        warning: {
          DEFAULT: '#e6a23c',
          dark: '#b88230',
        },
        danger: {
          DEFAULT: '#f56c6c',
          dark: '#c45656',
        },
        info: {
          DEFAULT: '#909399',
          dark: '#73767a',
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
