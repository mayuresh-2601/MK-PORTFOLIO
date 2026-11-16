import "dotenv/config";

import {
  buildOtpAuthUrl,
  generateTotp,
  generateTotpSecret,
} from "../utils/totp.js";

/**
 * Generate a fresh TOTP secret for admin MFA.
 *
 * This prints a NEW secret that the owner is about to store. It never reads
 * or prints an existing ADMIN_TOTP_SECRET, so running it cannot leak a
 * configured production credential.
 */

const accountName =
  process.argv[2] ||
  process.env.ADMIN_EMAIL ||
  "admin";

const secret = generateTotpSecret();
const url = buildOtpAuthUrl({ secret, accountName });
const currentCode = generateTotp(secret);

console.log("");
console.log("Admin MFA setup");
console.log("===============");
console.log("");
console.log("1. Add this secret to the server environment (server/.env or Render):");
console.log("");
console.log("ADMIN_TOTP_SECRET=" + secret);
console.log("");
console.log("2. Add the account in Google Authenticator, Authy or 1Password.");
console.log("   Scan the otpauth URL below, or enter the secret manually:");
console.log("");
console.log(url);
console.log("");
console.log("3. The current 6-digit code is " + currentCode);
console.log("   It changes every 30 seconds; use it to confirm the entry.");
console.log("");
console.log("4. Restart the API and sign in with the password plus the code.");
console.log("");
console.log(
  "Keep the secret private. It is equivalent to a second password; never commit it."
);
console.log("");
