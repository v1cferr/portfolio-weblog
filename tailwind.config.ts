import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {},
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar"),
    require("daisyui"),
  ],
  daisyui: {
    // https://daisyui.com/docs/themes/
    themes: ["light", "dark"],
  },
};
export default config;
