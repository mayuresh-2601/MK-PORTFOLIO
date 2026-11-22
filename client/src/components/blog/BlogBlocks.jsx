import { useState } from "react";
import { Link } from "react-router-dom";
import { tagSlug } from "../../lib/blog";

const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Copy is a progressive enhancement. */
    }
  };

  return (
    <button
      type="button"
      className="blog__copy"
      onClick={handleClick}
      aria-live="polite"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

export default function BlogBlocks({ blocks = [] }) {
  return (
    <div className="blog__content" data-blocks={blocks.length}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        const id = block.id || block.slug;

        switch (block.type) {
          case "p":
            return (
              <p key={key} className="blog__paragraph">
                {block.text}
              </p>
            );
          case "h2":
          case "h3": {
            const Heading = block.type === "h2" ? "h2" : "h3";
            return (
              <Heading key={key} id={id} className="blog__heading">
                {block.text}
              </Heading>
            );
          }
          case "code": {
            const code = (block.code || "").replace(/\n$/, "");
            return (
              <figure key={key} className="blog__code-block">
                <figcaption className="sr-only">{block.lang}</figcaption>
                <pre className="blog__code">
                  <code>{code}</code>
                </pre>
                <CopyButton code={code} />
              </figure>
            );
          }
          case "list": {
            const items = block.items || [];
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={key} className="blog__list">
                {items.map((item, itemIndex) => (
                  <li key={`${itemIndex}-${item.slice(0, 12)}`}>{item}</li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote key={key} className="blog__quote">
                <p>{block.text}</p>
                {block.cite && <cite>{block.cite}</cite>}
              </blockquote>
            );
          case "callout":
            return (
              <aside
                key={key}
                className={`blog__callout blog__callout--${block.variant || "note"}`}
                aria-label={`${block.title || "Note"}`}
              >
                {block.title && (
                  <p className="blog__callout-title">{block.title}</p>
                )}
                <p>{block.text}</p>
              </aside>
            );
          default:
            return (
              <p key={key} className="blog__paragraph">
                {(block.text || "")}
              </p>
            );
        }
      })}
    </div>
  );
}

export const BlogTag = ({ tag }) => (
  <Link
    to={`/blog/tag/${tagSlug(tag)}`}
    className="blog__tag"
    aria-label={`Posts tagged ${tag}`}
  >
    {tag}
  </Link>
);
