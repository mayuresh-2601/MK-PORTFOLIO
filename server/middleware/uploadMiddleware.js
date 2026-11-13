import path from "node:path";

import multer from "multer";

import cloudinary, { cloudinaryConfigured } from "../config/cloudinary.js";

/* 
   Allowed File Types
 */

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const documentMimeTypes = new Set([
  ...imageMimeTypes,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const imageFormats = ["jpg", "jpeg", "png", "webp"];
const documentFormats = [...imageFormats, "pdf", "doc", "docx"];

const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB
const DOCUMENT_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

/* 
   Multer
 */

const createUploader = (allowDocuments) =>
  multer({
    // Cloudinary needs a stream, so keep the file in memory briefly instead
    // of writing to Render's ephemeral disk. Limits are enforced by Multer
    // before the buffer is handed to Cloudinary.
    storage: multer.memoryStorage(),

    limits: {
      fileSize: allowDocuments ? DOCUMENT_SIZE_LIMIT : IMAGE_SIZE_LIMIT,
      files: 1,
    },

    fileFilter: (req, file, cb) => {
      const allowed = allowDocuments
        ? documentMimeTypes
        : imageMimeTypes;

      if (allowed.has(file.mimetype)) {
        return cb(null, true);
      }

      const message = allowDocuments
        ? "Unsupported file type. Only JPG, PNG, WEBP, PDF, DOC and DOCX files are allowed."
        : "Unsupported image type. Only JPG, PNG and WEBP files are allowed.";

      return cb(new Error(message));
    },
  });

const imageUploader = createUploader(false);
const documentUploader = createUploader(true);

/* 
   Cloudinary Upload
 */

const safePublicId = (originalName) => {
  const baseName = path.parse(originalName || "upload").name;
  const sanitized = baseName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "")
    .slice(0, 80);

  return `${Date.now()}-${sanitized || "upload"}`;
};

const uploadToCloudinary = (file, allowDocuments) =>
  new Promise((resolve, reject) => {
    const now = new Date();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `portfolio/${now.getFullYear()}/${now.getMonth() + 1}`,
        resource_type: allowDocuments ? "auto" : "image",
        public_id: safePublicId(file.originalname),
        allowed_formats: allowDocuments
          ? documentFormats
          : imageFormats,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(file.buffer);
  });

/* 
   Single File Upload Middleware
 */

export const uploadSingle = (
  fieldName,
  { allowDocuments = false, validate } = {}
) => {
  const uploader = allowDocuments
    ? documentUploader
    : imageUploader;

  return (req, res, next) => {
    uploader.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
              success: false,
              message: allowDocuments
                ? "Maximum upload size is 10 MB."
                : "Maximum image size is 5 MB.",
            });
          }

          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              message: "Only one file can be uploaded at a time.",
            });
          }

          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed.",
        });
      }

      // Optional pre-upload validation. Multer has parsed the text fields by
      // now, so an invalid public form submission is rejected before its file
      // is sent to Cloudinary (no orphan assets, no wasted quota).
      if (typeof validate === "function") {
        try {
          const result = validate(req.body || {});

          if (result && result.ok === false) {
            return res.status(result.status || 400).json({
              success: false,
              message: result.message || "Invalid request.",
            });
          }
        } catch {
          return res.status(400).json({
            success: false,
            message: "Invalid request.",
          });
        }
      }

      // No file supplied — controllers decide whether one is required.
      if (!req.file) return next();

      if (!cloudinaryConfigured) {
        return res.status(503).json({
          success: false,
          message:
            "File uploads are not configured on this server. Add CLOUD_NAME, CLOUD_API_KEY and CLOUD_API_SECRET.",
        });
      }

      try {
        const result = await uploadToCloudinary(
          req.file,
          allowDocuments
        );

        // Controllers expect the public URL in `file.path`.
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        req.file.cloudinaryPublicId = result.public_id;
        req.file.resourceType = result.resource_type;

        return next();
      } catch (error) {
        console.error("Cloudinary upload failed:", error.message);

        return res.status(502).json({
          success: false,
          message: "File upload failed. Please try again.",
        });
      }
    });
  };
};

export default {
  uploadSingle,
};
