import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const urlOptional = z.string().url().optional();

export const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishedAt: z.date(),
      updatedAt: z.date().optional(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      author: z.string(),
      coverImage: image().optional(),
      draft: z.boolean().default(true),
    }),
});

export const projectsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      coverImage: image().optional(),
      techStack: z.array(z.string()).default([]),
      category: z.string().optional(),
      liveUrl: urlOptional,
      repoUrl: urlOptional,
      blogUrl: z.string().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
      status: z
        .enum(["in-progress", "completed", "archived", "on-hold"])
        .default("in-progress"),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const tradingCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/trading" }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    tier: z.enum(["beginner", "intermediate", "advanced", "special"]),
    order: z.number().int().positive(),
    source: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  projects: projectsCollection,
  trading: tradingCollection,
};
