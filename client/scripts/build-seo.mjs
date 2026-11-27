/**
 * Build-time static SEO artefact generator.
 *
 * Runs as part of `npm run build` (after `vite build`). Reads the blog post
 * modules directly — they are pure data, so Node can import them — and writes:
 *
 *   dist/<route>.html   — a route-specific copy of index.html with the correct
 *                         title, description, canonical, social tags, JSON-LD
 *                         and noscript fallback.
 *   dist/404.html       — a real 404 document (Vercel serves it with status 404).
 *   dist/sitemap.xml    — every indexable route, excluding /admin and /api.
 *   dist/rss.xml        — an RSS 2.0 feed of the blog.
 *   dist/llms.txt       — a compact, factual site summary for AI crawlers.
 *
 * The app still hydrates from the same bundle. This is metadata prerendering,
 * not server-side rendering of the React tree; the route-specific noscript
 * block gives non-JavaScript readers a usable summary.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, "..");
const distDir = path.join(clientRoot, "dist");
const postsDir = path.join(clientRoot, "src", "content", "posts");

export const SITE = "https://mk-portfolio-phi-silk.vercel.app";
const TODAY = new Date().toISOString().slice(0, 10);

const CONTACT_EMAIL = "kasarmayuresh99@gmail.com";
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

const NAV_LINKS = [
  ["Home", "/"],
  ["About", "/about"],
  ["Skills", "/skills"],
  ["Projects", "/projects"],
  ["Certificates", "/certificates"],
  ["Blog", "/blog"],
  ["Tools", "/tools"],
  ["Contact", "/contact"],
];

export const STATIC_ROUTES = [
  {
    path: "/",
    title: "Mayuresh Kasar — Full Stack Developer Portfolio",
    description:
      "Mayuresh Kasar — full stack developer portfolio. Explore React, Node.js, Express, MySQL, Docker and CI/CD projects, skills, certificates, and live server telemetry.",
    heading: "Mayuresh Kasar — Full Stack Developer",
    priority: 1.0,
    keepHomeGraph: true,
  },
  {
    path: "/about",
    title: "About Mayuresh Kasar | Full Stack Developer",
    description:
      "About Mayuresh Kasar: a Full Stack Developer from Maharashtra, India, working with React.js, Node.js, Express.js, MySQL/TiDB, Linux and Docker.",
    heading: "About Mayuresh Kasar",
    priority: 0.9,
    breadcrumb: [{ name: "About", path: "/about" }],
  },
  {
    path: "/skills",
    title: "Technical Skills | Mayuresh Kasar",
    description:
      "The technical stack of Mayuresh Kasar: React, JavaScript, Node.js, SQL, Python, Java, Angular, Docker, Linux and DevOps tooling, with an AI explainer for every skill.",
    heading: "Technical Skills",
    priority: 0.9,
    breadcrumb: [{ name: "Skills", path: "/skills" }],
  },
  {
    path: "/projects",
    title: "Projects | Mayuresh Kasar",
    description:
      "Selected full stack projects by Mayuresh Kasar: data analysis with SQL, responsive frontend clones, and React applications with live demos and source code.",
    heading: "Projects",
    priority: 0.9,
    breadcrumb: [{ name: "Projects", path: "/projects" }],
  },
  {
    path: "/certificates",
    title: "Certificates | Mayuresh Kasar",
    description:
      "Verified certificates of Mayuresh Kasar across React, JavaScript, Node.js, SQL, Python, Java, Angular, REST APIs, problem solving and software engineering.",
    heading: "Certificates",
    priority: 0.8,
    breadcrumb: [{ name: "Certificates", path: "/certificates" }],
  },
  {
    path: "/system",
    title: "Live System Metrics | Mayuresh Kasar",
    description:
      "Live telemetry from the portfolio API: CPU load, memory usage, uptime and AI availability, refreshed every few seconds.",
    heading: "Live System Metrics",
    priority: 0.7,
    breadcrumb: [{ name: "System", path: "/system" }],
  },
  {
    path: "/contact",
    title: "Contact Mayuresh Kasar | Hire a Full Stack Developer",
    description:
      "Get in touch with Mayuresh Kasar for freelance work, collaborations or full stack development projects. Messages are delivered straight to the inbox.",
    heading: "Contact Mayuresh Kasar",
    priority: 0.9,
    breadcrumb: [{ name: "Contact", path: "/contact" }],
  },
  {
    path: "/blog",
    title: "Technical Blog - Architecture and Development Practice",
    description:
      "Read technical articles about React and Vite, the full stack, Docker, security, deployment and the projects built at MK-PORTFOLIO.",
    heading: "Engineering in practice",
    priority: 0.9,
    breadcrumb: [{ name: "Blog", path: "/blog" }],
  },
  {
    path: "/tools",
    title: "Developer Tools | Mayuresh Kasar — Full Stack Developer",
    description:
      "Free browser-based developer tools: JSON formatter, Base64, URL and HTML codecs, regex tester, JWT decoder with expiry, UUID v4 generator, SHA hashes, Unix timestamp converter, WCAG contrast checker, CSS gradient builder and HTTP status reference. All tools run locally.",
    heading: "Developer toolkit",
    priority: 0.8,
    breadcrumb: [{ name: "Tools", path: "/tools" }],
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Mayuresh Kasar",
    description:
      "What this portfolio stores, why it stores it, where it goes, and how to ask for access or deletion.",
    heading: "Privacy Policy",
    priority: 0.3,
    changefreq: "yearly",
    breadcrumb: [{ name: "Privacy", path: "/privacy" }],
  },
  {
    path: "/terms",
    title: "Terms of Use | Mayuresh Kasar",
    description:
      "The rules for using this portfolio, its developer tools, and its contact form.",
    heading: "Terms of Use",
    priority: 0.3,
    changefreq: "yearly",
    breadcrumb: [{ name: "Terms", path: "/terms" }],
  },
  {
    path: "/accessibility",
    title: "Accessibility Statement | Mayuresh Kasar",
    description:
      "How this portfolio approaches keyboard access, screen readers, motion, contrast, and feedback.",
    heading: "Accessibility Statement",
    priority: 0.3,
    changefreq: "yearly",
    breadcrumb: [{ name: "Accessibility", path: "/accessibility" }],
  },
];

const PRIVATE_ROUTES = [
  {
    path: "/admin",
    title: "Admin Sign In | Mayuresh Kasar",
    description: "Private administration area.",
    heading: "Admin sign in",
    noindex: true,
    sitemap: false,
  },
  {
    path: "/admin/dashboard",
    title: "Admin Dashboard | Mayuresh Kasar",
    description: "Private administration area.",
    heading: "Admin dashboard",
    noindex: true,
    sitemap: false,
  },
  {
    path: "/404",
    title: "Page Not Found (404) | Mayuresh Kasar",
    description:
      "The page you are looking for does not exist. Head back to the portfolio home page.",
    heading: "Lost in the grid.",
    noindex: true,
    sitemap: false,
  },
];

export const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const dateOf = (iso) => {
  const parsed = new Date(`${String(iso || "")}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? TODAY
    : parsed.toISOString().slice(0, 10);
};

export const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const canonicalUrl = (routePath) =>
  `${SITE}${routePath === "/" ? "/" : routePath}`;

const routeFile = (routePath) => {
  if (routePath === "/") return "index.html";
  // Directory indexes work on Vercel, Nginx and any static host without a
  // special rewrite for every route. The 404 document is the one exception:
  // platforms look for /404.html.
  if (routePath === "/404") return "404.html";
  return `${routePath.replace(/^\//, "")}/index.html`;
};

export const collectPosts = async () => {
  const files = readdirSync(postsDir)
    .filter((file) => file.endsWith(".js"))
    .sort();
  const posts = [];
  const seen = new Set();

  for (const file of files) {
    const mod = await import(
      pathToFileURL(path.join(postsDir, file)).href
    );
    const data = mod.default || {};
    if (!data.title) continue;

    const slug = slugify(data.slug || data.title || file.replace(/\.js$/, ""));

    if (!slug) {
      throw new Error(`Post ${file} does not produce a usable slug.`);
    }

    if (seen.has(slug)) {
      throw new Error(`Duplicate blog slug: ${slug}`);
    }

    seen.add(slug);
    posts.push({
      title: data.title,
      description: data.description || "",
      slug,
      date: dateOf(data.date),
      updated: data.updated ? dateOf(data.updated) : null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category || "General",
      author: data.author || "Mayuresh Kasar",
    });
  }

  posts.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return posts;
};

const taxonomyRoutes = (posts) => {
  const tags = new Map();
  const categories = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugify(tag);
      if (!slug) continue;
      const previous = tags.get(slug);
      tags.set(slug, {
        name: previous?.name || tag,
        lastmod:
          !previous || post.date > previous.lastmod ? post.date : previous.lastmod,
        count: (previous?.count || 0) + 1,
      });
    }

    const slug = slugify(post.category);
    if (!slug) continue;
    const previous = categories.get(slug);
    categories.set(slug, {
      name: previous?.name || post.category,
      lastmod:
        !previous || post.date > previous.lastmod ? post.date : previous.lastmod,
      count: (previous?.count || 0) + 1,
    });
  }

  const routes = [];

  for (const [slug, meta] of [...tags.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    routes.push({
      path: `/blog/tag/${slug}`,
      file: routeFile(`/blog/tag/${slug}`),
      title: `${meta.name} Tag | Mayuresh Kasar — Full Stack Developer`,
      description: `Technical articles tagged "${meta.name}".`,
      heading: `#${meta.name}`,
      type: "collection",
      lastmod: meta.lastmod,
      priority: 0.5,
      breadcrumb: [
        { name: "Blog", path: "/blog" },
        { name: meta.name, path: `/blog/tag/${slug}` },
      ],
      navLabel: meta.name,
    });
  }

  for (const [slug, meta] of [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    routes.push({
      path: `/blog/category/${slug}`,
      file: routeFile(`/blog/category/${slug}`),
      title: `${meta.name} Articles | Mayuresh Kasar — Full Stack Developer`,
      description: `Technical articles about ${meta.name} development.`,
      heading: meta.name,
      type: "collection",
      lastmod: meta.lastmod,
      priority: 0.5,
      breadcrumb: [
        { name: "Blog", path: "/blog" },
        { name: meta.name, path: `/blog/category/${slug}` },
      ],
      navLabel: meta.name,
    });
  }

  return routes;
};

export const buildRoutePages = (posts = []) => {
  const routes = STATIC_ROUTES.map((route) => ({
    ...route,
    file: routeFile(route.path),
    lastmod: route.lastmod || TODAY,
    changefreq: route.changefreq || "monthly",
    sitemap: route.sitemap !== false,
  }));

  for (const post of posts) {
    routes.push({
      path: `/blog/${post.slug}`,
      file: routeFile(`/blog/${post.slug}`),
      title: post.title,
      description: post.description,
      heading: post.title,
      type: "article",
      date: post.date,
      updated: post.updated || post.date,
      tags: post.tags,
      category: post.category,
      author: post.author,
      lastmod: post.updated || post.date,
      priority: 0.7,
      changefreq: "monthly",
      sitemap: true,
      breadcrumb: [
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ],
    });
  }

  routes.push(...taxonomyRoutes(posts));
  routes.push(
    ...PRIVATE_ROUTES.map((route) => ({
      ...route,
      file: routeFile(route.path),
      lastmod: TODAY,
      priority: 0,
      type: "private",
    }))
  );

  return routes;
};

export const sitemapUrls = (routes) =>
  routes
    .filter((route) => route.sitemap !== false)
    .map((route) => ({
      url: canonicalUrl(route.path),
      lastmod: route.lastmod || TODAY,
      changefreq: route.changefreq || "monthly",
      priority: route.priority ?? 0.5,
    }))
    .sort((a, b) => a.url.localeCompare(b.url));

export const renderSitemap = (urls) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      ({ url, lastmod, changefreq, priority }) =>
        `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

export const renderRss = (posts) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0">\n  <channel>\n` +
  `    <title>MK-PORTFOLIO Technical Blog</title>\n` +
  `    <link>${escapeXml(`${SITE}/blog`)}</link>\n` +
  `    <description>Technical articles about React, Node.js, Vite, Docker and the architecture of the portfolio.</description>\n` +
  `    <language>en</language>\n    <lastBuildDate>${new Date(`${TODAY}T00:00:00Z`).toUTCString()}</lastBuildDate>\n` +
  posts
    .slice(0, 20)
    .map(
      (post) =>
        `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${escapeXml(`${SITE}/blog/${post.slug}`)}</link>\n      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>\n      <guid isPermaLink="true">${escapeXml(`${SITE}/blog/${post.slug}`)}</guid>\n      <description>${escapeXml(post.description)}</description>\n      <category>${escapeXml(post.category)}</category>\n    </item>`
    )
    .join("\n") +
  `\n  </channel>\n</rss>\n`;

const buildJsonLd = (route) => {
  if (route.noindex) return null;

  const url = canonicalUrl(route.path);
  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE}/`,
    name: "Mayuresh Kasar Portfolio",
    publisher: { "@id": PERSON_ID },
    inLanguage: "en",
  };
  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Mayuresh Kasar",
    url: `${SITE}/`,
    jobTitle: "Full Stack Developer",
  };

  const graph = [website, person];

  if (route.type === "article") {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: route.title,
      description: route.description,
      datePublished: route.date,
      dateModified: route.updated || route.date,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      image: `${SITE}/og-cover.jpg`,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      keywords: (route.tags || []).join(", "),
      articleSection: route.category,
      inLanguage: "en",
    });
  }

  graph.push({
    "@type": route.type === "collection" ? "CollectionPage" : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    inLanguage: "en",
  });

  if (route.breadcrumb?.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE}/`,
        },
        ...route.breadcrumb.map((item, index) => ({
          "@type": "ListItem",
          position: index + 2,
          name: item.name,
          item: `${SITE}${item.path}`,
        })),
      ],
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
};

const renderNoscript = (route) => {
  const nav = NAV_LINKS.map(([label, href]) => {
    const current = href === route.path ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join(" · ");

  const meta =
    route.type === "article"
      ? `<p>By ${escapeHtml(route.author || "Mayuresh Kasar")} · ${escapeHtml(route.date || "")}</p>`
      : "";

  return `<noscript>
    <main>
      <h1>${escapeHtml(route.heading || route.title)}</h1>
      <p>${escapeHtml(route.description)}</p>
      ${meta}
      <nav aria-label="Portfolio sections">${nav}</nav>
    </main>
  </noscript>`;
};

const replaceRequired = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) {
    throw new Error(`build-seo: could not find ${label} in dist/index.html.`);
  }

  return html.replace(pattern, () => replacement);
};

const replaceMeta = (html, attribute, name, value) =>
  replaceRequired(
    html,
    new RegExp(`<meta\\s+${attribute}="${name}"[\\s\\S]*?\\/?>`),
    `<meta ${attribute}="${name}" content="${escapeHtml(value)}" />`,
    `${attribute}:${name}`
  );

export const applyRouteMeta = (template, route) => {
  const url = canonicalUrl(route.path);
  const isArticle = route.type === "article";
  const robots = route.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large";

  let html = template;

  html = replaceRequired(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(route.title)}</title>`,
    "title"
  );
  html = replaceMeta(html, "name", "description", route.description);
  html = replaceMeta(html, "name", "robots", robots);
  html = replaceMeta(html, "property", "og:title", route.title);
  html = replaceMeta(html, "property", "og:description", route.description);
  html = replaceMeta(html, "property", "og:url", url);
  html = replaceMeta(
    html,
    "property",
    "og:type",
    isArticle ? "article" : "website"
  );
  html = replaceMeta(html, "name", "twitter:title", route.title);
  html = replaceMeta(html, "name", "twitter:description", route.description);
  html = replaceRequired(
    html,
    /<link rel="canonical"[\s\S]*?\/>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    "canonical"
  );

  if (route.type === "private" && route.path === "/404") {
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>\s*/, "");
  }

  if (isArticle && route.date) {
    html = html.replace(
      "</head>",
      `  <meta property="article:published_time" content="${escapeHtml(route.date)}" />\n` +
        `  <meta property="article:modified_time" content="${escapeHtml(route.updated || route.date)}" />\n` +
        `  <meta property="article:section" content="${escapeHtml(route.category || "")}" />\n</head>`
    );
  }

  if (route.keepHomeGraph) {
    // The homepage graph in index.html is already complete and is kept.
  } else {
    const jsonLd = buildJsonLd(route);
    const script = jsonLd
      ? `<script type="application/ld+json">\n${JSON.stringify(
          jsonLd,
          null,
          2
        ).replace(/</g, "\\u003c")}\n</script>`
      : "";

    html = replaceRequired(
      html,
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      script,
      "JSON-LD"
    );
  }

  html = replaceRequired(
    html,
    /<noscript>[\s\S]*?<\/noscript>/,
    renderNoscript(route),
    "noscript"
  );

  return html;
};

