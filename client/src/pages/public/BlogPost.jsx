import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Link2 } from "lucide-react";
import SEO from "../../components/common/SEO";
import BlogBlocks from "../../components/blog/BlogBlocks";
import TableOfContents from "../../components/blog/TableOfContents";
import BlogCard from "../../components/blog/BlogCard";
import { extractHeadings, formatDate, getPost, relatedPosts, tagSlug } from "../../lib/blog";

const SITE = "https://mk-portfolio-phi-silk.vercel.app";

const shareLinks = (post) => ({
  twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${post.title} — Read the full article:`)}&url=${encodeURIComponent(`${SITE}/blog/${post.slug}`)}`,
  linkedin: `https://www.linkedin.com/sharing/shareOffsite/?url=${encodeURIComponent(`${SITE}/blog/${post.slug}`)}`,
  copy: `${SITE}/blog/${post.slug}`,
});

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug || "");

  if (!post) {
    return (
      <section className="page page-section grid-acid">
        <SEO title="Post Not Found | Mayuresh Kasar" path="/blog" noIndex />
        <div className="section__inner">
          <h1 className="display section-title">Post not found</h1>
          <Link to="/blog" className="btn btn--black btn--pill">Back to the blog</Link>
        </div>
      </section>
    );
  }

  const headings = extractHeadings(post.blocks);
  const related = relatedPosts(post);
  const shares = shareLinks(post);

  const articleJsonLd = {
    "@type": "Article",
    "@id": `${SITE}/blog/${post.slug}#article`,
    url: `${SITE}/blog/${post.slug}`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Person", name: post.author, url: SITE },
    publisher: {
      "@type": "Person",
      name: "Mayuresh Kasar",
      url: SITE,
      description: "Full Stack Developer, Maharashtra, India.",
    },
    image: `${SITE}/og-cover.jpg`,
  };

  return (
    <section className="page page-section blog-post grid-acid">
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={articleJsonLd}
      />

      <div className="section__inner">
        <div className="blog-post__grid">
          <aside className="blog-post__toc" aria-label="Reading tools">
            <div className="blog-post__actions">
              <a
                href={shares.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="blog-post__action"
                aria-label={`Share ${post.title} on X (Twitter)`}
              >
                <span className="icon-x" aria-hidden="true">
                  ×
                </span>
                <span>Share</span>
              </a>
              <a
                href={shares.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="blog-post__action"
                aria-label={`Share ${post.title} on LinkedIn`}
              >
                <span className="icon-linkedin" aria-hidden="true">
                  linkedin
                </span>
                <span>Share</span>
              </a>
              <button
                type="button"
                className="blog-post__action blog-post__copy"
                onClick={() =>
                  navigator.clipboard?.writeText(shares.copy).catch(() => {})
                }
                aria-label="Copy article link"
              >
                <Link2 size={14} aria-hidden="true" />
                <span>Copy link</span>
              </button>
            </div>
            <TableOfContents headings={headings} />
          </aside>

          <article className="blog-post__article" itemScope itemType="https://schema.org/Article">
            <header className="blog-post__header">
              <p className="meta text-ink">Blog / {post.category}</p>
              <h1 className="display section-title" itemProp="headline">
                {post.title}
              </h1>
              <p className="blog-post__byline meta text-ink">
                By {post.author} on {formatDate(post.date)} · {post.readingTime} min read
                {post.updated && ` · Updated ${formatDate(post.updated)}`}
              </p>
              <ul className="blog-post__tags" aria-label="Article tags">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link to={`/blog/tag/${tagSlug(tag)}`} className="blog-tag">
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </header>

            <BlogBlocks blocks={post.blocks} />

            <div className="blog-post__author-card">
              <h3 className="blog-post__author-name">About {post.author}</h3>
              <p>
                Full Stack Developer, Maharashtra, India. Building secure,
                scalable web applications with React.js, Node.js, Express.js,
                MySQL/TiDB, Docker, and CI/CD.
              </p>
              <Link
                to="/contact"
                className="btn btn--sm"
                aria-label="Contact Mayuresh Kasar"
              >
                Contact
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <aside className="blog-post__aside">
            {related.length > 0 && (
              <section aria-labelledby="related-posts" className="blog-post__related">
                <h2 id="related-posts" className="blog-taxonomy-title">
                  Related articles
                </h2>
                <ul>
                  {related.map((relatedPost) => (
                    <li key={relatedPost.slug}>
                      <BlogCard post={relatedPost} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
