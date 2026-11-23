export default {
  slug: "how-i-built-my-full-stack-developer-portfolio",
  title: "How I Built My Full Stack Developer Portfolio",
  description:
    "The architecture behind MK-PORTFOLIO: a React + Vite front end, an Express + MySQL API, cookie sessions, Docker, and CI/CD — and the engineering decisions that hold it together.",
  date: "2026-11-21",
  tags: ["Full Stack", "Architecture", "React", "Node.js"],
  category: "Full Stack",
  featured: true,
  blocks: [
    {
      type: "p",
      text: "This portfolio is not a static brochure. It is a running full stack application: a React single-page app on Vercel, an Express API on Render, a MySQL-compatible database, and a CI pipeline that scans every push. This article records the architecture as it exists in the repository, so the decisions can be reviewed rather than guessed.",
    },
    { type: "h2", id: "objectives", text: "Objectives that shaped the build" },
    {
      type: "list",
      ordered: false,
      items: [
        "Keep the public site fast and fully static where possible.",
        "Keep every secret on the server; the browser never holds an API key.",
        "Make the admin area unreachable from search results and public sitemaps.",
        "Make every state change testable without a running database.",
      ],
    },
    {
      type: "p",
      text: "Those constraints push the design in a clear direction: the front end is a client-rendered SPA that talks to a small JSON API, and the API owns validation, rate limiting, sessions and email.",
    },
    { type: "h2", id: "architecture", text: "System architecture" },
    {
      type: "p",
      text: "The browser loads a Vite bundle from Vercel. Requests to /api are rewritten by Vercel to the Render origin, so the browser only ever talks to one host. The API validates the environment at boot, refuses to start when required production variables are missing, and returns JSON only.",
    },
    {
      type: "code",
      lang: "text",
      code: "Browser ──HTTPS──▶ Vercel (React SPA)\n                    │  /api/* rewrite\n                    ▼\n             Render (Express API)\n                    │\n                    ▼\n             MySQL / TiDB",
    },
    { type: "h2", id: "security", text: "Security boundaries" },
    {
      type: "list",
      ordered: false,
      items: [
        "Admin authentication uses a bcrypt password hash plus revocable cookie sessions with absolute and idle timeouts.",
        "Optional TOTP MFA is supported through ADMIN_TOTP_SECRET.",
        "State-changing requests must pass a trusted-origin check in addition to the session cookie.",
        "Uploads are validated by signature, and a ClamAV hook is used when CLAMAV_HOST is configured.",
        "Every API response carries X-Robots-Tag: noindex, nofollow.",
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "Design rule",
      text: "The front end is treated as untrusted. Authorization is never decided in the browser.",
    },
    { type: "h2", id: "testing", text: "Testing without a live database" },
    {
      type: "p",
      text: "The server test suite uses Node's built-in test runner, so it adds no dependency. Tests cover authentication, session configuration, CORS and origin rules, pagination, message validation, spam guards, email transport selection, upload signatures and environment validation.",
    },
    { type: "h2", id: "deployment", text: "Deployment pipeline" },
    {
      type: "p",
      text: "GitHub Actions runs lint, build, unit tests, Docker builds, dependency and infrastructure scans, container image scans, secret detection and a ZAP baseline scan. Dependabot opens pull requests for dependency updates. The site and API deploy independently, so a content change never requires an API restart.",
    },
    { type: "h2", id: "lessons", text: "Lessons learned" },
    {
      type: "list",
      ordered: false,
      items: [
        "Validate configuration at boot. A missing variable should fail the deploy, not the first user request.",
        "Keep the public site and the API on separate deploy pipelines.",
        "Make the admin surface invisible to crawlers at three layers: robots.txt, response headers and sitemap exclusion.",
        "Write tests for the failure paths — invalid input, expired sessions, disallowed origins — not just the happy path.",
      ],
    },
  ],
};
