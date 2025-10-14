import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-green": "#3f9e68",
      },
      keyframes: {
        scanning: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(10000%)" },
        },
      },
      animation: {
        scanning: "scanning 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
