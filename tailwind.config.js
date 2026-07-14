/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0c1324",
        surface: "#0c1324",
        "surface-container": "#191f31",
        "surface-container-low": "#151b2d",
        "surface-container-lowest": "#070d1f",
        "surface-container-high": "#23293c",
        "surface-container-highest": "#2e3447",
        primary: "#8aebff",
        secondary: "#4edea3",
        "on-surface": "#dce1fb",
        "on-surface-variant": "#bbc9cd",
        outline: "#859397",
        "outline-variant": "#3c494c",
        error: "#ffb4ab",
      },
      fontFamily: {
        "body-md": ["Be Vietnam Pro", "sans-serif"],
        "data-display": ["JetBrains Mono", "monospace"],
        "label-caps": ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "700" }],
        "data-display": ["18px", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
}