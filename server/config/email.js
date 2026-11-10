import nodemailer from "nodemailer";

/*
   Email transport configuration.

   Two Gmail paths are supported:

   1. Gmail API over HTTPS (recommended on Render's free tier, which blocks
      outbound SMTP ports 25/465/587). Requires an OAuth2 client and a
      refresh token with the gmail.send scope.
   2. Gmail SMTP with a Google App Password (works locally and on paid
      hosting that allows SMTP).

   `EMAIL_TRANSPORT=auto` prefers the Gmail API when all OAuth values are
   present, then falls back to SMTP. Explicit `gmail-api` or `smtp` values
   never silently fall back: a half-configured transport stays unconfigured
   so startup can show a clear warning.
*/

const PLACEHOLDER_PATTERN =
  /^(your[-_]|replace[-_]|change[-_]?me|paste[-_]|example)/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A hung Gmail request must never hold a contact-form submission open.
const REQUEST_TIMEOUT_MS = 15_000;

const clean = (value) => String(value ?? "").trim();

const compactPassword = (value) =>
  String(value ?? "").replace(/\s+/g, "");

const isPlaceholder = (value) => {
  const cleaned = clean(value);
  return (
    !cleaned ||
    PLACEHOLDER_PATTERN.test(cleaned) ||
    /^admin@example\.com$/i.test(cleaned)
  );
};

export const getEmailConfig = () => {
  const user = clean(process.env.EMAIL_USER);
  const pass = compactPassword(process.env.EMAIL_PASS);
  const clientId = clean(process.env.GMAIL_CLIENT_ID);
  const clientSecret = clean(process.env.GMAIL_CLIENT_SECRET);
  const refreshToken = clean(process.env.GMAIL_REFRESH_TOKEN);

  const requested = clean(
    process.env.EMAIL_TRANSPORT || "auto"
  ).toLowerCase();

  const userIsReal =
    Boolean(user) &&
    EMAIL_PATTERN.test(user) &&
    !isPlaceholder(user);

  const smtpConfigured = Boolean(
    userIsReal && pass && !isPlaceholder(pass)
  );

  const gmailApiConfigured = Boolean(
    userIsReal &&
      clientId &&
      clientSecret &&
      refreshToken &&
      !isPlaceholder(clientId) &&
      !isPlaceholder(clientSecret) &&
      !isPlaceholder(refreshToken)
  );

  let transport = "none";

  if (requested === "gmail-api" || requested === "gmail") {
    transport = gmailApiConfigured ? "gmail-api" : "none";
  } else if (requested === "smtp") {
    transport = smtpConfigured ? "smtp" : "none";
  } else if (requested === "auto" || !requested) {
    transport = gmailApiConfigured
      ? "gmail-api"
      : smtpConfigured
        ? "smtp"
        : "none";
  }

  return {
    user,
    pass,
    clientId,
    clientSecret,
    refreshToken,
    requested,
    transport,
    smtpConfigured,
    gmailApiConfigured,
    configured: transport !== "none",
  };
};

export const createSmtpTransporter = (config = getEmailConfig()) =>
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: config.user,
      pass: config.pass,
    },

    // Defence in depth: even if a malicious attachment option ever reaches
    // this transporter, it cannot read local files or fetch arbitrary URLs.
    disableFileAccess: true,
    disableUrlAccess: true,

    // Render can be slow to reach Gmail during a cold start.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

/**
 * Render a complete RFC 2822 message using Nodemailer's stream transport.
 * Attachments are already buffers, so no filesystem or URL access is used.
 */
export const buildRawMessage = async (mailOptions) => {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  const info = await transporter.sendMail(mailOptions);

  return Buffer.isBuffer(info.message)
    ? info.message
    : Buffer.from(info.message);
};

/**
 * Minimal Gmail API client (no googleapis dependency).
 *
 * The refresh token is exchanged for a short-lived access token, which is
 * cached until shortly before expiry. Messages are sent as base64url-encoded
 * RFC 2822 bytes to the Gmail REST API over HTTPS.
 */
