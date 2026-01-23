import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://tapanmeena.com",
  output: "static",
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: false,
    },
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
  },
});
