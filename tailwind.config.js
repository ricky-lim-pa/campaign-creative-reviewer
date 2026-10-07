/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        hub: {
          cream: "#f5f5f5",
          "cream-dark": "#f4f4f4",
          heading: "#414141",
          ink: "#545353",
          muted: "rgba(84, 83, 83, 0.75)",
          soft: "rgba(84, 83, 83, 0.55)",
          green: "#33cbcc",
          "green-dark": "#3d7475",
          "green-text": "#3d7475",
          border: "#d7d7d7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        humaan: "-0.04em",
        "humaan-tight": "-0.03em",
        "humaan-wide": "0.16em",
        "humaan-eyebrow": "0.2em",
      },
      maxWidth: {
        hub: "1432px",
        "hub-narrow": "1220px",
      },
    },
  },
  plugins: [],
};
