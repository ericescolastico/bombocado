import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/dist/**/*.{js,mjs,cjs}",
    "./node_modules/flowbite/**/*.js",
  ],
  safelist: [
    'bg-orange-500',
    'text-orange-100',
    'text-orange-600',
    'text-orange-700',
    'bg-orange-50',
    'border-l-orange-500',
    'bg-orange-600',
    'bg-orange-700',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#059669",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
    require('flowbite/plugin'),
  ],
};
export default config;

