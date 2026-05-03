import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  blogToSearchItem,
  projectToSearchItem,
  tradingToSearchItem,
  type SearchItem,
} from "@utils/search";

export const GET: APIRoute = async () => {
  // Get all published blog posts
  const allPosts = await getCollection("blog");
  const publishedPosts = allPosts.filter((post) => !post.data.draft);

  // Get all published projects
  const allProjects = await getCollection("projects");
  const publishedProjects = allProjects.filter(
    (project) => !project.data.draft,
  );

  // Trading curriculum chapters
  const tradingEntries = await getCollection("trading");

  // Build search index
  const searchIndex: SearchItem[] = [
    ...publishedPosts.map(blogToSearchItem),
    ...publishedProjects.map(projectToSearchItem),
    ...tradingEntries.map(tradingToSearchItem),
  ];

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
