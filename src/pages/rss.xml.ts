import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");
  const siteBase = String(context.site).replace(/\/$/, "");
  return rss({
    title: "Tapan Meena's Blog",
    description: "Thoughts, stories and ideas.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: `${siteBase}/blog/${post.id}`,
      categories: post?.data?.tags,
      author: post?.data?.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
