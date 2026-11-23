/**
 * Pure blog taxonomy helpers.
 *
 * URL segments are slugs (`/blog/tag/node-js`), while post data stores the
 * display label (`Node.js`). Comparing the two directly made a tag page look
 * empty even though posts carried the tag. These helpers compare the slugified
 * forms instead, so the URL and the content model cannot drift apart.
 */

export const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const matchesTag = (post, tag) => {
  const needle = slugify(tag);
  if (!needle || !Array.isArray(post?.tags)) return false;

  return post.tags.some((candidate) => slugify(candidate) === needle);
};

export const matchesCategory = (post, category) => {
  const needle = slugify(category);
  if (!needle) return false;

  return slugify(post?.category) === needle;
};

export const tagNameForSlug = (posts = [], slug) => {
  const needle = slugify(slug);

  for (const post of posts) {
    for (const tag of post?.tags || []) {
      if (slugify(tag) === needle) return tag;
    }
  }

  return slug || "";
};

export const categoryNameForSlug = (posts = [], slug) => {
  const needle = slugify(slug);

  for (const post of posts) {
    if (slugify(post?.category) === needle) return post.category;
  }

  return slug || "";
};

export default {
  slugify,
  matchesTag,
  matchesCategory,
  tagNameForSlug,
  categoryNameForSlug,
};
