import { Link } from "react-router-dom";
import { formatDate, tagSlug } from "../../lib/blog";

export default function BlogCard({ post }) {
  return (
    <article className="blog__card">
      {post.featured && <span className="blog__card-badge">Featured</span>}
      <Link to={`/blog/${post.slug}`} className="blog__card-title">
        <h2>{post.title}</h2>
      </Link>
      <p className="blog__card-description">{post.description}</p>
      <div className="blog__card-meta">
        <span>{formatDate(post.date)}</span>
        <span className="blog__card-middot">·</span>
        <span>{post.readingTime} min read</span>
      </div>
      {post.tags.length > 0 && (
        <ul className="blog__card-tags" aria-label="Article tags">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                to={`/blog/tag/${tagSlug(tag)}`}
                className="blog__tag blog__tag--inline"
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
