import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: "#1F5D46",
          deep: "#164333",
          leaf: "#3F8061",
          sage: "#DDEBE1",
          cream: "#FAF7EF",
          paper: "#FFFFFF",
          marigold: "#E8A83E",
          terracotta: "#B85D43",
        },
        ink: {
          primary: "#1C2923",
          secondary: "#59665F",
        },
        line: {
          default: "#DCE4DD",
        },
        state: {
          success: "#237447",
          warning: "#8A5A00",
          danger: "#B42318",
          info: "#175CD3",
        },
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-source-sans)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        sheet: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
