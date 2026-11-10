import {
  createGmailApiClient,
  createSmtpTransporter,
  getEmailConfig,
} from "../config/email.js";

/*
   Send Contact Email

   The transporter is created lazily and cached. Gmail API is preferred when
   configured; otherwise Gmail SMTP is used. All message content is either
   plain text or escaped HTML, and attachments are buffers.
*/

let cachedSmtpTransporter = null;
let cachedGmailApiClient = null;

const getTransport = () => {
  const config = getEmailConfig();

  if (config.transport === "gmail-api") {
    if (!cachedGmailApiClient) {
      cachedGmailApiClient = createGmailApiClient(config);
    }

    return {
      config,
      kind: "gmail-api",
      client: cachedGmailApiClient,
    };
  }

  if (config.transport === "smtp") {
    if (!cachedSmtpTransporter) {
      cachedSmtpTransporter = createSmtpTransporter(config);
    }

    return {
      config,
      kind: "smtp",
      client: cachedSmtpTransporter,
    };
  }

  throw new Error(
    "Email configuration is missing. Set EMAIL_USER plus either " +
      "GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN (Gmail API) " +
      "or EMAIL_PASS (Gmail SMTP App Password)."
  );
};

/*
   Helpers
 */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Header values must never contain line breaks. Users cannot inject
// additional SMTP headers through name, email or subject.
const sanitizeHeader = (value, fallback = "") => {
  const cleaned = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  return cleaned || fallback;
};

const safeFilename = (value) => {
  const cleaned = String(value || "attachment")
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/]/g, "-")
    .trim();

  return cleaned.slice(0, 120) || "attachment";
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const sendEmail = async (messageData = {}) => {
  const { config, kind, client } = getTransport();

  if (!config.user) {
    throw new Error(
      "Email configuration is missing. Check EMAIL_USER."
    );
  }

  const {
    name = "Unknown",
    email = "Not Provided",
    subject = "Portfolio Contact Form",
    message = "",
    file,
    to,
  } = messageData;

  const safeName = sanitizeHeader(name, "Unknown");
  const safeEmail = sanitizeHeader(email, "Not Provided");
  const safeSubject = sanitizeHeader(
    subject,
    "Portfolio Contact Form"
  ).slice(0, 200);

  const recipient = sanitizeHeader(
    to || process.env.ADMIN_EMAIL || config.user,
    config.user
  );

  const submittedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Cloudinary uploads provide a public URL in `file.path` and keep the
  // original bytes in `file.buffer`. Attach the buffer when available;
  // otherwise include a link instead of letting Nodemailer fetch a URL.
  const hasBuffer = Boolean(file?.buffer?.length);
  const attachmentUrl =
    !hasBuffer && file?.path && isHttpUrl(file.path)
      ? file.path
      : null;

  const attachments = hasBuffer
    ? [
        {
          filename: safeFilename(file.originalname),
          content: file.buffer,
          contentType: file.mimetype,
        },
      ]
    : [];

  const attachmentLine = attachmentUrl
    ? `\nAttachment:\n${attachmentUrl}\n`
    : "";

  const attachmentHtml = attachmentUrl
    ? `<p><strong>Attachment:</strong> <a href="${escapeHtml(
        attachmentUrl
      )}">${escapeHtml(safeFilename(file?.originalname))}</a></p>`
    : "";

  const escapedName = escapeHtml(safeName);
  const escapedEmail = escapeHtml(safeEmail);
  const escapedSubject = escapeHtml(safeSubject);
  const escapedMessage = escapeHtml(message);

  const mailOptions = {
    from: `"Portfolio Contact" <${config.user}>`,
    to: recipient,
    replyTo: safeEmail,
    subject: `📩 ${safeSubject}`,

    text: `
New Portfolio Contact Message

Name: ${safeName}
Email: ${safeEmail}
Subject: ${safeSubject}

Message:
${message}

Submitted At:
${submittedAt}
${attachmentLine}
`,

    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>📩 New Portfolio Contact Message</h2>

        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td><strong>Name</strong></td>
            <td>${escapedName}</td>
          </tr>

          <tr>
            <td><strong>Email</strong></td>
            <td>${escapedEmail}</td>
          </tr>

          <tr>
            <td><strong>Subject</strong></td>
            <td>${escapedSubject}</td>
          </tr>

          <tr>
            <td><strong>Submitted</strong></td>
            <td>${escapeHtml(submittedAt)}</td>
          </tr>
        </table>

        <h3>Message</h3>

        <p>${escapedMessage.replace(/\n/g, "<br>")}</p>

        ${attachmentHtml}

        <p style="color:#666;font-size:12px">
          Reply directly to this email to respond to ${escapedName}.
        </p>
      </div>
    `,

    attachments,
  };

  try {
    // Do not call verify() on every message: it opens an extra connection
    // (SMTP) or API request (Gmail API) and slows down the public form.
    if (kind === "gmail-api") {
      const result = await client.send(mailOptions);

      console.log(
        `✅ Email sent successfully via Gmail API: ${
          result.messageId || "(no message id)"
        }`
      );

      return result;
    }

    const info = await client.sendMail(mailOptions);

    console.log(
      `✅ Email sent successfully via Gmail SMTP: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
      transport: "smtp",
    };
  } catch (error) {
    console.error(
      `❌ Email Error (${kind}):`,
      error.message
    );

    throw error;
  }
};

/**
 * Verify credentials without sending a message.
 * Used by `npm run email:check`.
 */
export const verifyEmail = async () => {
  const { config, kind, client } = getTransport();

  if (kind === "gmail-api") {
    const result = await client.verify();

    return {
      transport: kind,
      emailAddress: result.emailAddress,
    };
  }

  await client.verify();

  return {
    transport: kind,
    emailAddress: config.user,
  };
};

export default sendEmail;
