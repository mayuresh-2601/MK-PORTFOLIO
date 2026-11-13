/**

 * Global Error Handling Middleware

 */

/**
 * Handles all application errors.
 */
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
    console.error("Error:", err.message);
    console.error("Method:", req.method);
    console.error("URL:", req.originalUrl);
    console.error(err.stack);
    console.error("========================================");
  } else {
    console.error(err.message);
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
