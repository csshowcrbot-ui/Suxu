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
        roseGold: {
          DEFAULT: "#B89B72", // 日式香檳白金 / 真鍮色 (Muted Champagne Brass)
          light: "#D4C2A5",
          dark: "#967950",
          soft: "#F5F0E6",
        },
        terracotta: {
          DEFAULT: "#DFD3C3", // 生成りベージュ (Washi Kinari Beige)
          light: "#F2ECE4",
          dark: "#BFA992",
        },
        graphite: {
          DEFAULT: "#2C2A29", // 墨茶色 (Soft Sumi Charcoal)
          light: "#5A5550",
          dark: "#1C1A19",
        },
        ivory: {
          DEFAULT: "#FAF8F5", // 和紙白 (Warm Washi Alabaster)
          subtle: "#F1ECE4",
        },
        status: {
          success: "#5B7A63", // 抹茶青磁 (Muted Celadon Sage)
          warning: "#C2844F", // 琥珀茶 (Muted Amber)
          error: "#B55A52",   // 茜紅 (Muted Akane Red)
          line: "#4A7C59",    // 沉穩若竹綠
        },
      },
      fontFamily: {
        sans: ["'Noto Sans TC'", "system-ui", "-apple-system", "sans-serif"],
        serif: ["'Noto Serif TC'", "'Cormorant Garamond'", "Georgia", "serif"],
        display: ["'Cormorant Garamond'", "'Noto Serif TC'", "serif"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
