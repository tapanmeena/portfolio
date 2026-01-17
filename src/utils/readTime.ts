export const calculateReadTime = (content: string): number => {
  const plainText = content
    .replace(/<[^>]*>/g, "")
    .replace(/[#*`~\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = plainText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(wordCount / 200);

  return Math.max(1, minutes);
};

export const formatReadTime = (minutes: number): string => {
  return `${minutes} min read`;
};
