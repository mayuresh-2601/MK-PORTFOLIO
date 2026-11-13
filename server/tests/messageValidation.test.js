import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SUBJECT,
  MESSAGE_LIMITS,
  validateMessagePayload,
} from "../utils/messageValidation.js";

test("accepts and normalizes a valid contact message", () => {
  const result = validateMessagePayload({
    name: "  Mayuresh  ",
    email: "  hello@example.com  ",
    message: "  Hello there  ",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    name: "Mayuresh",
    email: "hello@example.com",
    subject: DEFAULT_SUBJECT,
    message: "Hello there",
  });
});

test("preserves an explicit subject", () => {
  const result = validateMessagePayload({
    name: "Mayuresh",
    email: "hello@example.com",
    subject: "  Project enquiry  ",
    message: "Hello",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.subject, "Project enquiry");
});

test("rejects missing or non-string fields", () => {
  for (const payload of [
    {},
    { name: 123, email: "hello@example.com", message: "Hello" },
    { name: "Mayuresh", email: null, message: "Hello" },
    { name: "Mayuresh", email: "hello@example.com", message: [] },
    {
      name: "Mayuresh",
      email: "hello@example.com",
      subject: 42,
      message: "Hello",
    },
  ]) {
    const result = validateMessagePayload(payload);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  }
});

test("rejects an invalid email address", () => {
  const result = validateMessagePayload({
    name: "Mayuresh",
    email: "not-an-email",
    message: "Hello",
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /valid email/i);
});

test("rejects values over their limits", () => {
  const cases = [
    {
      name: "x".repeat(MESSAGE_LIMITS.name + 1),
      email: "hello@example.com",
      message: "Hello",
    },
    {
      name: "Mayuresh",
      email: `${"x".repeat(MESSAGE_LIMITS.email)}@example.com`,
      message: "Hello",
    },
    {
      name: "Mayuresh",
      email: "hello@example.com",
      subject: "x".repeat(MESSAGE_LIMITS.subject + 1),
      message: "Hello",
    },
    {
      name: "Mayuresh",
      email: "hello@example.com",
      message: "x".repeat(MESSAGE_LIMITS.message + 1),
    },
  ];

  for (const payload of cases) {
    const result = validateMessagePayload(payload);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  }
});

test("rejects blank required values", () => {
  const result = validateMessagePayload({
    name: "   ",
    email: "hello@example.com",
    message: "Hello",
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /required/i);
});
