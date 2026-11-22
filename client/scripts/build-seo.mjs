/**
 * Build-time SEO artefact generator.
 *
 * Runs as part of `npm run build` (after `vite build`). Reads the blog post
 * modules directly — they are pure data, so Node can import them — and writes:
 *
 *   dist/sitemap.xml   — every indexable route with fresh lastmod values.
 *   dist/rss.xml       — an RSS 2.0 feed of the blog.
 *
 * Only indexable pages are written; `/admin` is deliberately excluded and the
 * host is hard-coded, so stale or unintended URLs cannot be published.
 */

import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, "..");
const distDir = path.join(clientRoot, "dist");
const postsDir = path.join(clientRoot, "src", "content", "posts");

const SITE = "https://mk-portfolio-phi-silk.vercel.app";
const TODAY = new Date().toISOString().slice(0, 10);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const dateOf = (iso) => {
  const parsed = new Date(`${String(iso || "")}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? TODAY : parsed.toISOString().slice(0, 10);
};

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const collectPosts = async () => {
  const files = readdirSync(postsDir).filter((file) => file.endsWith(".js")).sort();
  const posts = [];

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(postsDir, file)).href);
    const data = mod.default || {};
    if (!data.title) continue;
    posts.push({
      title: data.title,
      description: data.description || "",
      slug: slugify(data.slug || ""),
      date: dateOf(data.date),
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category || "General",
      author: data.author || "Mayuresh Kasar",
    });
  }

  posts.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return posts;
};

const sitemapUrls = (posts) => {
  const urls = [
    { url: `${SITE}/`, lastmod: TODAY, priority: 1.0 },
    { url: `${SITE}/about`, lastmod: TODAY, priority: 0.9 },
    { url: `${SITE}/skills`, lastmod: TODAY, priority: 0.9 },
    { url: `${SITE}/projects`, lastmod: TODAY, priority: 0.9 },
    { url: `${SITE}/certificates`, lastmod: TODAY, priority: 0.8 },
    { url: `${SITE}/system`, lastmod: TODAY, priority: 0.7 },
    { url: `${SITE}/contact`, lastmod: TODAY, priority: 0.9 },
    { url: `${SITE}/blog`, lastmod: TODAY, priority: 0.9 },
    { url: `${SITE}/tools`, lastmod: TODAY, priority: 0.8 },
  ];

  const seen = new Set(urls.map((u) => u.url));
  for (const post of posts) {
    const loc = `${SITE}/blog/${post.slug}`;
    if (!seen.has(loc)) {
      urls.push({ url: loc, lastmod: post.date, priority: 0.7 });
      seen.add(loc);
    }
  }

  const taxonomy = new Map();
  for (const post of posts) {
    for (const tag of post.tags) taxonomy.set(`/blog/tag/${slugify(tag)}`, post.date);
    taxonomy.set(`/blog/category/${slugify(post.category)}`, post.date);
  }
  for (const [pathname, lastmod] of [...taxonomy.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const loc = `${SITE}${pathname}`;
    if (!seen.has(loc)) {
      urls.push({ url: loc, lastmod, priority: 0.5 });
      seen.add(loc);
    }
  }

  urls.sort((a, b) => a.url.localeCompare(b.url));
  return urls;
};

const renderSitemap = (urls) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      ({ url, lastmod, priority }) =>
        `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

const renderRss = (posts) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0">\n  <channel>\n` +
  `    <title>MK-PORTFOLIO Technical Blog</title>\n` +
  `    <link>${escapeXml(`${SITE}/blog`)}</link>\n` +
  `    <description>Technical articles about React, Node.js, Vite, Docker and the architecture of the portfolio.</description>\n` +
  `    <language>en</language>\n    <lastBuildDate>${TODAY}</lastBuildDate>\n` +
  posts
    .slice(0, 20)
    .map(
      (post) =>
        `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${escapeXml(`${SITE}/blog/${post.slug}`)}</link>\n      <pubDate>${post.date}T00:00:00Z</pubDate>\n      <guid isPermaLink="true">${escapeXml(`${SITE}/blog/${post.slug}`)}</guid>\n      <description>${escapeXml(post.description)}</description>\n      <category>${escapeXml(post.category)}</category>\n    </item>`
    )
    .join("\n") +
  `\n  </channel>\n</rss>\n`;

const main = async () => {
  const posts = await collectPosts();
  const urls = sitemapUrls(posts);

  writeFileSync(path.join(distDir, "sitemap.xml"), renderSitemap(urls));
  writeFileSync(path.join(distDir, "rss.xml"), renderRss(posts));

  process.stdout.write(
    `build-seo: ${posts.length} blog posts, ${urls.length} sitemap URLs\n`
  );
};

await main();
