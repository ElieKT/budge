import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dbfceb",
          200: "#b9f7d8",
          300: "#83edbb",
          400: "#48db98",
          500: "#22c17b",
          600: "#159d63",
          700: "#137c51",
          800: "#136243",
          900: "#125138",
          950: "#052e1f",
        },
        income: "#0ca30c",
        expense: "#d03b3b",
        surface: "#ffffff",
        muted: "#f5f6f8",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
