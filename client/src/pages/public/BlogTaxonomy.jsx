import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../../components/common/SEO";
import BlogCard from "../../components/blog/BlogCard";
import { allCategories, postsByCategory, postsByTag, searchPosts, tagSlug } from "../../lib/blog";

export default function BlogTaxonomy() {
  const { tag, category, slug } = useParams();
  const [query, setQuery] = useState("");

  const mode = category ? "category" : "tag";

  const allPosts = useMemo(
    () =>
      mode === "category" ? postsByCategory(category || "") : postsByTag(tag || ""),
    [mode, category, tag]
  );

  const results = useMemo(() => searchPosts(query), [query]);
  const visible = query ? results : allPosts;

  return (
    <section className="page page-section grid-acid">
      <SEO
        title={
          mode === "category"
            ? `${category} Articles | Mayuresh Kasar — Full Stack Developer`
            : `${tag || slug} Tag | Mayuresh Kasar — Full Stack Developer`
        }
        description={
          mode === "category"
            ? `Technical articles about ${category || ""} development.`
            : `Technical articles tagged "${tag || slug}".`
        }
        path={
          mode === "category" ? `/blog/category/${category}` : `/blog/tag/${tag}`
        }
      />

      <div className="section__inner">
        <div className="blog-head">
          <div className="reveal">
            <p className="meta text-ink">Blog / 04</p>
            <h1 className="display section-title">
              {mode === "category" ? category : `#${tag}`}
            </h1>
          </div>
          <p className="meta text-ink reveal" style={{ "--delay": "100ms" }}>
            {allPosts.length} {allPosts.length === 1 ? "article" : "articles"}
            {query ? ` matching "${query}"` : ""}
          </p>
        </div>

        <div className="blog-taxonomy-nav">
          <Link to="/blog" className="blog-taxonomy-back">
            ← Back to the blog
          </Link>
          <ul className="blog-taxonomy-crumbs" aria-label="Related topics">
            {allCategories().map(({ category: name, count }) => (
              <li key={name}>
                <Link
                  to={`/blog/category/${tagSlug(name)}`}
                  className={`blog-taxonomy-crumb${name === category ? " is-active" : ""}`}
                >
                  {name} <span>({count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="blog-search reveal">
          <label className="sr-only" htmlFor="blog-taxonomy-search">
            Filter articles
          </label>
          <input
            id="blog-taxonomy-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title, tag or text…"
            className="blog-search__input"
          />
        </div>

        <ul className="blog-grid">
          {visible.map((post) => (
            <li key={post.slug}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="blog-empty">No articles in this view.</p>
        )}
      </div>
    </section>
  );
}
