import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        border: "var(--border)",
        border2: "var(--border2)",
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text2)",
          3: "var(--text3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
        },
        green: "var(--green)",
        "green-dim": "var(--green-dim)",
        red: "var(--red)",
        "red-dim": "var(--red-dim)",
        yellow: "var(--yellow)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        chip: "4px",
        btn: "5px",
        card: "6px",
        panel: "8px",
        modal: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
