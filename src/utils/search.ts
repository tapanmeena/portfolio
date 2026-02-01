import type { CollectionEntry } from "astro:content";

export interface SearchItem {
  type: "blog" | "project";
  slug: string;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  category?: string;
  techStack?: string[];
}

/**
 * Build a search item from a blog post
 */
export function blogToSearchItem(post: CollectionEntry<"blog">): SearchItem {
  return {
    type: "blog",
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    url: `/blog/${post.slug}`,
    tags: post.data.tags,
    category: post.data.category,
  };
}

/**
 * Build a search item from a project
 */
export function projectToSearchItem(
  project: CollectionEntry<"projects">,
): SearchItem {
  return {
    type: "project",
    slug: project.slug,
    title: project.data.title,
    description: project.data.description,
    url: `/projects/${project.slug}`,
    techStack: project.data.techStack,
    category: project.data.category,
  };
}

/**
 * Fuse.js configuration for search
 */
export const fuseOptions = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.3 },
    { name: "tags", weight: 0.15 },
    { name: "category", weight: 0.1 },
    { name: "techStack", weight: 0.15 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

/**
 * Recent searches localStorage key
 */
export const RECENT_SEARCHES_KEY = "portfolio-recent-searches";
export const MAX_RECENT_SEARCHES = 5;

/**
 * Save a search query to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (!query.trim()) return;

  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  let searches: string[] = stored ? JSON.parse(stored) : [];

  // Remove duplicate if exists
  searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());

  // Add to beginning
  searches.unshift(query.trim());

  // Keep only max items
  searches = searches.slice(0, MAX_RECENT_SEARCHES);

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof localStorage === "undefined") return [];
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}
