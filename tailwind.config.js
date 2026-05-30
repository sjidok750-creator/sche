/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0a1f44",
        "navy-soft": "#13294f",
        teal: "#2c7a7b",
        sky: "#2f86d4",
        slate2: "#475569",
        amber2: "#c98a1f"
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        body: ["Pretendard", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      }
    }
  },
  plugins: []
};
