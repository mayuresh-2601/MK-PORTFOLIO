import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyRouteMeta,
  buildRoutePages,
  renderLlms,
  renderRss,
  renderSitemap,
  sitemapUrls,
} from "../scripts/build-seo.mjs";

const clientRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const template = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Home</title>
<meta name="description" content="home description" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://mk-portfolio-phi-silk.vercel.app/" />
<meta property="og:title" content="home" />
<meta property="og:description" content="home" />
<meta property="og:url" content="https://mk-portfolio-phi-silk.vercel.app/" />
<meta property="og:type" content="website" />
<meta name="twitter:title" content="home" />
<meta name="twitter:description" content="home" />
<script type="application/ld+json">{"@graph":[{"@type":"ProfilePage"}]}</script>
</head>
<body>
<noscript><main><h1>Old fallback</h1></main></noscript>
<div id="root"></div>
</body>
</html>`;

const posts = [
  {
    slug: "test-post",
    title: "Test Post",
    description: "A test article.",
    date: "2026-01-02",
    updated: null,
    tags: ["React", "Node.js"],
    category: "Frontend",
    author: "Mayuresh Kasar",
  },
];

const routes = buildRoutePages(posts);

test("route generation covers public, private, blog and taxonomy pages", () => {
  const paths = new Set(routes.map((route) => route.path));

  for (const expected of [
    "/",
    "/about",
    "/blog",
    "/tools",
    "/privacy",
    "/terms",
    "/accessibility",
    "/blog/test-post",
    "/blog/tag/nodejs",
    "/blog/category/frontend",
    "/admin",
    "/404",
  ]) {
    assert.equal(paths.has(expected), true, `missing route ${expected}`);
  }
});

test("route files use directory indexes and 404.html", () => {
  const byPath = new Map(routes.map((route) => [route.path, route.file]));

  assert.equal(byPath.get("/"), "index.html");
  assert.equal(byPath.get("/about"), "about/index.html");
  assert.equal(byPath.get("/blog/test-post"), "blog/test-post/index.html");
  assert.equal(byPath.get("/admin"), "admin/index.html");
  assert.equal(byPath.get("/404"), "404.html");
});

test("sitemap excludes private and 404 documents", () => {
  const urls = sitemapUrls(routes).map((entry) => entry.url);

  assert.equal(
    urls.includes("https://mk-portfolio-phi-silk.vercel.app/privacy"),
    true
  );
  assert.equal(
    urls.includes("https://mk-portfolio-phi-silk.vercel.app/blog/test-post"),
    true
  );
  assert.equal(
    urls.some((url) => url.includes("/admin")),
    false
  );
  assert.equal(
    urls.some((url) => url.endsWith("/404")),
    false
  );
});

test("article metadata replaces the shared SPA head", () => {
  const route = routes.find((entry) => entry.path === "/blog/test-post");
  const html = applyRouteMeta(template, route);

  assert.match(html, /<title>Test Post<\/title>/);
  assert.match(html, /name="description" content="A test article\."/);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/mk-portfolio-phi-silk\.vercel\.app\/blog\/test-post"/
  );
  assert.match(html, /property="og:type" content="article"/);
  assert.match(html, /"@type": "BlogPosting"/);
  assert.match(html, /property="article:published_time" content="2026-01-02"/);
  assert.match(html, /<h1>Test Post<\/h1>/);
});

test("404 metadata is noindex and has no canonical", () => {
  const route = routes.find((entry) => entry.path === "/404");
  const html = applyRouteMeta(template, route);

  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.doesNotMatch(html, /application\/ld\+json/);
  assert.match(html, /<h1>Lost in the grid\.<\/h1>/);
});

test("the homepage keeps its static structured-data graph", () => {
  const route = routes.find((entry) => entry.path === "/");
  const html = applyRouteMeta(template, route);

  assert.match(html, /"@type":"ProfilePage"/);
});

test("sitemap XML escapes special characters", () => {
  const xml = renderSitemap([
    {
      url: "https://example.com/?a=1&b=2",
      lastmod: "2026-01-01",
      changefreq: "monthly",
      priority: 0.5,
    },
  ]);

  assert.match(xml, /a=1&amp;b=2/);
});

test("RSS uses RFC 822 dates", () => {
  const xml = renderRss(posts);

  assert.match(xml, /Fri, 02 Jan 2026 00:00:00 GMT/);
  assert.match(xml, /<link>https:\/\/mk-portfolio-phi-silk\.vercel\.app\/blog<\/link>/);
});

test("llms.txt includes public content but never the admin area", () => {
  const text = renderLlms(posts, routes);

  assert.match(text, /^# Mayuresh Kasar/m);
  assert.match(text, /\/privacy/);
  assert.match(text, /Test Post/);
  assert.doesNotMatch(text, /\/admin/);
  assert.doesNotMatch(text, /\/404/);
});

test("vercel.json uses clean URLs and has no SPA catch-all rewrite", () => {
  const config = JSON.parse(
    readFileSync(path.join(clientRoot, "vercel.json"), "utf8")
  );

  assert.equal(config.cleanUrls, true);
  assert.equal(config.trailingSlash, false);
  assert.equal(
    config.rewrites.some((rewrite) => rewrite.source === "/(.*)"),
    false
  );
});
