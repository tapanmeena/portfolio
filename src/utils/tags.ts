export function normalizeTag(tag: string) {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function collectUniqueTags(posts: Array<any>): string[] {
  const set = new Set<string>();
  posts.forEach((post) => {
    const tags = post?.data?.tags ?? [];
    tags.forEach((t: string) => set.add(t));
  });
  return Array.from(set);
}

export function tagToUrl(tag: string): string {
  return `/blog/tags/${normalizeTag(tag)}`;
}

export function filterPostsByTag(posts: Array<any>, tagSlug: string) {
  return posts.filter((post) => {
    const tags = post?.data?.tags ?? [];
    return tags.some((t: string) => normalizeTag(t) === tagSlug);
  });
}
