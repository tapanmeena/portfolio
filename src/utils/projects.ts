import type { CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

/**
 * Normalize a tech stack item to a URL-safe slug
 */
export const normalizeTech = (tech: string): string => {
  return tech
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Collect all unique tech stack items from projects
 */

export const collectUniqueTechStack = (projects: Project[]): string[] => {
  const set = new Set<string>();
  projects.forEach((project) => {
    const techStack = project?.data?.techStack ?? [];
    techStack.forEach((tech: string) => set.add(tech));
  });
  return Array.from(set).sort();
};

/**
 * Filter projects by tech stack
 */
export const filterProjectsByTech = (
  projects: Project[],
  techSlug: string,
): Project[] => {
  return projects.filter((project) => {
    const techStack = project?.data?.techStack ?? [];
    return techStack.some((t: string) => normalizeTech(t) === techSlug);
  });
};

/**
 * Get featured projects
 */
export const getFeaturedProjects = (projects: Project[]): Project[] => {
  return projects
    .filter((p) => p.data.featured && !p.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.startDate).getTime() -
        new Date(a.data.startDate).getTime(),
    );
};

/**
 * Get non-draft projects sorted by start date (newest first)
 */
export const getPublishedProjects = (projects: Project[]): Project[] => {
  return projects
    .filter((p) => !p.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.startDate).getTime() -
        new Date(a.data.startDate).getTime(),
    );
};

/**
 * Group projects by year based on start date
 */
export const groupProjectsByYear = (
  projects: Project[],
): Map<number, Project[]> => {
  const grouped = new Map<number, Project[]>();

  projects.forEach((project) => {
    const year = new Date(project.data.startDate).getFullYear();
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(project);
  });

  // Sort map by year descending
  return new Map(
    [...grouped.entries()].sort(([yearA], [yearB]) => yearB - yearA),
  );
};

/**
 * Check if a project is ongoing (no end date)
 */
export const isOngoing = (project: Project): boolean => {
  return !project.data.endDate;
};

/**
 * Format date for display
 */
export const formatProjectDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Get date range string for a project
 */
export const getProjectDateRange = (project: Project): string => {
  const start = formatProjectDate(new Date(project.data.startDate));
  if (isOngoing(project)) {
    return `${start} - Present`;
  }

  const end = formatProjectDate(new Date(project.data.endDate!));
  return start === end ? start : `${start} - ${end}`;
};

/**
 * Generate URL for a project's tech stack filter
 */
export const techToUrl = (tech: string): string => {
  return `/projects?tech=${normalizeTech(tech)}`;
};