export const createGmailApiClient = (
  config = getEmailConfig(),
  options = {}
) => {
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new Error(
      "Gmail API transport requires a fetch implementation."
    );
  }

  const tokenUrl =
    options.tokenUrl ||
    process.env.GMAIL_TOKEN_URL ||
    "https://oauth2.googleapis.com/token";

  const userInfoUrl =
    options.userInfoUrl === false
      ? null
      : options.userInfoUrl ||
        process.env.GMAIL_USERINFO_URL ||
        "https://openidconnect.googleapis.com/v1/userinfo";

  const apiBaseUrl = (
    options.apiBaseUrl ||
    process.env.GMAIL_API_BASE_URL ||
    "https://gmail.googleapis.com/gmail/v1"
  ).replace(/\/$/, "");

  let accessToken = "";
  let accessTokenExpiresAt = 0;

  const readResponse = async (response) => {
    const text = await response.text();

    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { error: text.slice(0, 200) };
    }
  };

  const fetchWithTimeout = async (url, init, label) => {
    try {
      return await fetchImpl(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (
        error?.name === "TimeoutError" ||
        error?.name === "AbortError"
      ) {
        throw new Error(
          `${label} timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`
        );
      }

      throw error;
    }
  };

  const getAccessToken = async () => {
    if (
      accessToken &&
      Date.now() < accessTokenExpiresAt - 60_000
    ) {
      return accessToken;
    }

    const response = await fetchWithTimeout(
      tokenUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: "refresh_token",
        }),
      },
      "Gmail OAuth token refresh"
    );

    const data = await readResponse(response);

    if (!response.ok || !data.access_token) {
      const detail =
        data.error_description ||
        data.error ||
        `HTTP ${response.status}`;

      throw new Error(
        `Gmail OAuth token refresh failed: ${String(detail).slice(
          0,
          200
        )}`
      );
    }

    accessToken = data.access_token;
    accessTokenExpiresAt =
      Date.now() + (Number(data.expires_in) || 3600) * 1000;

    return accessToken;
  };

  const apiRequest = async (path, init = {}) => {
    const token = await getAccessToken();

    const response = await fetchWithTimeout(
      `${apiBaseUrl}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(init.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...init.headers,
        },
      },
      "Gmail API request"
    );

    const data = await readResponse(response);

    if (!response.ok) {
      const detail =
        data.error?.message ||
        data.error ||
        `HTTP ${response.status}`;

      throw new Error(
        `Gmail API request failed: ${String(detail).slice(0, 200)}`
      );
    }

    return data;
  };

  const send = async (mailOptions) => {
    const raw = await buildRawMessage(mailOptions);

    const data = await apiRequest("/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({
        raw: raw.toString("base64url"),
      }),
    });

    return {
      success: true,
      messageId: data.id || null,
      transport: "gmail-api",
    };
  };

  const verify = async () => {
    // A successful refresh proves the client ID, client secret and refresh
    // token are valid. Gmail's gmail.send scope cannot call users.getProfile,
    // so use the OpenID userinfo endpoint when the token has email scope.
    await getAccessToken();

    let emailAddress = config.user;

    if (userInfoUrl) {
      try {
        const response = await fetchWithTimeout(
          userInfoUrl,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          },
          "Gmail userinfo request"
        );

        if (response.ok) {
          const data = await readResponse(response);
          if (data.email) emailAddress = data.email;
        }
      } catch {
        // Token refresh already succeeded; userinfo is a best-effort check.
      }
    }

    return {
      emailAddress,
      transport: "gmail-api",
    };
  };

  return {
    getAccessToken,
    send,
    verify,
  };
};

export default {
  getEmailConfig,
  createSmtpTransporter,
  buildRawMessage,
  createGmailApiClient,
};
