/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: "#00f0ff",
          blue: "#0066ff",
          purple: "#9d00ff",
          pink: "#ff007f",
          emerald: "#00ff9d",
          amber: "#ffaa00",
          crimson: "#ff2244",
        },
        cyber: {
          black: "#05060b",
          dark: "#0b0e17",
          darker: "#07090f",
          card: "rgba(14, 18, 32, 0.85)",
          border: "rgba(0, 240, 255, 0.25)",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0, 240, 255, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.2)",
        "neon-purple": "0 0 20px rgba(157, 0, 255, 0.4), inset 0 0 10px rgba(157, 0, 255, 0.2)",
        "neon-pink": "0 0 20px rgba(255, 0, 127, 0.4), inset 0 0 10px rgba(255, 0, 127, 0.2)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(0, 240, 255, 0.8))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 5px rgba(0, 240, 255, 0.3))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanline: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
      },
    },
  },
  plugins: [],
};
