import { useEffect } from "react";

/**
 * Per-page document metadata.
 *
 * The static `index.html` ships the homepage metadata, but a single-page
 * application serves the same HTML for every route. Search engines and social
 * scrapers therefore saw the homepage title, description and canonical URL on
 * every page. This component rewrites those tags whenever the route changes.
 */

const SITE_URL = "https://mk-portfolio-phi-silk.vercel.app";
// Use the 1200x630 social card for every route; the portrait image is not a
// valid summary_large_image aspect ratio.
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;

const upsertMeta = (attribute, value, attributes) => {
  let element = document.head.querySelector(
    `meta[${attribute}="${value}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }

  for (const [name, attributeValue] of Object.entries(attributes)) {
    if (attributeValue === null || attributeValue === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, attributeValue);
    }
  }

  return element;
};

const upsertCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
}) {
  useEffect(() => {
    const url = `${SITE_URL}${path === "/" ? "" : path}`;

    document.title = title;

    upsertMeta("name", "description", { content: description });
    upsertMeta("name", "robots", {
      content: noIndex ? "noindex, nofollow" : "index, follow",
    });

    upsertMeta("property", "og:title", { content: title });
    upsertMeta("property", "og:description", { content: description });
    upsertMeta("property", "og:url", { content: url });
    upsertMeta("property", "og:image", { content: image });
    upsertMeta("property", "og:type", { content: type });

    upsertMeta("name", "twitter:title", { content: title });
    upsertMeta("name", "twitter:description", { content: description });
    upsertMeta("name", "twitter:image", { content: image });

    upsertCanonical(url);
  }, [title, description, path, image, type, noIndex]);

  return null;
}
