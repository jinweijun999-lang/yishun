/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E1110",
          light: "#171C1A",
          dark: "#0A0C0B",
        },
        secondary: {
          DEFAULT: "#6F9A84",
          light: "#86AE97",
        },
        accent: {
          DEFAULT: "#C2A067",
          hover: "#D1B17A",
        },
        surface: {
          DEFAULT: "#151A17",
          hover: "#1E2421",
        },
      },
      fontFamily: {
        heading: [
          "Noto Serif SC",
          "Source Han Serif SC",
          "Songti SC",
          "STSong",
          "SimSun",
          "serif",
        ],
        body: [
          "Noto Sans SC",
          "Source Han Sans SC",
          "PingFang SC",
          "Microsoft YaHei",
          "Heiti SC",
          "sans-serif",
        ],
      },
      animation: {
        "twinkle": "twinkle 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "aurora": "aurora 15s ease infinite",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(111, 154, 132, 0.18)" },
          "50%": { boxShadow: "0 0 28px rgba(111, 154, 132, 0.3)" },
        },
        aurora: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "aurora-gradient":
          "linear-gradient(135deg, #0B0D0C, #121816, #1D2421, #0B0D0C)",
      },
    },
  },
  plugins: [],
};
