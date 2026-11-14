# MCP (Model Context Protocol) Position

**Product:** Mayuresh Kasar Portfolio ("MAYURESH.DEV")
**Document owner:** Mayuresh Kasar
**Status:** Current state + approval policy
**Version:** 1.0
**Last updated:** 2026-11-14
**Related:** [AGENTS.md](./AGENTS.md) · [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) · [INTEGRATIONS.md](./INTEGRATIONS.md)

---

## 1. Current state

**No MCP server is configured for this project.**

Verified on 2026-11-14:

| Check | Result |
|---|---|
| Repository MCP config (`mcp.json`, `.mcp.json`, `opencode.json`, `opencode.jsonc`) | None found |
| MCP resources exposed to the current coding agent | None |
| MCP resource templates exposed | None |
| MCP server in the application runtime | None |
| MCP dependency in `client/package.json` or `server/package.json` | None |

This is intentional. The portfolio is a web application, not an agent platform. MCP would add tool access for a coding assistant; it would not add a product feature, and nothing in the product currently needs it.

## 2. What MCP is

The Model Context Protocol is a standard way for an AI client to discover and call external tools and read external resources through a server. An MCP server can expose, for example:

- filesystem read/write;
- database queries;
- GitHub issues and pull requests;
- browser automation;
- cloud provider actions;
- internal documentation search.

MCP is powerful precisely because it extends what an agent can reach. That makes it a security boundary, not a convenience toggle.

## 3. Why nothing is configured

1. **No approved use case.** The agent already has repository read/write, shell, browser, and documentation tools for this task. No gap has been demonstrated that requires MCP.
2. **Least privilege.** Every MCP server is another credential holder and another network path. Adding one without a concrete need increases risk without product value.
3. **Production safety.** A database or cloud MCP server could mutate production data. The current workflow deliberately keeps destructive operations behind explicit owner approval.
4. **Supply chain.** MCP servers are third-party code. They need the same review as any dependency, plus an assessment of what data they can read and where it is sent.
5. **Documentation honesty.** Claiming MCP support without a configured, tested server would be misleading. This document records the real state.

## 4. What MCP is not used for

- It is not part of the portfolio's runtime architecture.
- It is not required for the public site, admin dashboard, API, database, AI explainers, or deployment.
- It is not a substitute for the existing health checks, logs, or CI pipeline.
- It is not a way to bypass the approval rules in [AGENTS.md](./AGENTS.md).

## 5. Approval policy

Adding an MCP server requires **explicit, written owner approval** before any configuration is created. The proposal must state:

| Item | Required detail |
|---|---|
| Purpose | The concrete task that cannot be done safely with existing tools |
| Server | Name, publisher, source repository, version/commit |
| Transport | stdio or HTTP; local or remote |
| Capabilities | Every tool/resource it exposes; which ones will be enabled |
| Permissions | Read-only vs write; filesystem paths; database scope; cloud scope |
| Credentials | Which secret, where stored, how scoped, rotation plan |
| Data flow | What data leaves the machine and to which endpoint |
| Network | Required hosts/ports; whether outbound access is allowed |
| Logging | What the server logs; whether prompts or file contents are retained |
| Failure mode | What happens when the server is down or misbehaves |
| Kill switch | How to disable it immediately |
| Removal | How to uninstall and revoke credentials |
| Owner | Who is accountable |

Approval is per server and per capability set. Adding a new tool to an approved server is a new approval.

## 6. Security requirements for any future MCP server

### 6.1 Least privilege

- Prefer read-only tools.
- Scope filesystem access to this repository, never the home directory or entire drive.
- Scope database access to a read-only user and, if possible, a staging database.
- Never grant production write access without a separate, explicit approval and a backup.
- Do not expose environment variables, `.env` files, credential stores, browser profiles, or SSH keys.

### 6.2 Credentials

- Store secrets in the MCP client's secret mechanism or the OS credential store, not in a committed config file.
- Use short-lived, scoped tokens where the provider supports them.
- Never reuse the production `JWT_SECRET`, database password, Cloudinary secret, Gemini key, or Render API key.
- Treat any secret printed in tool output as exposed and rotate it.

### 6.3 Network and supply chain

- Pin the server version or commit.
- Review the server's dependencies and install scripts.
- Restrict outbound network access to the documented hosts.
- Do not run an unverified server with broad filesystem or shell access.
- Prefer a local stdio server over a remote server when the task allows it.

### 6.4 Logging and privacy

- Assume prompts, tool arguments, and tool results may be logged by the server or provider.
- Do not send contact messages, admin credentials, tokens, or production data through an MCP tool.
- Do not allow an MCP server to persist conversation content unless the owner approves retention.

### 6.5 Human control

- High-impact actions (deploy, delete, migrate, rotate credentials) must remain manual or require an explicit confirmation step.
- The agent must not chain an MCP write action into a production deploy without approval.
- A kill switch must be documented and tested.

## 7. Candidate use cases and verdicts

These are examples, not approvals.

| Candidate | Value | Verdict |
|---|---|---|
| Read-only GitHub MCP for issues/PRs | Convenient, but GitHub REST already works via git credentials | Not needed now |
| Read-only filesystem MCP | Redundant with the coding agent's repository tools | Not needed |
| Database MCP for schema inspection | Useful for large schemas; this schema is four tables and documented | Not needed now |
| Browser automation MCP | The agent already has browser tools for live verification | Not needed |
| Cloudinary admin MCP | Could inspect assets, but expands media-account access | Defer; rotate credentials first |
| Render/Vercel admin MCP | High-impact deploy control | Reject without strict approval and guardrails |
| Search Console MCP | Could submit sitemaps; requires owner OAuth | Defer to manual console work |
| Documentation search MCP | The docs are small and local | Not needed |

## 8. If MCP is approved later

Follow this sequence:

1. Record the approval and scope in this document.
2. Create the server configuration **outside** version control unless it contains no secrets and the team explicitly wants it shared.
3. Add the server with the minimum capability set.
4. Verify the tool list matches the approval; remove anything unexpected.
5. Test read-only behavior first.
6. Test the kill switch.
7. Document the exact configuration location, owner, and rotation steps.
8. Add a note to [AGENTS.md](./AGENTS.md) so future agents know the server exists and what it may touch.
9. Review after 30 days; remove it if it is not used.

### Configuration hygiene

- Do not commit tokens, headers, or connection strings.
- If a project-level config is used, keep secrets in environment references, not literals.
- Do not commit generated MCP caches or logs.
- Keep the config minimal; do not enable every tool a server offers.

## 9. Verification commands

There is nothing to verify today because no server exists. If one is added, verify:

```bash
# Confirm no MCP config or secrets were committed
git ls-files | grep -iE 'mcp|opencode' || true

# Confirm the app does not depend on MCP
grep -R "modelcontextprotocol\|mcp" client/package.json server/package.json || true
```

Also confirm in the MCP client that only the approved tools are listed and that the server cannot read `.env` or production credentials.

## 10. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-11-14 | No MCP server configured | No approved use case; existing tools cover the work; minimize attack surface |
| 2026-11-14 | Manual approval required for future MCP | MCP expands agent access and credential exposure |

## 11. Open questions

1. Is there a recurring task that existing tools genuinely cannot handle?
2. Would a read-only server provide enough value to justify another dependency?
3. Who owns credential rotation and incident response for the server?
4. Should MCP configuration be per-project or per-user?
5. What is the acceptable data-retention behavior of the chosen server?

Until these are answered and approved, the answer to "Can we add MCP?" is **no, not yet**.
