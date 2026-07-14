import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-accent-light)",
        },
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ['"Source Sans Pro"', "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        display: ['"Politica"', "sans-serif"],
      },
      fontSize: {
        hero: ["61px", { lineHeight: "73px", fontWeight: "700" }],
        "main-lg": ["35px", { lineHeight: "46px", fontWeight: "600" }],
        subtitle: ["27px", { lineHeight: "35px", fontWeight: "400" }],
        h1: ["34px", { lineHeight: "40px", fontWeight: "700" }],
        h2: ["25px", { lineHeight: "30px", fontWeight: "700" }],
        body: ["19px", { lineHeight: "29px", fontWeight: "400" }],
        btn: ["16px", { lineHeight: "19px", fontWeight: "600" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
