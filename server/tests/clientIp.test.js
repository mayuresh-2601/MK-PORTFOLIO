import assert from "node:assert/strict";
import test from "node:test";

import { getClientIp } from "../utils/clientIp.js";

test("uses Cloudflare's visitor IP when the edge marker is present", () => {
  const req = {
    headers: {
      "cf-ray": "8c3edb6-SJC",
      "cf-connecting-ip": "203.0.113.10",
    },
    ip: "10.28.29.130",
  };

  assert.equal(getClientIp(req), "203.0.113.10");
});

test("ignores Cloudflare headers without the edge marker", () => {
  const req = {
    headers: {
      "cf-connecting-ip": "203.0.113.10",
    },
    ip: "198.51.100.7",
  };

  assert.equal(getClientIp(req), "198.51.100.7");
});

test("ignores invalid Cloudflare header values", () => {
  const req = {
    headers: {
      "cf-ray": "8c3edb6-SJC",
      "cf-connecting-ip": "not-an-ip",
    },
    ip: "198.51.100.7",
  };

  assert.equal(getClientIp(req), "198.51.100.7");
});

test("normalizes IPv4-mapped IPv6 addresses", () => {
  const req = {
    headers: {},
    ip: "::ffff:203.0.113.55",
  };

  assert.equal(getClientIp(req), "203.0.113.55");
});

test("normalizes a Cloudflare IPv6 address", () => {
  const req = {
    headers: {
      "cf-ray": "8c3edb6-SJC",
      "cf-connecting-ip": "2001:db8::1",
    },
    ip: "10.0.0.1",
  };

  assert.equal(getClientIp(req), "2001:db8::1");
});

test("returns unknown when no usable address exists", () => {
  assert.equal(getClientIp(undefined), "unknown");
  assert.equal(getClientIp({}), "unknown");
  assert.equal(
    getClientIp({ headers: {}, ip: "definitely-not-an-ip" }),
    "unknown"
  );
});
