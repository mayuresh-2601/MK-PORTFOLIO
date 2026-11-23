import assert from "node:assert/strict";
import test from "node:test";

import {
  categoryNameForSlug,
  matchesCategory,
  matchesTag,
  slugify,
  tagNameForSlug,
} from "../src/lib/taxonomy.js";

const post = {
  category: "Full Stack",
  tags: ["Full Stack", "Node.js", "React"],
};

test("slugify produces URL-safe lowercase segments", () => {
  assert.equal(slugify("Node.js"), "nodejs");
  assert.equal(slugify("Full Stack"), "full-stack");
  assert.equal(slugify("  C++ & Rust  "), "c-rust");
});

test("tag matching compares slugs, not display labels", () => {
  assert.equal(matchesTag(post, "nodejs"), true);
  assert.equal(matchesTag(post, "Node.js"), true);
  assert.equal(matchesTag(post, "react"), true);
  assert.equal(matchesTag(post, "docker"), false);
});

test("category matching compares slugs", () => {
  assert.equal(matchesCategory(post, "full-stack"), true);
  assert.equal(matchesCategory(post, "Full Stack"), true);
  assert.equal(matchesCategory(post, "frontend"), false);
});

test("canonical labels are recovered from a slug", () => {
  const posts = [
    { category: "Full Stack", tags: ["Node.js"] },
    { category: "Frontend", tags: ["React"] },
  ];

  assert.equal(tagNameForSlug(posts, "nodejs"), "Node.js");
  assert.equal(categoryNameForSlug(posts, "full-stack"), "Full Stack");
  assert.equal(tagNameForSlug(posts, "unknown"), "unknown");
});
