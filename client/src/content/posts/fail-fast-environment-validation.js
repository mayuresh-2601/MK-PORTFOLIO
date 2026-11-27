export default {
  slug: "fail-fast-environment-validation",
  title: "Fail Fast: Validating the Server Environment Before It Serves Traffic",
  description:
    "A practical look at MK-PORTFOLIO's startup validation: required variables, placeholders, production-only auth rules, session bounds, trusted origins, and why optional integrations warn instead of blocking the boot.",
  date: "2026-11-25",
  tags: ["Node.js", "Configuration", "Deployment", "Security"],
  category: "DevOps",
  blocks: [
    {
      type: "p",
      text: "The most expensive configuration bug is the one that lets the process start. A missing database host or a malformed admin hash usually does not stop Node.js from listening. It waits until a user opens a page or an administrator tries to log in, and then it fails with a less useful error. server/config/validateEnv.js exists to move that failure to the first second of process life.",
    },
    {
      type: "p",
      text: "server.js calls validateEnvironment before it creates the session cleanup timer, binds a port, or registers routes. Warnings are printed. If any errors are returned, every error is printed and the process exits with code 1.",
    },
    {
      type: "code",
      lang: "js",
      code: "const validation = validateEnvironment({\n  production: isProduction,\n});\n\nvalidation.warnings.forEach((warning) => {\n  console.warn(`⚠️ ${warning}`);\n});\n\nif (validation.errors.length > 0) {\n  validation.errors.forEach((error) => {\n    console.error(`❌ ${error}`);\n  });\n\n  process.exit(1);\n}",
    },
    {
      type: "callout",
      variant: "note",
      title: "The process fails, not the request",
      text: "A deployment that cannot validate its configuration should not accept traffic. On Render the container exits, the platform marks the deploy unhealthy, and the old healthy instance can keep serving. That is safer than discovering the problem at the first login.",
    },
    { type: "h2", id: "required", text: "Required is not the same as present" },
    {
      type: "p",
      text: "The validator checks that DB_HOST, DB_USER, DB_NAME and ADMIN_EMAIL are non-empty, and that DB_PASSWORD is defined. An empty database password is valid for a local MySQL container, so the password check distinguishes undefined from empty. A blank value for the other variables is missing.",
    },
    {
      type: "p",
      text: "Presence alone is not enough. The placeholder check rejects values beginning with your-, replace-, change-me, paste- or example. Without that check a deployment can boot with DB_HOST=your-db-host and then fail later in the pool. Credential and database errors name the variable, never its value.",
    },
    {
      type: "code",
      lang: "js",
      code: "const PLACEHOLDER_PATTERN =\n  /^(your[-_]|replace[-_]|change[-_]?me|paste[-_]|example)/i;\n\nif (\n  hasValue(process.env.DB_HOST) &&\n  isPlaceholder(process.env.DB_HOST)\n) {\n  errors.push(\n    \"DB_HOST is still a placeholder. Set your TiDB or MySQL host.\"\n  );\n}",
    },
    {
      type: "p",
      text: "Ports and limits are checked as integers in their real ranges. PORT and DB_PORT must be between 1 and 65535, DB_CONNECTION_LIMIT between 1 and 20, and DB_SSL must be a boolean spelling such as true, false or 1. These checks catch the difference between 3306 and \"3306 \" plus a unit mix-up.",
    },
    { type: "h2", id: "auth", text: "Production auth gets stricter rules" },
    {
      type: "p",
      text: "Admin authentication is validated by validateAdminAuthConfig, called from the same startup pass. An email must be present and valid, and example addresses are rejected. A plaintext ADMIN_PASSWORD is allowed only outside production; in production the deployment must supply a bcrypt ADMIN_PASSWORD_HASH. The hash is checked against the bcrypt format before it can reach the login controller.",
    },
    {
      type: "p",
      text: "The validator also warns when both a hash and a plain password are set, because the hash takes precedence and the extra value is ambiguous. Optional TOTP adds another validated field: if ADMIN_TOTP_SECRET is present, it must decode as a valid base32 secret. Missing MFA in production is a warning, not a fatal error; it is a security improvement, not a dependency of the session flow.",
    },
    {
      type: "p",
      text: "Keeping these checks next to the credential helpers matters. A startup check that reimplements the bcrypt regular expression can drift from the one the login path uses. Here both the boot check and the login path share the same adminAuth module.",
    },
    { type: "h2", id: "sessions", text: "Session settings have dependencies" },
    {
      type: "p",
      text: "The session validator enforces more than numeric ranges. SESSION_TTL_MINUTES and SESSION_IDLE_MINUTES must be integers from 5 to 1440, and the idle window cannot exceed the absolute lifetime. SESSION_RETENTION_DAYS is limited to 1 through 90. Without those relationships, a session could have an idle timeout longer than its own expiry, which makes the policy confusing and the tests weaker.",
    },
    {
      type: "p",
      text: "SESSION_COOKIE_SECURE must be a boolean spelling. It defaults to true in production but is allowed to be false for the local Docker stack, which runs over plain HTTP. If SESSION_COOKIE_SAMESITE is none, Secure is mandatory; the validator rejects the combination before the browser does. Lax is the default in every environment.",
    },
    {
      type: "code",
      lang: "dotenv",
      code: "SESSION_TTL_MINUTES=120\nSESSION_IDLE_MINUTES=30\nSESSION_RETENTION_DAYS=7\nSESSION_COOKIE_SECURE=true\nSESSION_COOKIE_SAMESITE=lax",
    },
    {
      type: "p",
      text: "CLIENT_URL is parsed as an origin, not trusted as a string. Production requires HTTPS except for localhost, which is allowed for Docker and CI smoke tests with a warning. A path, query or hash produces a warning because a browser origin cannot contain them. Duplicate origins are reported. These rules feed the CORS allowlist and the trusted-origin check that protects state-changing requests.",
    },
    { type: "h2", id: "optional", text: "Optional integrations must not block browsing" },
    {
      type: "p",
      text: "Email, Cloudinary and Gemini are optional. The validator warns when EMAIL_TRANSPORT=auto finds no email configuration, when Cloudinary has only some of its three credentials, or when a key still contains a placeholder. That matches the runtime contract: contact messages are persisted before email is attempted, and image or AI failures cannot break public reads.",
    },
    {
      type: "p",
      text: "Explicit selection is different from automatic fallback. EMAIL_TRANSPORT=gmail-api without a Gmail client ID, secret and refresh token is an error. EMAIL_TRANSPORT=smtp without a user and password is an error. The deployment asked for a transport that cannot work, so starting anyway would be misleading.",
    },
    {
      type: "p",
      text: "One warning is platform-specific: Render's free web services block outbound SMTP ports. The validator notices when SMTP is selected on Render and points to Gmail API over HTTPS. It remains a warning because the rest of the application can still run, but it prevents a silent assumption that notifications are being delivered.",
    },
    { type: "h2", id: "tests", text: "The checks are themselves tested" },
    {
      type: "p",
      text: "server/tests/validateEnv.test.js changes a controlled environment and calls validateEnvironment directly. It covers placeholder values, missing names, invalid ports, session bounds, unsafe cookie combinations, production password rules and optional-integration warnings. The tests do not require a database or a network, so they run in CI before the Docker stack starts.",
    },
    {
      type: "p",
      text: "The Docker job then proves the complementary case: a real server process boots with the generated CI values and serves the API. Unit tests verify the decision table; the container verifies that the decision table is wired into startup.",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Validate before listening, not on the first request.",
        "Report the variable name and the rule, never the secret value.",
        "Reject placeholders even when the variable is non-empty.",
        "Share auth validation with the code that verifies credentials.",
        "Treat optional integrations as warnings, but reject an explicitly impossible transport.",
        "Test both the validation function and the real boot path.",
      ],
    },
    { type: "h2", id: "checklist", text: "A deployment checklist that follows from this" },
    {
      type: "list",
      ordered: true,
      items: [
        "Generate a disposable environment file for CI; never reuse production credentials.",
        "Run the validator's unit tests before building images.",
        "Start the real container and wait for a readiness endpoint that includes the database.",
        "Read the warning list; a green process can still have optional features disabled.",
        "Rotate a credential if it was ever printed in logs, a shell history or a chat message.",
        "When an integration changes, update both the environment template and this validation.",
      ],
    },
    {
      type: "p",
      text: "Fail-fast validation does not make a deployment correct by itself. It makes incorrect configuration visible at the boundary where it can still be fixed. The rest of the work is keeping the rules honest when the application changes.",
    },
  ],
};
