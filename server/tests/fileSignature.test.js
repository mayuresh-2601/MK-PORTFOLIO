import assert from "node:assert/strict";
import test from "node:test";

import { validateFileSignature } from "../utils/fileSignature.js";

const jpeg = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a]);
const png = () =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webp = () =>
  Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([0x20, 0x00, 0x00, 0x00]),
    Buffer.from("WEBPVP8 "),
    Buffer.alloc(16),
  ]);
const pdf = () => Buffer.from("%PDF-1.7\n1 0 obj\n", "latin1");
const doc = () =>
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]);
const docx = () =>
  Buffer.from(
    "PK\u0003\u0004[Content_Types].xml word/document.xml",
    "latin1"
  );

const file = (buffer, mimetype, originalname) => ({
  buffer,
  mimetype,
  originalname,
});

test("accepts a real JPEG", () => {
  const result = validateFileSignature(
    file(jpeg(), "image/jpeg", "photo.jpg")
  );

  assert.equal(result.ok, true);
  assert.equal(result.extension, ".jpg");
});

test("accepts a real PNG and WEBP", () => {
  assert.equal(
    validateFileSignature(file(png(), "image/png", "photo.png")).ok,
    true
  );
  assert.equal(
    validateFileSignature(file(webp(), "image/webp", "photo.webp")).ok,
    true
  );
});

test("accepts JPEG with the .jpeg extension", () => {
  assert.equal(
    validateFileSignature(file(jpeg(), "image/jpeg", "photo.jpeg")).ok,
    true
  );
});

test("accepts documents only when document uploads are allowed", () => {
  for (const [buffer, mimetype, name] of [
    [pdf(), "application/pdf", "cv.pdf"],
    [doc(), "application/msword", "cv.doc"],
    [
      docx(),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "cv.docx",
    ],
  ]) {
    assert.equal(
      validateFileSignature(file(buffer, mimetype, name), {
        allowDocuments: true,
      }).ok,
      true
    );

    assert.equal(
      validateFileSignature(file(buffer, mimetype, name)).ok,
      false
    );
  }
});

test("rejects a renamed executable", () => {
  const executable = Buffer.from("MZ\u0090\u0000\u0003", "latin1");

  assert.equal(
    validateFileSignature(
      file(executable, "image/png", "avatar.png")
    ).ok,
    false
  );
});

test("rejects content that does not match the declared MIME type", () => {
  assert.equal(
    validateFileSignature(file(png(), "image/jpeg", "photo.jpg")).ok,
    false
  );
});

test("rejects a MIME/extension mismatch", () => {
  assert.equal(
    validateFileSignature(file(jpeg(), "image/jpeg", "photo.png")).ok,
    false
  );
});

test("rejects HTML or SVG disguised as an image", () => {
  const html = Buffer.from("<html><script>alert(1)</script></html>");

  assert.equal(
    validateFileSignature(file(html, "image/png", "x.png")).ok,
    false
  );
  assert.equal(
    validateFileSignature(
      Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"),
      "image/svg+xml",
      "x.svg"
    ).ok,
    false
  );
});

test("rejects empty files and unknown MIME types", () => {
  assert.equal(
    validateFileSignature(file(Buffer.alloc(0), "image/png", "x.png")).ok,
    false
  );
  assert.equal(
    validateFileSignature(
      file(Buffer.from("hello"), "text/plain", "x.txt")
    ).ok,
    false
  );
  assert.equal(validateFileSignature(undefined).ok, false);
});

test("a ZIP renamed to .docx is rejected", () => {
  const zip = Buffer.from("PK\u0003\u0004 random zip contents", "latin1");

  assert.equal(
    validateFileSignature(file(zip, "image/png", "x.png")).ok,
    false
  );
  assert.equal(
    validateFileSignature(
      file(
        zip,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "x.docx"
      ),
      { allowDocuments: true }
    ).ok,
    false
  );
});
