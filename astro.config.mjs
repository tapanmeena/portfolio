import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import remarkTradingLinks from "./src/utils/remarkTradingLinks.mjs";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: "https://tapanmeena.com",
  output: "static",
  integrations: [sitemap()],

  markdown: {
    remarkPlugins: [remarkTradingLinks, remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),
});
