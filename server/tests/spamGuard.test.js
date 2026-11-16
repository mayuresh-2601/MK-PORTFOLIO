import assert from "node:assert/strict";
import test from "node:test";

import {
  checkContactSpam,
  HONEYPOT_FIELD,
  MIN_FORM_TIME_MS,
} from "../utils/spamGuard.js";
import { validateMessagePayload } from "../utils/messageValidation.js";

const basePayload = (overrides = {}) => ({
  name: "Mayuresh Kasar",
  email: "visitor@example.com",
  subject: "Hello",
  message: "I would like to talk about a backend role.",
  ...overrides,
});

test("a normal human submission passes", () => {
  const result = checkContactSpam(
    basePayload({ formStartedAt: Date.now() - MIN_FORM_TIME_MS - 1000 })
  );

  assert.equal(result.ok, true);
});

test("a missing or clock-skewed start time is not punished", () => {
  assert.equal(checkContactSpam(basePayload()).ok, true);
  assert.equal(
    checkContactSpam(
      basePayload({ formStartedAt: Date.now() + 60_000 })
    ).ok,
    true
  );
});

test("the honeypot rejects a filled hidden field", () => {
  const result = checkContactSpam(
    basePayload({
      [HONEYPOT_FIELD]: "https://spam.example",
      formStartedAt: Date.now() - 10_000,
    })
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.message, "Submission rejected.");
});

test("an implausibly fast submission is rejected", () => {
  const result = checkContactSpam(
    basePayload({ formStartedAt: Date.now() - 100 })
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /take a moment/);
});

test("a link flood is rejected", () => {
  const result = checkContactSpam(
    basePayload({
      message:
        "https://a.example https://b.example https://c.example " +
        "https://d.example https://e.example",
    })
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /too many links/);
});

test("an email flood is rejected", () => {
  const result = checkContactSpam(
    basePayload({
      message: [
        "a@example.com",
        "b@example.com",
        "c@example.com",
        "d@example.com",
        "e@example.com",
        "f@example.com",
      ].join(" "),
    })
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /too many links or email addresses/);
});

test("the message validator applies the honeypot and timing checks", () => {
  assert.equal(
    validateMessagePayload(
      basePayload({ [HONEYPOT_FIELD]: "bot" })
    ).ok,
    false
  );

  assert.equal(
    validateMessagePayload(
      basePayload({ formStartedAt: Date.now() })
    ).ok,
    false
  );

  assert.equal(
    validateMessagePayload(
      basePayload({
        formStartedAt: Date.now() - MIN_FORM_TIME_MS - 1000,
      })
    ).ok,
    true
  );
});

test("field validation runs before the spam heuristics", () => {
  const result = validateMessagePayload({
    name: "",
    email: "not-an-email",
    message: "x",
    [HONEYPOT_FIELD]: "bot",
  });

  assert.equal(result.ok, false);
  assert.doesNotMatch(result.message, /Submission rejected/);
});
