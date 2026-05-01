import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-noto-sans-jp)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          50: "#f5f6fb",
          100: "#e7e9f3",
          200: "#c8cce0",
          300: "#a4abc6",
          400: "#7e87ad",
          500: "#5b6592",
          600: "#3f4774",
          700: "#2b3155",
          800: "#1c2040",
          900: "#11142b",
          950: "#0a0a0f",
        },
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(ellipse at top, var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 20% 20%, oklch(0.45 0.20 296) 0px, transparent 50%), radial-gradient(at 80% 0%, oklch(0.50 0.21 320) 0px, transparent 50%), radial-gradient(at 80% 80%, oklch(0.55 0.18 200) 0px, transparent 50%)",
        "accent-gradient":
          "linear-gradient(120deg, oklch(0.65 0.21 296), oklch(0.65 0.24 330), oklch(0.78 0.18 200))",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
