import { defineCollection, z } from "astro:content";

export const blogCollection = defineCollection({
  type: "content",
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

export const collections = {
  blog: blogCollection,
};
