import { tailwindConfig } from '@storefront-ui/react/tailwind-config';
import sfTypography from '@storefront-ui/typography';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './sf-modules/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/@storefront-ui/react/**/*.js',
  ],
  corePlugins: {
    preflight: true,
  },
  plugins: [sfTypography],
  presets: [tailwindConfig],
  theme: {
    extend: {
      colors: {
        // Uncomment to customize your primary color
        // primary: {
        //   50: '#f5f9ff',
        //   100: '#e9f3ff',
        //   200: '#c8e0ff',
        //   300: '#a6ccff',
        //   400: '#6ea1ff',
        //   500: '#3375ff',
        //   600: '#2e6ae6',
        //   700: '#264ebf',
        //   800: '#1d3f99',
        //   900: '#132f72',
        // },
      },
      fontFamily: {
        body: 'var(--font-body)',
        headings: 'var(--font-headings)',
      },
      screens: {
        '2-extra-large': '1366px',
        '2-extra-small': '360px',
        '3-extra-large': '1536px',
        '4-extra-large': '1920px',
        'extra-large': '1280px',
        'extra-small': '376px',
        large: '1024px',
        medium: '768px',
        small: '640px',
      },
    },
  },
};
export default config;
