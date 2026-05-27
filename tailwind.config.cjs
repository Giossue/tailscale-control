const { heroui } = require("@heroui/react");

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [
    heroui({
      defaultTheme: "dark",
      themes: {
        light: {
          colors: {
            background: "#ffffff",
            foreground: "#050505",
            primary: {
              DEFAULT: "#050505",
              foreground: "#ffffff"
            },
            default: {
              DEFAULT: "#f4f4f5",
              foreground: "#050505"
            },
            focus: "#050505"
          }
        },
        dark: {
          colors: {
            background: "#050505",
            foreground: "#ffffff",
            primary: {
              DEFAULT: "#ffffff",
              foreground: "#050505"
            },
            default: {
              DEFAULT: "#18181b",
              foreground: "#ffffff"
            },
            focus: "#ffffff"
          }
        }
      }
    })
  ]
};
