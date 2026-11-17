/**

 * Global Error Handling Middleware

 */

/**
 * Handles all application errors.
 */

const MAX_LOG_VALUE_LENGTH = 500;

// Request paths and error messages can contain attacker-controlled control
// characters, including newlines. Strip them before writing to the log so a
// crafted URL cannot forge extra log lines.
const sanitizeForLog = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .slice(0, MAX_LOG_VALUE_LENGTH);

export const errorHandler = (err, req, res, next) => {
  // If headers are already sent, let Express handle it.
  if (res.headersSent) {
    return next(err);
  }

  // Body-parser (malformed JSON / oversized payloads) and other middleware
  // attach the intended status to `err.status`/`err.statusCode`; Express does
  // not copy it to `res.statusCode`. Fall back to the response status set by
  // `notFound`, and treat anything outside 4xx/5xx as an internal error.
  const requestedStatus = Number(
    err.status ?? err.statusCode ?? res.statusCode
  );

  const statusCode =
    Number.isInteger(requestedStatus) &&
    requestedStatus >= 400 &&
    requestedStatus <= 599
      ? requestedStatus
      : 500;

  // Body-parser errors carry framework-specific text. Replace it with a
  // stable message so responses do not reveal parser internals or versions.
  const isMalformedJson = err.type === "entity.parse.failed";
  const isPayloadTooLarge = err.type === "entity.too.large";

  // Log detailed information during development
  if (process.env.NODE_ENV !== "production") {
    console.error("========================================");
    console.error("Error:", sanitizeForLog(err.message));
    console.error("Method:", sanitizeForLog(req.method));
    console.error("URL:", sanitizeForLog(req.originalUrl));
    console.error(sanitizeForLog(err.stack));
    console.error("========================================");
  } else {
    console.error(sanitizeForLog(err.message));
  }

  // Do not leak internal details (SQL errors, file paths, stack
  // fragments) to clients in production. Validation errors keep their
  // helpful 4xx messages, while parser errors get a generic message.
  const publicMessage = isPayloadTooLarge
    ? "Request body is too large."
    : isMalformedJson
      ? "Malformed JSON request body."
      : process.env.NODE_ENV === "production" && statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: publicMessage,
    timestamp: new Date().toISOString(),
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.stack,
  });
};

/**

 * 404 Not Found Middleware

 */

/**
 * Handles unknown routes.
 */
export const notFound = (req, res, next) => {
  // Keep the requested path out of the response. It is attacker-controlled
  // and can contain markup or control characters; morgan already records it
  // server-side for debugging.
  const error = new Error("Route not found.");

  res.status(404);

  next(error);
};
