const tailwindcss = require("@tailwindcss/postcss");
const autoprefixer = require("autoprefixer");

const config = {
  plugins: [tailwindcss(), autoprefixer],
};

module.exports = config;
