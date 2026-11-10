import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

/* 
   Cloudinary Configuration
 */

const cloudName = process.env.CLOUD_NAME?.trim();
const apiKey = process.env.CLOUD_API_KEY?.trim();
const apiSecret = process.env.CLOUD_API_SECRET?.trim();

/**
 * Uploads are optional at boot time. The public portfolio and admin auth
 * still work without Cloudinary; only file-upload endpoints return a clear
 * 503 until credentials are supplied. This keeps a missing optional
 * integration from taking down the whole API.
 */
export const cloudinaryConfigured = Boolean(
  cloudName && apiKey && apiSecret
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else {
  console.warn(
    "⚠️ Cloudinary is not configured. Image/document uploads will return 503."
  );
}

export default cloudinary;
