export default {
  slug: "react-and-vite-architecture-for-a-portfolio-spa",
  title: "React and Vite Architecture for a Portfolio SPA",
  description:
    "How the front end of MK-PORTFOLIO is structured: Vite for the toolchain, React Router for navigation, Tailwind CSS for styling, and a strict separation between presentational pages and data hooks.",
  date: "2026-11-21",
  tags: ["React", "Vite", "Frontend", "Architecture"],
  category: "Frontend",
  blocks: [
    {
      type: "p",
      text: "The front end is a client-rendered single-page application built on React 18, Vite 6 and React Router 7. Tailwind CSS 4 supplies the styling through the Vite plugin. The stack was chosen for a small, well-defined scope: a public showcase plus an admin dashboard that rarely changes.",
    },
    { type: "h2", id: "why-vite", text: "Why Vite, not a heavy framework" },
    {
      type: "p",
      text: "Vite gives near-instant starts during development, code splitting out of the box, and a small, inspectable bundle. For a portfolio the advantages matter more than in a large app: every page load is fast and the debugging experience is simple. The trade-offs — client-side navigation and no SSR — are managed by a good sitemap and page metadata, and are the reason this article exists.",
    },
    { type: "h3", text: "Render-blocking resources" },
    {
      type: "p",
      text: "Vite extracts JavaScript and CSS into the dist directory. index.html references the hashed bundle. The fonts are self-hosted with @fontsource, so no third-party font requests are made at runtime.",
    },
    {
      type: "h2", id: "why-tailwind", text: "Why Tailwind CSS" },
    {
      type: "list",
      ordered: false,
      items: [
        "One utility library keeps the design system consistent with minimal custom CSS.",
        "No style conflicts with the SPA shell, because styles are class-based.",
        "Smaller CSS bundles than most CSS frameworks, because unused classes are tree-shaken.",
      ],
    },
    { type: "h2", id: "routing", text: "Routing and navigation" },
    {
      type: "p",
      text: "React Router provides BrowserRouter. Every public route mounts its page component and applies its own metadata through a shared SEO component. The router scrolls to the top on route changes and keeps a skip-to-content link.",
    },
    { type: "h3", text: "Active states and accessibility" },
    {
      type: "p",
      text: "Nav links mark the current page with aria-current=\"page\", and focus states are visible. Admin links are rendered only when a cosmetic hint is present, and hidden from the navbar and footer on public routes.",
    },
    { type: "h2", id: "data-flow", text: "Data flow from page to API" },
    {
      type: "p",
      text: "Pages import from src/api/axios.js, which centralises the base URL and error handling. Requests go through the same-origin /api path, which Vercel rewrites to Render. This means the browser never knows the API origin, which makes the API free to move.",
    },
    {
      type: "code",
      lang: "text",
      code: "page.jsx\n  ↓ uses\n  src/api/axios.js  ──fetch──▶  https://api.example/api/...\n                                   ▲\n                                   │ rewrite: /api/*\n                                   └──▶  https://api.example.com/api/...",
    },
    { type: "h2", id: "hooks", text: "Hooks and shared state" },
    {
      type: "list",
      ordered: true,
      items: [
        "usePaginatedList — generic pagination for projects, skills and certificates.",
        "useScrollReveal — animates elements in when they enter the viewport.",
        "SEO component — writes title, description, canonical and social tags per route.",
      ],
    },
    { type: "h2", id: "performance", text: "Performance in practice" },
    {
      type: "p",
      text: "Images are static assets with stable URLs. The bundle is split by Vite's chunking. Lazy-loading is used for below-the-fold sections on the homepage, and the system page polls a cached health endpoint.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "Keep the shell small",
      text: "A small app shell loads faster. If a page grows large, split it into routes rather than enlarging one file.",
    },
  ],
};
