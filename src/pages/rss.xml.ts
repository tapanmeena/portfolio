import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("blog");
  const siteBase = String(context.site).replace(/\/$/, "");
  return rss({
    title: "Astro Learner | Blog",
    description: "My journey learning Astro",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: `${siteBase}/blog/${post.slug}`,
      categories: post?.data?.tags,
      author: post?.data?.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
