import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        confluence: {
          blue: "#0052CC",
          "blue-hover": "#0747A6",
          "blue-light": "#DEEBFF",
          nav: "#0747A6",
          sidebar: "#F4F5F7",
          border: "#DFE1E6",
          text: "#172B4D",
          "text-subtle": "#6B778C",
          "text-link": "#0052CC",
          surface: "#FFFFFF",
          "surface-overlay": "#F4F5F7",
          red: "#DE350B",
          "red-light": "#FFEBE6",
          yellow: "#FF991F",
          "yellow-light": "#FFFAE6",
          green: "#36B37E",
          "green-light": "#E3FCEF",
          purple: "#6554C0",
          "purple-light": "#EAE6FF",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
