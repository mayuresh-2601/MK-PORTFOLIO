import {
  getCertificates,
  addCertificate,
  deleteCertificate,
} from "../models/certificateModel.js";

import {
  isSafeHttpUrl,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../utils/validation.js";

const MAX_TITLE_LENGTH = 255;
const MAX_ISSUER_LENGTH = 255;
const MAX_URL_LENGTH = 512;

/*
   Get All Certificates
 */

export const fetchCertificates = async (req, res, next) => {
  try {
    const certificates = await getCertificates();

    return res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Create Certificate
 */

export const createCertificate = async (req, res, next) => {
  try {
    const { title, issuer, link } = req.body || {};

    const normalizedTitle = normalizeRequiredText(
      title,
      MAX_TITLE_LENGTH
    );

    if (normalizedTitle === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Certificate title must be 255 characters or fewer.",
      });
    }

    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Certificate title is required.",
      });
    }

    const issuerText = normalizeRequiredText(
      issuer,
      MAX_ISSUER_LENGTH
    );

    if (issuerText === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Issuer must be 255 characters or fewer.",
      });
    }

    const normalizedIssuer = issuerText || "Unknown";

    const normalizedLink = normalizeOptionalText(
      link,
      MAX_URL_LENGTH
    );

    if (
      normalizedLink === undefined ||
      (normalizedLink && !isSafeHttpUrl(normalizedLink))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Certificate link must be a valid http:// or https:// link (max 512 characters).",
      });
    }

    const certificate = {
      title: normalizedTitle,
      issuer: normalizedIssuer,
      // Certificate artwork is optional: many credentials are represented by
      // an issuer link only, and the live production data relies on that.
      image: req.file ? req.file.path : null,
      link: normalizedLink,
    };

    const result = await addCertificate(certificate);

    return res.status(201).json({
      success: true,
      message: "Certificate created successfully.",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Delete Certificate
 */

export const removeCertificate = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID.",
      });
    }

    const result = await deleteCertificate(id);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Certificate deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
