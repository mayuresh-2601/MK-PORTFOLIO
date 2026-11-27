export default {
  slug: "static-seo-and-real-404s-in-a-react-spa",
  title: "Static SEO Documents and Real 404s in a React SPA",
  description:
    "How MK-PORTFOLIO builds a route-specific HTML document for every public page, blog post and taxonomy page, while keeping unknown URLs as real HTTP 404s instead of soft 200s.",
  date: "2026-11-22",
  tags: ["React", "Vite", "SEO", "Vercel"],
  category: "Frontend",
  blocks: [
    {
      type: "p",
      text: "A client-rendered React application normally ships one HTML file. Every path is answered with that file and the router decides what to render after JavaScript loads. It is simple, but it has two visible consequences: every URL looks identical to a crawler that does not execute JavaScript, and a mistyped URL can return HTTP 200 with a \"not found\" screen. This site does not do that.",
    },
    {
      type: "p",
      text: "The frontend is still a React SPA, but the production build writes a separate HTML document for each public route. The document contains route-specific metadata and a small no-JavaScript summary. Unknown paths still return HTTP 404. The implementation sits in client/scripts/build-seo.mjs and runs after Vite on every build.",
    },
    { type: "h2", id: "problem", text: "The soft-404 problem" },
    {
      type: "p",
      text: "A typical SPA host configuration rewrites every path to /index.html. The response status is 200 because the server found index.html. React then renders the 404 component. A person sees a missing-page screen, but an HTTP client sees a successful page. Search engines call this a soft 404, and it also makes uptime checks and link checkers unreliable.",
    },
    {
      type: "code",
      lang: "json",
      code: "// The tempting configuration\n{\n  \"rewrites\": [\n    { \"source\": \"/(.*)\", \"destination\": \"/index.html\" }\n  ]\n}",
    },
    {
      type: "p",
      text: "client/vercel.json does not contain that catch-all. Its only rewrite is /api/* to the Render API, and tests assert that the catch-all stays absent. Public routes are served as real files generated at build time.",
    },
    { type: "h2", id: "build", text: "What the build generates" },
    {
      type: "p",
      text: "npm run build executes vite build and then node scripts/build-seo.mjs. The script reads dist/index.html as a template, imports the plain-data blog modules, and writes route documents into directories:",
    },
    {
      type: "code",
      lang: "text",
      code: "dist/\n  index.html\n  about/index.html\n  blog/index.html\n  blog/how-i-built-my-full-stack-developer-portfolio/index.html\n  blog/tag/docker/index.html\n  blog/category/devops/index.html\n  404.html\n  sitemap.xml\n  rss.xml\n  llms.txt",
    },
    {
      type: "p",
      text: "Each route document replaces the shared title, description, robots directive, canonical URL, Open Graph tags, Twitter tags and JSON-LD graph for that route. Blog posts also get article publication and modification timestamps plus a BlogPosting object. The /admin route is marked noindex and excluded from the sitemap.",
    },
    {
      type: "p",
      text: "The NoScript block is replaced with a page-specific heading, description, author and date for articles, plus links to the main sections. That does not make the site server-rendered: the React tree still hydrates from the same bundle. It gives a crawler, a reader with JavaScript disabled, and a preview bot something accurate to read instead of the homepage's boilerplate.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Metadata prerendering, not SSR",
      text: "The HTML contains the right head tags and a summary. It does not contain the full interactive page. React still renders the interface after the bundle loads, and the article's own metadata is not fetched from a database at request time.",
    },
    { type: "h2", id: "vercel", text: "How Vercel serves the files" },
    {
      type: "p",
      text: "vercel.json sets cleanUrls to true and trailingSlash to false. A request for /about resolves to the about/index.html directory index without a visible trailing slash. A request for /blog/tag/docker resolves to that tag's document. No path rewriting is needed for public routes.",
    },
    {
      type: "p",
      text: "The /404 route is the exception to the directory-index convention: build-seo writes it as 404.html because static hosts look for that filename. Vercel serves 404.html with HTTP 404 for an unknown path. The production smoke job checks that /this-route-does-not-exist returns 404, so a future rewrite cannot silently turn it back into a soft 404.",
    },
    {
      type: "p",
      text: "There is an important limit to be honest about. Once the SPA has loaded, clicking a client-side link is not a new document request. If React's router shows its 404 screen after navigation, the original document already returned 200 and JavaScript cannot change that status. The real 404 applies to direct requests and crawlers, which is where the status code matters.",
    },
    { type: "h2", id: "local", text: "Docker uses a different rule on purpose" },
    {
      type: "p",
      text: "The local Nginx container serves the same build with try_files $uri $uri/index.html /index.html. That final fallback keeps the admin dashboard and client-side routes working when a path does not have a generated document, for example during local development. It does not claim that unknown local URLs are 404s. Production and local preview intentionally have different failure behavior.",
    },
    {
      type: "code",
      lang: "nginx",
      code: "location / {\n  try_files $uri $uri/index.html /index.html;\n}",
    },
    {
      type: "p",
      text: "The static route documents are not an invitation to add app routes without telling the build. A new public route needs an entry in the STATIC_ROUTES array in build-seo.mjs. Blog posts and taxonomy pages are discovered from the content modules. A route that exists only in App.jsx will work after a client-side click but will not have its own canonical document or sitemap entry.",
    },
    { type: "h2", id: "discovery", text: "Sitemap, RSS and llms.txt are build output" },
    {
      type: "p",
      text: "The same script writes sitemap.xml, rss.xml and llms.txt. The sitemap excludes /admin, /404 and anything marked sitemap: false. Blog posts and their tag and category pages are included automatically because they are derived from the post data. RSS contains the latest 20 posts with RFC 822 dates. llms.txt lists the core pages, articles, policies and security notes for AI crawlers.",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "One canonical URL per route, generated from the route path.",
        "No private admin route in the sitemap or the AI summary.",
        "No catch-all rewrite on Vercel.",
        "A real 404 document checked by production smoke tests.",
        "A no-JavaScript summary for every public route.",
        "Tests for route generation, metadata replacement, sitemap escaping and the no-catch-all rule.",
      ],
    },
    { type: "h2", id: "checklist", text: "What to verify after deployment" },
    {
      type: "list",
      ordered: true,
      items: [
        "Fetch a new article URL and confirm its title, canonical and description are in the response HTML, not only in the hydrated DOM.",
        "Fetch a nonexistent URL and confirm the status is 404, not 200.",
        "Fetch /sitemap.xml and check that the new route appears exactly once.",
        "Fetch /admin and confirm X-Robots-Tag: noindex, nofollow.",
        "Confirm the static build log reports the expected post, route-document and sitemap counts.",
      ],
    },
    {
      type: "p",
      text: "This approach is not a substitute for rendering content on the server when a page needs request-time data. It is a narrow, testable improvement for a site whose public content is known at build time. The trade-off is explicit: one extra document per route, in exchange for correct metadata and honest status codes.",
    },
  ],
};
