import assert from "node:assert/strict";
import test from "node:test";

import { errorHandler } from "../middleware/errorMiddleware.js";

test("error logging strips control characters from request data", () => {
  const originalError = console.error;
  const logged = [];

  console.error = (...args) => {
    logged.push(args.map((value) => String(value)).join(" "));
  };

  try {
    const req = {
      method: "GET",
      originalUrl: "/api/missing\r\nforged-log-line",
      headers: {},
    };

    let statusCode = 0;
    const res = {
      headersSent: false,
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };

    errorHandler(new Error("boom\nforged-error-line"), req, res, () => {});

    assert.equal(statusCode, 500);

    for (const line of logged) {
      assert.doesNotMatch(line, /[\r\n]/);
    }

    assert.match(logged.join("\n"), /forged-log-line/);
  } finally {
    console.error = originalError;
  }
});
