import cloudinary, { cloudinaryConfigured } from "../config/cloudinary.js";

/*
   Cloudinary asset cleanup

   The database stores only the secure URL for project and certificate images.
   Uploads also return a public ID, which is used directly when it is still
   available on the request. Cleanup is best effort: a failed destroy must
   never turn a successful delete or update into an error for the admin.
*/

const CLOUDINARY_HOST = "res.cloudinary.com";
const RESOURCE_TYPES = new Set(["image", "video", "raw"]);
const DELIVERY_TYPES = new Set(["upload", "private", "authenticated"]);
const VERSION_SEGMENT = /^v\d+$/;
const FILE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|svg|pdf|docx?)$/i;

/**
 * Extract the public ID and resource type from a Cloudinary delivery URL.
 * Returns null for URLs that are not Cloudinary assets (for example the
 * repository-hosted images used by the seeded projects).
 */
export const parseCloudinaryAsset = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  let url;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.hostname !== CLOUDINARY_HOST) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);

  const resourceIndex = segments.findIndex(
    (segment, index) =>
      RESOURCE_TYPES.has(segment) && DELIVERY_TYPES.has(segments[index + 1])
  );

  if (resourceIndex === -1) {
    return null;
  }

  const resourceType = segments[resourceIndex];
  let assetSegments = segments.slice(resourceIndex + 2);

  // Transformations may appear between the delivery type and the version.
  const versionIndex = assetSegments.findIndex((segment) =>
    VERSION_SEGMENT.test(segment)
  );

  if (versionIndex !== -1) {
    assetSegments = assetSegments.slice(versionIndex + 1);
  }

  if (!assetSegments.length) {
    return null;
  }

  const publicId = decodeURIComponent(
    assetSegments.join("/")
  ).replace(FILE_EXTENSION, "");

  if (!publicId) {
    return null;
  }

  return { publicId, resourceType };
};

const normalizeAsset = (input) => {
  if (typeof input === "string") {
    return parseCloudinaryAsset(input);
  }

  if (input && typeof input.publicId === "string" && input.publicId) {
    return {
      publicId: input.publicId,
      resourceType: RESOURCE_TYPES.has(input.resourceType)
        ? input.resourceType
        : "image",
    };
  }

  return null;
};

/**
 * Delete one Cloudinary asset. Accepts a delivery URL or an object with
 * `publicId` and `resourceType`. Never throws.
 */
export const deleteCloudinaryAsset = async (input) => {
  const asset = normalizeAsset(input);

  // Repository-hosted images and missing values are not Cloudinary assets.
  if (!asset) {
    return { deleted: false, skipped: true };
  }

  if (!cloudinaryConfigured) {
    return { deleted: false, skipped: true };
  }

  try {
    const result = await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
      invalidate: true,
    });

    const deleted =
      result.result === "ok" || result.result === "not found";

    if (!deleted) {
      console.warn(
        `Cloudinary cleanup did not remove ${asset.publicId}: ${result.result}`
      );
    }

    return { deleted, result: result.result };
  } catch (error) {
    console.warn(
      `Cloudinary cleanup failed for ${asset.publicId}: ${error.message}`
    );

    return { deleted: false, error: error.message };
  }
};

export default {
  parseCloudinaryAsset,
  deleteCloudinaryAsset,
};
