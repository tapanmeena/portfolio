import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import remarkTradingLinks from "./src/utils/remarkTradingLinks.mjs";
import remarkMermaid from "./src/utils/remarkMermaid.mjs";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: "https://tapanmeena.com",
  output: "static",
  integrations: [sitemap({ filter: (page) => !page.includes("/preview") })],

  markdown: {
    processor: unified({
      remarkPlugins: [remarkTradingLinks, remarkMermaid, remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),
});
