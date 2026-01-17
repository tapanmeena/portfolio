export function normalizeCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function collectUniqueCategory(posts: Array<any>): string[] {
  const set = new Set<string>();
  posts.forEach((post) => {
    const category = post?.data?.category ?? "";
    if (category) {
      set.add(category);
    }
  });
  return Array.from(set);
}

export function categoryToUrl(category: string): string {
  return `/blog/category/${normalizeCategory(category)}`;
}

export function filterPostsByCategory(posts: Array<any>, categorySlug: string) {
  return posts.filter((post) => {
    const category = post?.data?.category ?? "";
    if (!category) {
      return false;
    }
    return normalizeCategory(category) === categorySlug;
  });
}
