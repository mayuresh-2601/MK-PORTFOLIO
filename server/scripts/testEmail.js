import "dotenv/config";

import { getEmailConfig } from "../config/email.js";
import { sendEmail, verifyEmail } from "../utils/sendEmail.js";

/*
   Check the configured Gmail transport and, optionally, send a test email.

     npm run email:check
     npm run email:test
     npm run email:test -- you@example.com
*/

const wantsSend = process.argv.includes("--send");

const recipientArgument = process.argv
  .slice(2)
  .find((argument) => !argument.startsWith("--"));

const config = getEmailConfig();

if (!config.configured) {
  console.error(`
❌ Email is not configured.

Add ONE of these to server/.env:

  A. Gmail API over HTTPS (recommended on Render free):
       EMAIL_USER=your-address@gmail.com
       GMAIL_CLIENT_ID=...
       GMAIL_CLIENT_SECRET=...
       GMAIL_REFRESH_TOKEN=...       (from npm run gmail:auth)
       EMAIL_TRANSPORT=gmail-api

  B. Gmail SMTP with a Google App Password (local / paid hosting):
       EMAIL_USER=your-address@gmail.com
       EMAIL_PASS=your-16-character-app-password
       EMAIL_TRANSPORT=smtp

Create an App Password at https://myaccount.google.com/apppasswords
`);
  process.exit(1);
}

const recipient =
  recipientArgument ||
  process.env.ADMIN_EMAIL ||
  config.user;

console.log(`Transport: ${config.transport}`);
console.log(`Sending as: ${config.user}`);

try {
  const verification = await verifyEmail();

  console.log(
    `✅ Credentials verified for ${verification.emailAddress} (${verification.transport}).`
  );

  if (!wantsSend) {
    console.log(
      "No email was sent. Run `npm run email:test` to send a test message."
    );
    process.exit(0);
  }

  const result = await sendEmail({
    name: "Portfolio Email Test",
    email: config.user,
    subject: "Portfolio email test",
    message:
      "This is a test notification from your portfolio contact form. " +
      "If you can read this, Gmail delivery is working.",
    to: recipient,
  });

  console.log(
    `✅ Test email sent to ${recipient} (message id: ${
      result.messageId || "not returned"
    }).`
  );
  console.log("Check the inbox and spam folder.");
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
