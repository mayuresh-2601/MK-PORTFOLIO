import path from "node:path";

/**
 * File signature validation.
 *
 * The browser-supplied MIME type and filename are not trustworthy. Before a
 * file reaches Cloudinary (or an email attachment), its magic bytes must
 * match the declared type and extension. This blocks renamed executables and
 * HTML/SVG payloads disguised as images.
 */

const SIGNATURES = {
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extensions: [".png"],
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  "image/webp": {
    extensions: [".webp"],
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  "application/pdf": {
    extensions: [".pdf"],
    matches: (buffer) => {
      const header = buffer.subarray(0, 1024).toString("latin1");
      return header.includes("%PDF-");
    },
  },
  "application/msword": {
    extensions: [".doc"],
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
      ),
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extensions: [".docx"],
    matches: (buffer) => {
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        return false;
      }

      // A DOCX is a ZIP container. Requiring the OOXML content-types entry
      // rejects arbitrary ZIPs renamed to .docx.
      const text = buffer.toString("latin1");

      return (
        text.includes("[Content_Types].xml") &&
        text.includes("word/")
      );
    },
  },
};

const detectionMessage = (allowDocuments) =>
  allowDocuments
    ? "This file's contents do not match its type. Upload a real JPG, PNG, WEBP, PDF, DOC or DOCX file."
    : "This image's contents do not match its type. Upload a real JPG, PNG or WEBP image.";

export const validateFileSignature = (
  file,
  { allowDocuments = false } = {}
) => {
  const buffer = file?.buffer;
  const mimetype = String(file?.mimetype || "").toLowerCase();
  const extension = path.extname(file?.originalname || "").toLowerCase();

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { ok: false, message: "The uploaded file is empty." };
  }

  const rule = SIGNATURES[mimetype];

  if (!rule) {
    return { ok: false, message: detectionMessage(allowDocuments) };
  }

  if (!allowDocuments && !mimetype.startsWith("image/")) {
    return { ok: false, message: detectionMessage(allowDocuments) };
  }

  if (extension && !rule.extensions.includes(extension)) {
    return { ok: false, message: detectionMessage(allowDocuments) };
  }

  if (!rule.matches(buffer)) {
    return { ok: false, message: detectionMessage(allowDocuments) };
  }

  return { ok: true, mimetype, extension };
};

export default validateFileSignature;
