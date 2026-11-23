import SEO from "./SEO";

/**
 * Shared layout for the privacy, terms and accessibility pages.
 *
 * These pages are plain static content. They exist so visitors and crawlers
 * can read the site's actual data practices instead of guessing from the UI.
 */
export default function LegalPage({
  title,
  description,
  path,
  updated,
  children,
}) {
  return (
    <section className="page page-section legal-page grid-pink">
      <SEO title={title} description={description} path={path} />

      <div className="section__inner legal-page__inner">
        <div className="legal-page__head reveal">
          <p className="meta text-ink">Policy / {updated}</p>
          <h1 className="display section-title">{title}</h1>
          <p className="legal-page__lead">{description}</p>
        </div>

        <div className="legal-page__body reveal" style={{ "--delay": "80ms" }}>
          {children}
        </div>

        <p className="legal-page__note">
          This page describes the application as it exists in the public
          repository. It is not legal advice.
        </p>
      </div>
    </section>
  );
}
