export default {
  slug: "docker-compose-bcrypt-hash-ci-failure",
  title: "The Docker CI Bug That Broke a bcrypt Hash",
  description:
    "A real GitHub Actions failure caused by Docker Compose interpolating the dollar signs in a bcrypt hash, and the single-quote fix that keeps the credential intact.",
  date: "2026-11-24",
  tags: ["Docker", "CI/CD", "GitHub Actions", "Debugging"],
  category: "DevOps",
  blocks: [
    {
      type: "p",
      text: "The CI run had already installed dependencies, linted the client, checked the server, and built the Docker images. Then the API container exited during startup. The application code was fine. Docker Compose had changed one environment value before the Node process ever read it.",
    },
    { type: "h2", id: "symptom", text: "The symptom: a container that would not stay up" },
    {
      type: "p",
      text: "The local stack runs the API with NODE_ENV=production. In that mode the server requires ADMIN_PASSWORD_HASH, a bcrypt hash, instead of a plaintext ADMIN_PASSWORD. The hash was written into server/.env by the CI job, the compose stack was started, and the wait-for-services step never saw a healthy API.",
    },
    {
      type: "p",
      text: "The failure was loud but not mysterious once the resolved environment was inspected. A bcrypt hash uses dollar signs as separators: the algorithm and cost prefix $2b$12$ is followed by the salt and hash. Compose read the characters after the third dollar sign as a variable name. In the CI hash, the leading alphanumeric run of the salt was replaced with an empty string, so the value the server received was no longer a valid bcrypt hash.",
    },
    {
      type: "code",
      lang: "text",
      code: "expected:  $2b$12$<salt-and-hash>\nafter:     $2b$12<leading salt removed><rest of salt-and-hash>",
    },
    {
      type: "p",
      text: "The server's startup validation rejected the malformed hash and exited with code 1. That is the correct behavior: it is better for a deployment to stop than to accept a credential it cannot verify.",
    },
    { type: "h2", id: "compose", text: "Why Compose parsed a credential" },
    {
      type: "p",
      text: "Docker Compose performs variable substitution on values read from an env_file. The substitution rules are the same ones used in compose.yaml: a dollar sign followed by a valid variable name is replaced by that variable's value. Variable names cannot start with a digit, so $2b and $12 remained literal text. The characters after the third dollar sign began with letters, so Compose treated that leading run as a variable name and substituted it.",
    },
    {
      type: "p",
      text: "In a disposable test with Compose v5.7.0, the unquoted value produced a warning that the variable read from the start of the salt was not set and would default to a blank string. The printed config was even more confusing: Compose displays literal dollar signs as $$ in its own YAML output, so the value looked almost correct while the leading salt characters were already gone.",
    },
    {
      type: "code",
      lang: "dotenv",
      code: "# server/.env (CI-only values)\nADMIN_EMAIL=ci-admin@portfolio.test\nADMIN_PASSWORD_HASH=$2b$12$<salt-and-hash>",
    },
    {
      type: "callout",
      variant: "note",
      title: "The important distinction",
      text: "The hash is data. Compose treats it as a template. Any environment value containing a dollar sign has to survive Compose's substitution pass before the application sees it.",
    },
    { type: "h2", id: "fix", text: "The fix: quote the value, not the hash" },
    {
      type: "p",
      text: "The fix in commit d27983f wraps the value in single quotes inside the generated env file. Compose strips the quotes and preserves the dollar signs as literal characters. No escaping is added to the hash itself, so the value the server validates is the value bcrypt produced.",
    },
    {
      type: "code",
      lang: "dotenv",
      code: "# server/.env (CI-only values)\nADMIN_EMAIL=ci-admin@portfolio.test\nADMIN_PASSWORD_HASH='$2b$12$<salt-and-hash>'",
    },
    {
      type: "p",
      text: "The CI job creates this file with a quoted heredoc (<<'EOF'), so the shell does not expand anything either. The single quotes belong to the env-file syntax and are not part of the hash. Compose also supports dollar-sign escaping with $$, but quoting the whole value is easier to read and harder to get partially wrong.",
    },
    { type: "h2", id: "guardrails", text: "The guardrails that turned a bug into a safe failure" },
    {
      type: "list",
      ordered: false,
      items: [
        "The server validates ADMIN_PASSWORD_HASH against the bcrypt format before it listens for traffic.",
        "NODE_ENV=production rejects a plaintext ADMIN_PASSWORD, so a broken hash cannot silently fall back to a simpler path.",
        "Startup errors exit the process instead of serving requests with unusable credentials.",
        "The CI workflow now prints docker compose ps and the stack logs when startup fails, so the next failure is diagnosable from the run page.",
        "The server image is checked to ensure server/.env was not baked into it.",
      ],
    },
    {
      type: "p",
      text: "The failure mode was still a failed pipeline, not a vulnerable deployment. That matters: configuration errors should surface at the boundary between the build and the running service, not on the first admin login.",
    },
    { type: "h2", id: "checklist", text: "A practical checklist" },
    {
      type: "list",
      ordered: true,
      items: [
        "Quote any env-file value that contains a dollar sign: bcrypt and Argon2 hashes, generated secrets, connection strings and signed tokens.",
        "Keep CI credentials disposable. The hash in this workflow belongs to a test-only password and is never used by the production service.",
        "Validate the value's shape at startup. A regular expression catches corruption before a login attempt does.",
        "Do not print the resolved secret while debugging. Check the structure, the length and the validation result instead.",
        "Exercise the real login path in CI so a hash that parses but does not match is caught too.",
      ],
    },
    {
      type: "p",
      text: "The pipeline now builds the image, starts the stack, logs in with the CI identity, checks the HttpOnly cookie, performs a CSRF-protected update, logs out and confirms the old session is dead. The bcrypt bug is fixed, but the larger lesson is that a credential passing through a configuration layer is still a code path that needs a test.",
    },
  ],
};
