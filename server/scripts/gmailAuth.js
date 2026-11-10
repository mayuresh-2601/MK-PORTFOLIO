import "dotenv/config";

import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";

import { upsertEnvValues } from "./envFile.js";

/*
   One-time Gmail API OAuth2 setup.

   Run from server/:
     npm run gmail:auth

   Prerequisites (documented in DEPLOYMENT.md):
     1. Enable the Gmail API in Google Cloud Console.
     2. Configure an External OAuth consent screen and add your Gmail as a
        test user. Add the scopes openid, email, and gmail.send.
        Set the publishing status to "In production" for a refresh token
        that does not expire after 7 days (an unverified-app warning is OK
        for personal use).
     3. Create an OAuth client ID of type "Desktop app".
     4. Put GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in server/.env.

   The script opens a local callback server, exchanges the authorization
   code for a refresh token, and writes the result to server/.env. The token
   is never printed to the terminal.
*/

const clientId = String(
  process.env.GMAIL_CLIENT_ID || ""
).trim();

const clientSecret = String(
  process.env.GMAIL_CLIENT_SECRET || ""
).trim();

const placeholderPattern =
  /^(your[-_]|replace[-_]|change[-_]?me|paste[-_]|example)/i;

const isPlaceholder = (value) =>
  !value || placeholderPattern.test(value);

if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
  console.error(`
❌ GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are not configured.

Before running this script:

  1. Open https://console.cloud.google.com/
  2. Create (or select) a project and enable the Gmail API.
  3. Configure the OAuth consent screen:
       - User type: External
       - Add your Gmail address as a test user
       - Scopes: openid, email, https://www.googleapis.com/auth/gmail.send
       - For a refresh token that lasts longer than 7 days, set the
         publishing status to "In production". The unverified-app warning
         is expected for personal use.
  4. Create an OAuth client ID:
       - Application type: Desktop app
       - Copy the client ID and client secret into server/.env:
           GMAIL_CLIENT_ID=...
           GMAIL_CLIENT_SECRET=...
  5. Run this command again: npm run gmail:auth
`);
  process.exit(1);
}

const port = Number(process.env.GMAIL_OAUTH_PORT) || 3000;

const redirectUri =
  String(process.env.GMAIL_OAUTH_REDIRECT_URI || "").trim() ||
  `http://localhost:${port}/oauth2callback`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const state = crypto.randomBytes(24).toString("hex");

const scopes = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
  {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    ...(process.env.EMAIL_USER?.includes("@")
      ? { login_hint: process.env.EMAIL_USER.trim() }
      : {}),
  }
).toString()}`;

const openBrowser = (url) => {
  try {
    const platform = process.platform;
    const command =
      platform === "win32"
        ? "cmd"
        : platform === "darwin"
          ? "open"
          : "xdg-open";

    const args =
      platform === "win32"
        ? // Quoting the URL keeps cmd.exe from treating `&` in the OAuth
          // query string as a command separator.
          ["/c", "start", "", `"${url}"`]
        : [url];

    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true,
    });

    child.unref();
  } catch {
    // The URL is printed below, so the user can open it manually.
  }
};

const respond = (res, statusCode, message) => {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gmail setup</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6; color: #111; }
      code { background: #f4f4f4; padding: 0.15rem 0.35rem; }
      .ok { color: #0a7a33; }
      .error { color: #b00020; }
    </style>
  </head>
  <body>
    <h1 class="${statusCode === 200 ? "ok" : "error"}">
      ${statusCode === 200 ? "Gmail API connected" : "Gmail setup failed"}
    </h1>
    <p>${message}</p>
  </body>
</html>`);
};

let finished = false;

const finish = (code) => {
  if (finished) return;
  finished = true;

  console.log(
    code === 0
      ? "\n✅ Gmail OAuth setup complete. The refresh token was written to server/.env."
      : "\n❌ Gmail OAuth setup did not complete."
  );

  try {
    server.closeAllConnections?.();
  } catch {
    // Older Node versions do not have closeAllConnections.
  }

  server.close(() => process.exit(code));

  setTimeout(() => process.exit(code), 2000).unref();
};

const exchangeCode = async (code) => {
  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        `Token exchange failed (HTTP ${response.status}).`
    );
  }

  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. " +
        "Revoke this app's access at https://myaccount.google.com/permissions, " +
        "then run npm run gmail:auth again."
    );
  }

  return data;
};

const getAccountEmail = async (accessToken) => {
  try {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return "";

    const data = await response.json().catch(() => ({}));
    return String(data.email || "").trim();
  } catch {
    return "";
  }
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(
    req.url || "/",
    `http://localhost:${port}`
  );

  if (requestUrl.pathname !== "/oauth2callback") {
    respond(res, 404, "Not found.");
    return;
  }

  const oauthError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");

  if (oauthError) {
    respond(
      res,
      400,
      `Google returned: <code>${escapeHtml(oauthError)}</code>. Close this window and check the terminal.`
    );
    finish(1);
    return;
  }

  if (!returnedState || returnedState !== state) {
    respond(
      res,
      400,
      "The OAuth state did not match. Close this window and run the command again."
    );
    finish(1);
    return;
  }

  if (!code) {
    respond(
      res,
      400,
      "Google did not return an authorization code. Close this window and run the command again."
    );
    finish(1);
    return;
  }

  try {
    console.log("\nExchanging the authorization code for a refresh token...");

    const tokens = await exchangeCode(code);
    const email =
      (await getAccountEmail(tokens.access_token)) ||
      String(process.env.EMAIL_USER || "").trim();

    if (!email || !email.includes("@")) {
      throw new Error(
        "Could not determine the Gmail address. Set EMAIL_USER in server/.env and run again."
      );
    }

    await upsertEnvValues({
      GMAIL_CLIENT_ID: clientId,
      GMAIL_CLIENT_SECRET: clientSecret,
      GMAIL_REFRESH_TOKEN: tokens.refresh_token,
      EMAIL_USER: email,
      EMAIL_TRANSPORT: "gmail-api",
    });

    respond(
      res,
      200,
      `Authorized <strong>${escapeHtml(email)}</strong>. The refresh token was saved to <code>server/.env</code>. You can close this window and return to the terminal.`
    );

    console.log(`Authorized Gmail account: ${email}`);
    console.log("Saved: GMAIL_REFRESH_TOKEN, EMAIL_USER, EMAIL_TRANSPORT=gmail-api");
    console.log("Next: npm run email:check");

    finish(0);
  } catch (error) {
    respond(
      res,
      500,
      `Setup failed: ${String(error.message)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}`
    );

    console.error(`\n❌ ${error.message}`);
    finish(1);
  }
});

server.on("error", (error) => {
  console.error(
    `\n❌ Could not start the OAuth callback server on port ${port}: ${error.message}`
  );
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`
Gmail API OAuth setup

1. Open this URL and sign in with your Gmail account:

${authUrl}

2. Approve the requested access:
     - See your primary Google Account email address
     - Send email on your behalf

3. Google will redirect to:
     ${redirectUri}

Waiting for the callback... (this window will update automatically)
`);

  openBrowser(authUrl);
});

setTimeout(() => {
  console.error(
    "\n❌ Timed out waiting for Google's callback after 10 minutes."
  );
  finish(1);
}, 10 * 60 * 1000).unref();

process.on("SIGINT", () => finish(1));
process.on("SIGTERM", () => finish(1));
