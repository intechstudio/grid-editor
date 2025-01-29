const colors = require("tailwindcss/colors");
const uiKitConfig = require("@intechstudio/grid-uikit/tailwind.config");

const config = {
  mode: "jit",
  content: [
    "./src/renderer/**/*.{html,js,svelte,ts}",
    "./node_modules/@intechstudio/grid-uikit/dist/*.{html,js,svelte,ts}",
  ],
  darkMode: "class",
  presets: [uiKitConfig], // Use the UI kit's Tailwind configuration as a preset
  theme: {
    fontFamily: {
      body: ["roboto"],
    },
    extend: {
      transitionProperty: {
        width: "width",
      },
      margin: {
        14: "3.5rem",
      },
      zIndex: {
        "-10": "-10",
      },
      fontFamily: {
        mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        aldo: "Aldo-SemiBold",
        "roboto-sans": "Roboto Sans",
        "gt-pressura": "GT Pressura Pro M Trial",
        roboto: "Roboto",
        "roboto-mono": "Roboto Mono",
      },
      cursor: {
        helper: "help",
      },
      minHeight: {
        200: "200px",
        300: "300px",
      },
      height: {
        "16px": "16px",
        "18px": "18px",
        32: "8rem",
        14: "3.5rem",
        64: "16rem",
        72: "18rem",
        128: "32rem",
        600: "600px",
        300: "300px",
        calc: "calc(100vh - 62px)",
      },
      width: {
        "16px": "16px",
        "18px": "18px",
        26: "26px",
      },
      inset: {
        "1/2": "50%",
        1: "1em",
        "9/10": "0.9em",
        "-1": "-1em",
      },
      borderWidth: {
        8: "8px",
        16: "16px",
      },
      colors: {
        black: colors.black,
        white: colors.white,
        gray: colors.neutral,
        green: colors.green,
        red: colors.rose,
        yellow: colors.amber,
        pink: colors.pink,
        purple: colors.purple,
        orange: colors.orange,
      },
      thirdery: {
        DEFAULT: "#31313F",
      },
    },
  },
  plugins: [],
};

module.exports = config;
