/**
 * Contact form validation.
 *
 * Kept separate from the controller so the upload middleware can reject an
 * invalid message BEFORE a file is sent to Cloudinary. Without this check a
 * public request with a valid file but missing fields would upload an orphan
 * asset and only then return 400.
 */

export const DEFAULT_SUBJECT = "Portfolio Contact Form";

export const MESSAGE_LIMITS = {
  name: 100,
  email: 150,
  subject: 200,
  message: 5000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reject = (message, status = 400) => ({
  ok: false,
  status,
  message,
});

/**
 * Validate and normalize a contact payload.
 *
 * Returns `{ ok: true, data }` with trimmed values, or
 * `{ ok: false, status, message }` for the route/controller to return.
 */
export const validateMessagePayload = (body = {}) => {
  let { name, email, subject, message } = body || {};

  // Reject malformed JSON types before calling `.trim()`. Without this a
  // payload like {"name":123,...} would throw a TypeError and return 500.
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    (subject !== undefined &&
      subject !== null &&
      typeof subject !== "string")
  ) {
    return reject("Name, email, and message are required.");
  }

  name = name.trim();
  email = email.trim();
  subject = (subject || "").trim() || DEFAULT_SUBJECT;
  message = message.trim();

  if (!name || !email || !message) {
    return reject("Name, email, and message are required.");
  }

  if (name.length > MESSAGE_LIMITS.name) {
    return reject(
      `Name must be ${MESSAGE_LIMITS.name} characters or fewer.`
    );
  }

  if (
    email.length > MESSAGE_LIMITS.email ||
    !EMAIL_PATTERN.test(email)
  ) {
    return reject("Please provide a valid email address.");
  }

  if (subject.length > MESSAGE_LIMITS.subject) {
    return reject(
      `Subject must be ${MESSAGE_LIMITS.subject} characters or fewer.`
    );
  }

  if (message.length > MESSAGE_LIMITS.message) {
    return reject(
      `Message must be ${MESSAGE_LIMITS.message} characters or fewer.`
    );
  }

  return {
    ok: true,
    data: { name, email, subject, message },
  };
};

export default validateMessagePayload;
