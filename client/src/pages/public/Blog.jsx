import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/common/SEO";
import BlogCard from "../../components/blog/BlogCard";
import { allTags, POSTS, searchPosts, tagSlug } from "../../lib/blog";

export default function Blog() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchPosts(query), [query]);
  const popularTags = allTags();

  return (
    <section className="page page-section blog-section grid-acid">
      <SEO
        title="Technical Blog — Architecture and Development Practice"
        description="Read technical articles about React and Vite, the full stack, Docker, security, deployment and the projects built at MK-PORTFOLIO."
        path="/blog"
      />

      <div className="section__inner">
        <div className="blog-head">
          <div className="reveal">
            <p className="meta text-ink">Blog / 03</p>
            <h1 className="display section-title">
              Engineering <br />
              in practice
            </h1>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            Technical articles written to verify, not just describe, the
            architecture behind the portfolio.
          </p>
        </div>

        <div className="blog-search reveal" style={{ "--delay": "140ms" }}>
          <label className="sr-only" htmlFor="blog-search">
            Search technical articles
          </label>
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search React, Docker, Node.js, Vite…"
            className="blog-search__input"
          />
          {results.length === 0 && (
            <p className="blog-search__empty">
              No articles match that search.
            </p>
          )}
          {results.length > 0 && POSTS.length > 0 && (
            <p className="blog-search__count">
              {results.length} of {POSTS.length} articles
            </p>
          )}
        </div>

        <div className="blog-taxonomy-row reveal">
          <h2 className="blog-taxonomy-title">Popular tags</h2>
          <ul className="blog-taxonomy-tags">
            {popularTags.map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  to={`/blog/tag/${tagSlug(tag)}`}
                  className="blog-taxonomy-tag"
                  aria-label={`View ${count} article${count === 1 ? "" : "s"} tagged ${tag}`}
                >
                  {tag} <span className="meta">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ul className="blog-grid">
          {results.map((post) => (
            <li key={post.slug}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
