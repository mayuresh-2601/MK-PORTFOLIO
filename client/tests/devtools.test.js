import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGradient,
  decodeBase64,
  decodeHtml,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeHtml,
  encodeUrl,
  formatJson,
  testRegex,
  validateJson,
} from "../src/lib/devtools.js";

test("formatJson pretty-prints valid JSON", () => {
  const result = formatJson('{"b":2,"a":1}');
  assert.equal(result.ok, true);
  assert.equal(result.value, '{\n  "b": 2,\n  "a": 1\n}');
});

test("formatJson rejects invalid and empty input", () => {
  assert.equal(formatJson("{not json}").ok, false);
  assert.equal(formatJson("").ok, false);
});

test("validateJson reports success and parser errors", () => {
  assert.deepEqual(validateJson("[1, 2]"), { ok: true, error: null });
  assert.equal(validateJson("[1,").ok, false);
});

test("base64 round-trips unicode text", () => {
  const encoded = encodeBase64("Mayuresh — कार्य 🚀");
  assert.equal(encoded.ok, true);
  const decoded = decodeBase64(encoded.value);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.value, "Mayuresh — कार्य 🚀");
});

test("base64 rejects malformed input", () => {
  assert.equal(decodeBase64("not base64!!").ok, false);
  assert.equal(decodeBase64("abc").ok, false);
});

test("url encode/decode round-trips and reports bad escapes", () => {
  const encoded = encodeUrl("name=Mayuresh Kasar&city=Pune");
  assert.equal(encoded.value, "name%3DMayuresh%20Kasar%26city%3DPune");
  assert.equal(decodeUrl(encoded.value).value, "name=Mayuresh Kasar&city=Pune");
  assert.equal(decodeUrl("%E0%A4%A").ok, false);
});

test("html encode/decode round-trips", () => {
  const encoded = encodeHtml('<a href="x">Tom & Jerry\'s</a>');
  assert.equal(encoded, "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
  assert.equal(decodeHtml(encoded), '<a href="x">Tom & Jerry\'s</a>');
});

test("html decode handles numeric and unknown entities", () => {
  assert.equal(decodeHtml("&#65;&#x42;"), "AB");
  assert.equal(decodeHtml("&unknown;"), "&unknown;");
});

test("regex tester finds global matches and groups", () => {
  const result = testRegex({ pattern: "(\\d+)-(\\d+)", flags: "g", input: "12-34 and 56-78" });
  assert.equal(result.ok, true);
  assert.equal(result.matches.length, 2);
  assert.deepEqual(result.matches[0].groups, ["12", "34"]);
  assert.equal(result.matches[1].index, 10);
});

test("regex tester rejects invalid patterns and flags", () => {
  assert.equal(testRegex({ pattern: "(", flags: "", input: "x" }).ok, false);
  assert.equal(testRegex({ pattern: "x", flags: "z", input: "x" }).ok, false);
});

test("regex tester handles zero-width matches without looping forever", () => {
  const result = testRegex({ pattern: "x*", flags: "g", input: "abc" });
  assert.equal(result.ok, true);
  assert.ok(result.matches.length > 0);
  assert.equal(result.matches[0].match, "");
});

test("jwt decoder returns header and payload locally", () => {
  const header = encodeBase64(JSON.stringify({ alg: "HS256", typ: "JWT" })).value
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payload = encodeBase64(JSON.stringify({ sub: "1234", name: "Mayuresh" })).value
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const token = `${header}.${payload}.signature`;
  const result = decodeJwt(token);
  assert.equal(result.ok, true);
  assert.equal(result.header.alg, "HS256");
  assert.equal(result.payload.name, "Mayuresh");
  assert.match(result.warning, /NOT verified/);
});

test("jwt decoder rejects malformed tokens", () => {
  assert.equal(decodeJwt("").ok, false);
  assert.equal(decodeJwt("only.two").ok, false);
  assert.equal(decodeJwt("a.b.c").ok, false);
});

test("gradient builder produces linear and radial CSS", () => {
  const linear = buildGradient({
    type: "linear",
    angle: 90,
    stops: [
      { color: "#CCFF00", position: 0 },
      { color: "#000000", position: 100 },
    ],
  });
  assert.equal(linear.ok, true);
  assert.equal(linear.css, "linear-gradient(90deg, #CCFF00 0%, #000000 100%)");

  const radial = buildGradient({
    type: "radial",
    stops: [
      { color: "#fff", position: 0 },
      { color: "#000", position: 100 },
    ],
  });
  assert.equal(radial.ok, true);
  assert.match(radial.css, /^radial-gradient\(circle,/);
});

test("gradient builder rejects bad colours and too few stops", () => {
  assert.equal(
    buildGradient({
      stops: [
        { color: "not-a-colour", position: 0 },
        { color: "#000", position: 100 },
      ],
    }).ok,
    false
  );
  assert.equal(buildGradient({ stops: [{ color: "#000", position: 0 }] }).ok, false);
});
