export interface Author {
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export const authors: Record<string, Author> = {
  "tapan-meena": {
    name: "Tapan Meena",
    slug: "tapan-meena",
    avatar: "/images/authors/tapan-meena/avatar.svg",
    bio: "Software Engineer passionate about cloud computing, DevOps, and building developer tools.",
    social: {
      twitter: "https://twitter.com/tapanmeena3",
      github: "https://github.com/tapanmeena",
      linkedin: "https://www.linkedin.com/in/tapanmeena/",
      website: "https://tapanmeena.com",
    },
  },
};

/**
 * Get author data by name string from frontmatter
 * Falls back to a default author object if not found
 */
export const getAuthorByName = (name: string): Author => {
  // Convert name to slug format for lookup
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  if (authors[slug]) {
    return authors[slug];
  }

  return {
    name,
    slug,
    avatar: "/images/authors/default.svg",
    bio: "",
  };
};
