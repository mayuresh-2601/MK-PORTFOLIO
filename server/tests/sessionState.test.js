import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_ACTIONS,
  SESSION_STATES,
  evaluateSession,
  isSafeMethod,
} from "../utils/sessionState.js";

const NOW = 1_800_000_000_000;
const IDLE_MS = 30 * 60 * 1000;

const session = (overrides = {}) => ({
  admin_email: "owner@gmail.com",
  csrf_token: "csrf-token",
  expires_at: NOW + 60 * 60 * 1000,
  last_seen_at: NOW - 1000,
  revoked_at: null,
  ...overrides,
});

const evaluate = (overrides = {}) =>
  evaluateSession({
    session: session(),
    now: NOW,
    idleMs: IDLE_MS,
    adminEmail: "owner@gmail.com",
    method: "GET",
    ...overrides,
  });

test("safe methods do not require a CSRF token", () => {
  assert.equal(isSafeMethod("GET"), true);
  assert.equal(isSafeMethod("HEAD"), true);
  assert.equal(isSafeMethod("OPTIONS"), true);
  assert.equal(isSafeMethod("POST"), false);
  assert.equal(isSafeMethod(undefined), false);
});

test("an active session allows the request", () => {
  const decision = evaluate();

  assert.equal(decision.state, SESSION_STATES.ACTIVE);
  assert.equal(decision.action, SESSION_ACTIONS.ALLOW);
  assert.equal(decision.reason, null);
});

test("a missing session row is rejected without a revoke", () => {
  const decision = evaluate({ session: null });

  assert.equal(decision.state, SESSION_STATES.NOT_FOUND);
  assert.equal(decision.action, SESSION_ACTIONS.REJECT);
});

test("a revoked session is rejected", () => {
  const decision = evaluate({ session: session({ revoked_at: NOW - 1 }) });

  assert.equal(decision.state, SESSION_STATES.REVOKED);
  assert.equal(decision.action, SESSION_ACTIONS.REJECT);
});

test("expired and idle sessions are revoked before rejection", () => {
  const expired = evaluate({ session: session({ expires_at: NOW }) });
  assert.equal(expired.state, SESSION_STATES.EXPIRED);
  assert.equal(expired.action, SESSION_ACTIONS.REVOKE_AND_REJECT);

  const idle = evaluate({
    session: session({ last_seen_at: NOW - IDLE_MS - 1 }),
  });
  assert.equal(idle.state, SESSION_STATES.IDLE_TIMEOUT);
  assert.equal(idle.action, SESSION_ACTIONS.REVOKE_AND_REJECT);
});

test("malformed timestamps fail closed and revoke", () => {
  const decision = evaluate({
    session: session({ expires_at: "not-a-number" }),
  });

  assert.equal(decision.state, SESSION_STATES.INVALID_TIMESTAMP);
  assert.equal(decision.action, SESSION_ACTIONS.REVOKE_AND_REJECT);
});

test("changing the configured admin email invalidates old sessions", () => {
  const decision = evaluate({ adminEmail: "new-owner@gmail.com" });

  assert.equal(decision.state, SESSION_STATES.ADMIN_CHANGED);
  assert.equal(decision.action, SESSION_ACTIONS.REVOKE_AND_REJECT);

  const missing = evaluate({ adminEmail: "" });
  assert.equal(missing.state, SESSION_STATES.ADMIN_CHANGED);
});

test("the admin email comparison ignores case", () => {
  const decision = evaluate({
    session: session({ admin_email: "Owner@Gmail.com" }),
    adminEmail: "owner@gmail.com",
  });

  assert.equal(decision.state, SESSION_STATES.ACTIVE);
});

test("state-changing requests require the matching CSRF token", () => {
  const missing = evaluate({ method: "POST" });
  assert.equal(missing.state, SESSION_STATES.CSRF_INVALID);
  assert.equal(missing.action, SESSION_ACTIONS.REJECT);

  const wrong = evaluate({ method: "POST", submittedCsrf: "wrong" });
  assert.equal(wrong.state, SESSION_STATES.CSRF_INVALID);

  const correct = evaluate({
    method: "POST",
    submittedCsrf: "csrf-token",
  });
  assert.equal(correct.state, SESSION_STATES.ACTIVE);
});
