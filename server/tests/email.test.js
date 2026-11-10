import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import {
  buildRawMessage,
  createGmailApiClient,
} from "../config/email.js";

const readRequest = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const startTestServer = async (handler) => {
  const server = http.createServer(handler);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
};

test("buildRawMessage produces a complete MIME message", async () => {
  const raw = await buildRawMessage({
    from: '"Portfolio Contact" <owner@gmail.com>',
    to: "owner@gmail.com",
    replyTo: "visitor@example.net",
    subject: "Test email",
    text: "Plain text body",
    html: "<p>HTML body</p>",
  });

  assert.ok(Buffer.isBuffer(raw));

  const message = raw.toString("utf8");

  assert.match(message, /To: owner@gmail\.com/);
  assert.match(message, /Subject: Test email/);
  assert.match(message, /Plain text body|Plain text/);
  assert.match(message, /multipart\/alternative|text\/plain/);
});

test("Gmail API client refreshes once and sends base64url messages", async (t) => {
  let tokenRequests = 0;
  let sendRequests = 0;
  let userInfoRequests = 0;
  let lastRaw = "";

  const { server, origin } = await startTestServer(async (request, response) => {
    const url = new URL(
      request.url || "/",
      "http://localhost"
    );

    response.setHeader("Content-Type", "application/json");

    if (url.pathname === "/token") {
      tokenRequests += 1;
      const body = await readRequest(request);
      const params = new URLSearchParams(body);

      assert.equal(params.get("grant_type"), "refresh_token");
      assert.equal(params.get("client_id"), "test-client-id");
      assert.equal(params.get("refresh_token"), "test-refresh-token");

      response.end(
        JSON.stringify({
          access_token: "test-access-token",
          expires_in: 3600,
          token_type: "Bearer",
        })
      );
      return;
    }

    if (url.pathname === "/gmail/v1/users/me/messages/send") {
      sendRequests += 1;
      const body = JSON.parse(await readRequest(request));
      lastRaw = body.raw;

      response.end(
        JSON.stringify({
          id: `message-${sendRequests}`,
          threadId: "thread-1",
        })
      );
      return;
    }

    if (url.pathname === "/userinfo") {
      userInfoRequests += 1;

      response.end(
        JSON.stringify({
          email: "owner@gmail.com",
        })
      );
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: "not found" }));
  });

  t.after(() => {
    server.closeAllConnections?.();
    server.close();
  });

  const client = createGmailApiClient(
    {
      user: "owner@gmail.com",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      refreshToken: "test-refresh-token",
    },
    {
      tokenUrl: `${origin}/token`,
      apiBaseUrl: `${origin}/gmail/v1`,
      userInfoUrl: `${origin}/userinfo`,
    }
  );

  const first = await client.send({
    from: '"Portfolio Contact" <owner@gmail.com>',
    to: "owner@gmail.com",
    subject: "First test",
    text: "First body",
  });

  const second = await client.send({
    from: '"Portfolio Contact" <owner@gmail.com>',
    to: "owner@gmail.com",
    subject: "Second test",
    text: "Second body",
  });

  assert.equal(first.messageId, "message-1");
  assert.equal(second.messageId, "message-2");
  assert.equal(tokenRequests, 1);
  assert.equal(sendRequests, 2);

  const decoded = Buffer.from(lastRaw, "base64url").toString("utf8");

  assert.match(decoded, /Subject: Second test/);
  assert.match(decoded, /Second body/);

  const verification = await client.verify();

  assert.equal(verification.emailAddress, "owner@gmail.com");
  assert.equal(userInfoRequests, 1);
  assert.equal(tokenRequests, 1);
});

test("Gmail API client reports refresh failures without leaking tokens", async (t) => {
  const { server, origin } = await startTestServer(
    async (request, response) => {
      response.statusCode = 400;
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Token has been expired or revoked.",
        })
      );
    }
  );

  t.after(() => {
    server.closeAllConnections?.();
    server.close();
  });

  const client = createGmailApiClient(
    {
      user: "owner@gmail.com",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      refreshToken: "revoked-refresh-token",
    },
    {
      tokenUrl: `${origin}/token`,
      apiBaseUrl: `${origin}/gmail/v1`,
      userInfoUrl: false,
    }
  );

  await assert.rejects(
    () =>
      client.send({
        from: "owner@gmail.com",
        to: "owner@gmail.com",
        subject: "Failure",
        text: "Failure",
      }),
    /Gmail OAuth token refresh failed: Token has been expired or revoked\./
  );
});
