/**
 * Blog content helpers.
 *
 * Posts are plain JavaScript modules in `src/content/posts/*.js`. Each module
 * exports structured content blocks instead of raw HTML, so the renderer can
 * build safe React elements (no `dangerouslySetInnerHTML`, no Markdown parser,
 * no extra dependency). `import.meta.glob` is provided by Vite.
 */

import {
  matchesCategory,
  matchesTag,
  slugify,
} from "./taxonomy.js";

const postModules = import.meta.glob("../content/posts/*.js", {
  eager: true,
  import: "default",
});

const blockText = (block) => {
  switch (block.type) {
    case "p":
    case "h2":
    case "h3":
    case "quote":
      return block.text || "";
    case "code":
      return block.code || "";
    case "list":
      return (block.items || []).join(" ");
    case "callout":
      return `${block.title || ""} ${block.text || ""}`;
    default:
      return "";
  }
};

export const estimateReadingMinutes = (blocks = []) => {
  const words = blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export const formatDate = (iso) => {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const normalize = (raw, fileName) => {
  const slug = raw.slug || slugify(raw.title || fileName.replace(/\.js$/, ""));
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  return {
    slug,
    title: raw.title || "Untitled",
    description: raw.description || "",
    date: raw.date || "1970-01-01",
    updated: raw.updated || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    category: raw.category || "General",
    featured: Boolean(raw.featured),
    author: raw.author || "Mayuresh Kasar",
    blocks,
    readingTime: estimateReadingMinutes(blocks),
  };
};

export const POSTS = Object.entries(postModules)
  .map(([path, mod]) => normalize(mod, path.split("/").pop()))
  .filter((post) => post.title)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const getPost = (slug) =>
  POSTS.find((post) => post.slug === slug) || null;

export const allTags = () => {
  const counts = new Map();
  for (const post of POSTS) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, slug: slugify(tag) }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

export const allCategories = () => {
  const counts = new Map();
  for (const post of POSTS) {
    counts.set(post.category, (counts.get(post.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count, slug: slugify(category) }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
};

export const postsByTag = (tag) =>
  POSTS.filter((post) => matchesTag(post, tag));

export const postsByCategory = (category) =>
  POSTS.filter((post) => matchesCategory(post, category));

export const relatedPosts = (post, limit = 2) =>
  POSTS.filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      let score = 0;
      for (const tag of post.tags) {
        if (candidate.tags.includes(tag)) score += 2;
      }
      if (candidate.category === post.category) score += 1;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);

export const extractHeadings = (blocks = []) =>
  blocks
    .filter((block) => block.type === "h2" || block.type === "h3")
    .map((block) => ({
      id: block.id || slugify(block.text),
      text: block.text,
      level: block.type === "h2" ? 2 : 3,
    }));

export const searchPosts = (query, posts = POSTS) => {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return posts;
  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.description,
      post.category,
      ...post.tags,
      ...post.blocks.map(blockText),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
};

export const tagSlug = slugify;