export const renderLlms = (posts, routes) => {
  const indexable = routes.filter((route) => route.sitemap !== false);
  const policyPaths = new Set(["/privacy", "/terms", "/accessibility"]);
  const staticPages = indexable.filter(
    (route) =>
      !route.path.startsWith("/blog/") && !policyPaths.has(route.path)
  );
  const articlePages = indexable.filter((route) => route.type === "article");

  const lines = [
    "# Mayuresh Kasar — Full Stack Developer",
    "",
    "> Personal portfolio, technical blog, and browser-based developer tools for Mayuresh Kasar, a full stack developer in Maharashtra, India. The site documents production work with React, Node.js, Express, MySQL/TiDB, Docker, Linux, and CI/CD.",
    "",
    `Canonical site: ${SITE}/`,
    `Contact: ${CONTACT_EMAIL}`,
    `Source: https://github.com/mayuresh-2601/MK-PORTFOLIO`,
    "",
    "## About",
    "",
    "Mayuresh Kasar builds full stack web applications. The public portfolio describes his projects, technical skills, certificates, and the architecture of this site. The private admin area and API are not public content.",
    "",
    "## Core pages",
    "",
    ...staticPages
      .filter((route) => route.path !== "/")
      .map(
        (route) =>
          `- [${route.heading || route.title}](${canonicalUrl(route.path)}): ${route.description}`
      ),
    "",
    "## Articles",
    "",
    ...(articlePages.length
      ? articlePages.map(
          (route) =>
            `- [${route.title}](${canonicalUrl(route.path)}): ${route.description}`
        )
      : ["- No articles are published yet."]),
    "",
    "## Policies",
    "",
    `- [Privacy](${SITE}/privacy): what the contact form stores and how to request deletion.`,
    `- [Terms](${SITE}/terms): acceptable use of the site and its tools.`,
    `- [Accessibility](${SITE}/accessibility): accessibility target and known limitations.`,
    "",
    "## Notes for AI systems",
    "",
    "- Use the canonical URLs above when citing pages.",
    "- Do not infer employers, salary, availability, or personal details that are not stated on the site.",
    "- The JWT decoder is a local inspection tool. It does not verify signatures.",
    "- Hashing, timestamp, UUID and contrast tools run locally in the browser.",
    "- The admin area and `/api/` are private and excluded from robots.txt.",
    `- Security reports: ${SITE}/.well-known/security.txt`,
    "",
    `Generated: ${TODAY}`,
    "",
  ];

  return lines.join("\n");
};

const main = async () => {
  const templatePath = path.join(distDir, "index.html");

  if (!existsSync(templatePath)) {
    throw new Error(
      "build-seo: dist/index.html is missing. Run `vite build` first."
    );
  }

  const template = readFileSync(templatePath, "utf8");
  const posts = await collectPosts();
  const routes = buildRoutePages(posts);

  for (const route of routes) {
    const output = path.join(distDir, route.file);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, applyRouteMeta(template, route));
  }

  const urls = sitemapUrls(routes);

  writeFileSync(path.join(distDir, "sitemap.xml"), renderSitemap(urls));
  writeFileSync(path.join(distDir, "rss.xml"), renderRss(posts));
  writeFileSync(path.join(distDir, "llms.txt"), renderLlms(posts, routes));

  process.stdout.write(
    `build-seo: ${posts.length} blog posts, ${urls.length} sitemap URLs, ${routes.length} route documents\n`
  );
};

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  await main();
}
