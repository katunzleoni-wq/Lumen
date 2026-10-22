import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        papyrus: {
          50: "#fbf9f4",
          100: "#f5f0e6",
          200: "#e9dfcc",
          300: "#d8c7a8",
          400: "#bfa579",
          500: "#a8895b",
          600: "#8d6e43",
          700: "#705535",
          800: "#5a452f",
          900: "#443428",
        },
        forest: {
          50: "#f0f7f4",
          100: "#dcece5",
          200: "#bcd9cc",
          300: "#92beac",
          400: "#669e89",
          500: "#48826e",
          600: "#376858",
          700: "#2f5448",
          800: "#293f37",
          900: "#1e342d",
          950: "#10231d",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f5ecd2",
          200: "#ead7a3",
          300: "#ddbd70",
          400: "#d0a34a",
          500: "#c18c36",
          600: "#a86f2a",
          700: "#8a5326",
          800: "#724425",
          900: "#613a24",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(28, 55, 46, 0.32)",
        lift: "0 26px 70px -32px rgba(25, 50, 42, 0.42)",
        book: "0 20px 45px -22px rgba(34, 34, 28, 0.5), 0 4px 10px -5px rgba(34, 34, 28, 0.28)",
        inset: "inset 0 1px 0 0 rgba(255, 255, 255, 0.55)",
      },
      backgroundImage: {
        "grain-light":
          "radial-gradient(circle at 1px 1px, rgba(43, 64, 55, 0.09) 1px, transparent 0)",
        "hero-glow":
          "radial-gradient(55% 65% at 72% 12%, rgba(206, 173, 102, 0.28) 0%, transparent 68%), radial-gradient(45% 55% at 12% 92%, rgba(56, 107, 88, 0.2) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-9px)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "soft-float": "soft-float 7s ease-in-out infinite",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: "var(--font-lora)",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
