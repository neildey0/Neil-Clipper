/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        accent: {
          DEFAULT: "#FFE234", // QUALUME yellow
          hover: "#E5CB2E",
          muted: "rgba(255, 226, 52, 0.15)",
        },
        panel: {
          bg: "rgba(15, 23, 42, 0.45)", // Slate dark glass background
          border: "rgba(255, 255, 255, 0.08)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Helvetica", "sans-serif"],
        heading: ["var(--font-heading)", "Outfit", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
