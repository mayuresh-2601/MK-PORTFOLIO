import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteCloudinaryAsset,
  parseCloudinaryAsset,
} from "../utils/cloudinaryAsset.js";

test("parses a versioned Cloudinary image URL", () => {
  assert.deepEqual(
    parseCloudinaryAsset(
      "https://res.cloudinary.com/demo/image/upload/v1785733392/portfolio/2026/8/1785733391132-logo.png.png"
    ),
    {
      publicId: "portfolio/2026/8/1785733391132-logo.png",
      resourceType: "image",
    }
  );
});

test("ignores transformations before the version segment", () => {
  assert.deepEqual(
    parseCloudinaryAsset(
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_800/v1234/portfolio/card.webp"
    ),
    {
      publicId: "portfolio/card",
      resourceType: "image",
    }
  );
});

test("parses raw document URLs", () => {
  assert.deepEqual(
    parseCloudinaryAsset(
      "https://res.cloudinary.com/demo/raw/upload/v99/portfolio/2026/11/cv.pdf"
    ),
    {
      publicId: "portfolio/2026/11/cv",
      resourceType: "raw",
    }
  );
});

test("returns null for repository-hosted images", () => {
  assert.equal(parseCloudinaryAsset("/projects/todo-list.png"), null);
  assert.equal(
    parseCloudinaryAsset("https://mk-portfolio-phi-silk.vercel.app/og-cover.jpg"),
    null
  );
});

test("returns null for malformed or incomplete URLs", () => {
  assert.equal(parseCloudinaryAsset(""), null);
  assert.equal(parseCloudinaryAsset(null), null);
  assert.equal(parseCloudinaryAsset("not a url"), null);
  assert.equal(
    parseCloudinaryAsset("https://res.cloudinary.com/demo/image/upload/"),
    null
  );
});

test("cleanup skips local paths without calling Cloudinary", async () => {
  assert.deepEqual(await deleteCloudinaryAsset("/projects/todo-list.png"), {
    deleted: false,
    skipped: true,
  });

  assert.deepEqual(
    await deleteCloudinaryAsset({ publicId: "", resourceType: "image" }),
    { deleted: false, skipped: true }
  );
});
