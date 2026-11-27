import { Link } from "react-router-dom";
import { formatDate, tagSlug } from "../../lib/blog";

export default function BlogCard({ post }) {
  return (
    <article className="blog-card">
      {post.featured && <span className="blog-card-badge">Featured</span>}
      <Link to={`/blog/${post.slug}`} className="blog-card-title">
        <h2>{post.title}</h2>
      </Link>
      <p className="blog-card-description">{post.description}</p>
      <div className="blog-card-meta">
        <span>{formatDate(post.date)}</span>
        <span className="blog-card-middot" aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
      </div>
      {post.tags.length > 0 && (
        <ul className="blog-card-tags" aria-label="Article tags">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                to={`/blog/tag/${tagSlug(tag)}`}
                className="blog-tag"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
