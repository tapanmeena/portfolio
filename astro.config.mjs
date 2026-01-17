import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://tapanmeena.com",
  base: "/blog",
  output: "static",
  integrations: [sitemap()],
});
